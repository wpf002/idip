"""Face-challenge question generation and scoring.

When door staff suspect the bearer does not match the ID photo, the app
generates 3-5 questions answerable only from the physical card, then scores
the number of failures into a risk delta.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from .parsed_id import ParsedID
from .risk_scorer import flag
from .violations import (
    CHALLENGE_FAIL_1,
    CHALLENGE_FAIL_2,
    CHALLENGE_FAIL_3,
    CHALLENGE_PASSED,
    Violation,
)

_ZODIAC = [
    (1, 20, "Capricorn"), (2, 18, "Aquarius"), (3, 20, "Pisces"),
    (4, 20, "Aries"), (5, 21, "Taurus"), (6, 21, "Gemini"),
    (7, 22, "Cancer"), (8, 22, "Leo"), (9, 22, "Virgo"),
    (10, 23, "Libra"), (11, 22, "Scorpio"), (12, 21, "Sagittarius"),
    (12, 31, "Capricorn"),
]


def zodiac_sign(dob: str | None) -> str | None:
    if not dob:
        return None
    try:
        d = date.fromisoformat(dob)
    except ValueError:
        return None
    for month, day, sign in _ZODIAC:
        if (d.month, d.day) <= (month, day):
            return sign
    return "Capricorn"


@dataclass
class ChallengeQuestion:
    id: str
    prompt: str
    answer: str
    source_field: str

    def as_dict(self, *, include_answer: bool = False) -> dict:
        data = {"id": self.id, "prompt": self.prompt, "source_field": self.source_field}
        if include_answer:
            data["answer"] = self.answer
        return data


def generate_questions(parsed: ParsedID) -> list[ChallengeQuestion]:
    questions: list[ChallengeQuestion] = []
    sign = zodiac_sign(parsed.date_of_birth)
    if sign:
        questions.append(ChallengeQuestion("zodiac", "What is your star sign?", sign, "date_of_birth"))
    if parsed.height:
        questions.append(ChallengeQuestion("height", "What height is on this ID?", parsed.height, "height"))
    if parsed.eye_color:
        questions.append(ChallengeQuestion("eye_color", "What eye color is listed?", parsed.eye_color, "eye_color"))
    if parsed.postal_code:
        questions.append(ChallengeQuestion("zip", "What ZIP code is on the ID?", parsed.postal_code, "postal_code"))
    if parsed.middle_name:
        questions.append(ChallengeQuestion("middle", "What is your middle name or initial?", parsed.middle_name, "middle_name"))
    return questions[:5]


def challenge_available(parsed: ParsedID) -> bool:
    return len(generate_questions(parsed)) >= 3


def score_challenge(failures: int) -> Violation:
    """Map number of failed questions to a risk-delta violation."""
    if failures <= 0:
        return flag(CHALLENGE_PASSED, message="passed all challenge questions")
    if failures == 1:
        return flag(CHALLENGE_FAIL_1, message="failed 1 challenge question")
    if failures == 2:
        return flag(CHALLENGE_FAIL_2, message="failed 2 challenge questions")
    return flag(CHALLENGE_FAIL_3, message=f"failed {failures} challenge questions")


def grade_answers(
    questions: list[ChallengeQuestion], answers: dict[str, str]
) -> tuple[int, Violation]:
    """Grade submitted answers (case-insensitive). Returns (failures, violation)."""
    failures = 0
    for q in questions:
        given = (answers.get(q.id) or "").strip().lower()
        if given != q.answer.strip().lower():
            failures += 1
    return failures, score_challenge(failures)
