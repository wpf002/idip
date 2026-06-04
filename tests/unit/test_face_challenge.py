"""Unit tests for the face-challenge system."""
from app.services.barcode_parser import parse_barcode
from app.services.face_challenge import (
    challenge_available,
    generate_questions,
    grade_answers,
    score_challenge,
    zodiac_sign,
)
from app.services.violations import (
    CHALLENGE_FAIL_1,
    CHALLENGE_FAIL_2,
    CHALLENGE_FAIL_3,
    CHALLENGE_PASSED,
)

from tests.factories import build_aamva, dl_fields


def test_zodiac_sign_capricorn():
    assert zodiac_sign("1990-01-15") == "Capricorn"


def test_zodiac_sign_leo():
    assert zodiac_sign("1990-08-10") == "Leo"


def test_generate_questions_from_dl():
    p = parse_barcode(build_aamva(dl_fields()))
    questions = generate_questions(p)
    assert len(questions) >= 3
    ids = {q.id for q in questions}
    assert "zodiac" in ids


def test_challenge_available_for_full_dl():
    p = parse_barcode(build_aamva(dl_fields()))
    assert challenge_available(p) is True


def test_score_challenge_zero_failures_passes():
    v = score_challenge(0)
    assert v.code == CHALLENGE_PASSED
    assert v.weight == -10


def test_score_challenge_one_failure():
    assert score_challenge(1).code == CHALLENGE_FAIL_1


def test_score_challenge_two_failures():
    assert score_challenge(2).code == CHALLENGE_FAIL_2


def test_score_challenge_three_or_more_failures():
    assert score_challenge(3).code == CHALLENGE_FAIL_3
    assert score_challenge(5).code == CHALLENGE_FAIL_3


def test_grade_answers_counts_failures_case_insensitive():
    p = parse_barcode(build_aamva(dl_fields(eye="BRO", postal="75001")))
    questions = generate_questions(p)
    answers = {q.id: q.answer for q in questions}
    # Corrupt one answer.
    answers[questions[0].id] = "WRONG"
    failures, violation = grade_answers(questions, answers)
    assert failures == 1
    assert violation.code == CHALLENGE_FAIL_1
