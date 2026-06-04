"""Unit tests for the risk scorer."""
from app.services.risk_scorer import (
    ALLOW,
    DENY,
    REVIEW,
    RISK_WEIGHTS,
    flag,
    map_result,
    score_risk,
)
from app.services.violations import (
    CHALLENGE_FAIL_1,
    CHALLENGE_FAIL_2,
    CHALLENGE_FAIL_3,
    CHALLENGE_PASSED,
    DUPLICATE_SCAN,
    EXPIRED,
    FUTURE_DOB,
    MANUAL_ENTRY,
    MRZ_CHECK_DIGIT_FAILURE,
    REPEAT_OFFENDER,
    UNDERAGE,
)


def test_no_violations_is_allow():
    res = score_risk([])
    assert res.score == 0
    assert res.result == ALLOW


def test_underage_is_deny():
    res = score_risk([flag(UNDERAGE)])
    assert res.score == 100
    assert res.result == DENY


def test_future_dob_is_review():
    res = score_risk([flag(FUTURE_DOB)])
    assert res.score == 50
    assert res.result == REVIEW


def test_expired_default_weight_is_review():
    res = score_risk([flag(EXPIRED)])
    assert res.score == 40
    assert res.result == REVIEW


def test_manual_entry_only_is_allow():
    res = score_risk([flag(MANUAL_ENTRY)])
    assert res.score == 15
    assert res.result == ALLOW


def test_duplicate_scan_only_is_allow():
    res = score_risk([flag(DUPLICATE_SCAN)])
    assert res.score == 20
    assert res.result == ALLOW


def test_repeat_offender_at_allow_boundary():
    res = score_risk([flag(REPEAT_OFFENDER)])
    assert res.score == 30
    assert res.result == ALLOW


def test_mrz_check_digit_failure_is_review():
    res = score_risk([flag(MRZ_CHECK_DIGIT_FAILURE)])
    assert res.score == 35
    assert res.result == REVIEW


def test_score_clamped_at_100():
    res = score_risk([flag(UNDERAGE), flag(EXPIRED), flag(MANUAL_ENTRY)])
    assert res.score == 100


def test_score_clamped_at_zero():
    res = score_risk([flag(CHALLENGE_PASSED)])
    assert res.score == 0
    assert res.result == ALLOW


def test_challenge_fail_1_is_allow():
    res = score_risk([flag(CHALLENGE_FAIL_1)])
    assert res.score == 15
    assert res.result == ALLOW


def test_challenge_fail_2_is_review():
    res = score_risk([flag(CHALLENGE_FAIL_2)])
    assert res.score == 35
    assert res.result == REVIEW


def test_challenge_fail_3_is_review():
    res = score_risk([flag(CHALLENGE_FAIL_3)])
    assert res.score == 60
    assert res.result == REVIEW


def test_map_result_boundaries():
    assert map_result(0) == ALLOW
    assert map_result(30) == ALLOW
    assert map_result(31) == REVIEW
    assert map_result(70) == REVIEW
    assert map_result(71) == DENY
    assert map_result(100) == DENY


def test_flags_are_carried_into_result():
    res = score_risk([flag(EXPIRED), flag(MANUAL_ENTRY)])
    codes = {f["code"] for f in res.flags}
    assert codes == {EXPIRED, MANUAL_ENTRY}


def test_canonical_weights_match_spec():
    assert RISK_WEIGHTS[UNDERAGE] == 100
    assert RISK_WEIGHTS[FUTURE_DOB] == 50
    assert RISK_WEIGHTS[CHALLENGE_FAIL_3] == 60
    assert RISK_WEIGHTS[MRZ_CHECK_DIGIT_FAILURE] == 35
    assert RISK_WEIGHTS[REPEAT_OFFENDER] == 30
    assert RISK_WEIGHTS[DUPLICATE_SCAN] == 20
    assert RISK_WEIGHTS[MANUAL_ENTRY] == 15
    assert RISK_WEIGHTS[CHALLENGE_PASSED] == -10


def test_custom_thresholds_override():
    # Tighten thresholds so 20 becomes REVIEW.
    res = score_risk([flag(DUPLICATE_SCAN)], thresholds={"allow_max": 10, "review_max": 50})
    assert res.result == REVIEW
