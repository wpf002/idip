"""Generate per-state AAMVA rule JSON files for all 50 states + DC.

License-number patterns are approximate per-jurisdiction formats. TX and GA are
the primary test states and carry regulatory notes (TABC / O.C.G.A. §3-3-23).
Run: python scripts/gen_state_rules.py
"""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "app" / "state_rules"

COMMON_REQUIRED = ["DCS", "DAC", "DBB", "DBA", "DBC", "DAQ", "DAG", "DAI", "DAJ", "DAK"]
COMMON_OPTIONAL = ["DBD", "DAD", "DAU", "DAY", "DAZ"]
AAMVA_VERSIONS = ["06", "07", "08", "09", "10"]

# (state_code, state_name, license_regex, min_len, max_len, charset)
STATES = [
    ("AL", "Alabama", r"^[0-9]{1,8}$", 1, 8, "numeric"),
    ("AK", "Alaska", r"^[0-9]{1,7}$", 1, 7, "numeric"),
    ("AZ", "Arizona", r"^([A-Z][0-9]{8}|[0-9]{9})$", 8, 9, "alphanumeric"),
    ("AR", "Arkansas", r"^[0-9]{4,9}$", 4, 9, "numeric"),
    ("CA", "California", r"^[A-Z][0-9]{7}$", 8, 8, "alphanumeric"),
    ("CO", "Colorado", r"^([0-9]{9}|[A-Z][0-9]{3,6}|[A-Z]{2}[0-9]{2,5})$", 9, 9, "alphanumeric"),
    ("CT", "Connecticut", r"^[0-9]{9}$", 9, 9, "numeric"),
    ("DE", "Delaware", r"^[0-9]{1,7}$", 1, 7, "numeric"),
    ("DC", "District of Columbia", r"^[0-9]{7,9}$", 7, 9, "numeric"),
    ("FL", "Florida", r"^[A-Z][0-9]{12}$", 13, 13, "alphanumeric"),
    ("GA", "Georgia", r"^[0-9]{7,9}$", 7, 9, "numeric"),
    ("HI", "Hawaii", r"^([A-Z][0-9]{8}|[0-9]{9})$", 9, 9, "alphanumeric"),
    ("ID", "Idaho", r"^([A-Z]{2}[0-9]{6}[A-Z]|[0-9]{9})$", 9, 9, "alphanumeric"),
    ("IL", "Illinois", r"^[A-Z][0-9]{11,12}$", 12, 13, "alphanumeric"),
    ("IN", "Indiana", r"^[0-9]{10}$", 10, 10, "numeric"),
    ("IA", "Iowa", r"^([0-9]{9}|[0-9]{3}[A-Z]{2}[0-9]{4})$", 9, 9, "alphanumeric"),
    ("KS", "Kansas", r"^([A-Z][0-9]{8}|[0-9]{9})$", 9, 9, "alphanumeric"),
    ("KY", "Kentucky", r"^([A-Z][0-9]{8,9}|[0-9]{9})$", 9, 9, "alphanumeric"),
    ("LA", "Louisiana", r"^[0-9]{1,9}$", 1, 9, "numeric"),
    ("ME", "Maine", r"^[0-9]{7,8}$", 7, 8, "numeric"),
    ("MD", "Maryland", r"^[A-Z][0-9]{12}$", 13, 13, "alphanumeric"),
    ("MA", "Massachusetts", r"^([A-Z][0-9]{8}|[0-9]{9})$", 9, 9, "alphanumeric"),
    ("MI", "Michigan", r"^[A-Z][0-9]{12}$", 13, 13, "alphanumeric"),
    ("MN", "Minnesota", r"^[A-Z][0-9]{12}$", 13, 13, "alphanumeric"),
    ("MS", "Mississippi", r"^[0-9]{9}$", 9, 9, "numeric"),
    ("MO", "Missouri", r"^([A-Z][0-9]{5,9}|[0-9]{9})$", 9, 9, "alphanumeric"),
    ("MT", "Montana", r"^([0-9]{9}|[0-9]{13,14})$", 9, 14, "numeric"),
    ("NE", "Nebraska", r"^[A-Z][0-9]{6,8}$", 7, 9, "alphanumeric"),
    ("NV", "Nevada", r"^[0-9]{9,12}$", 9, 12, "numeric"),
    ("NH", "New Hampshire", r"^[0-9]{2}[A-Z]{3}[0-9]{5}$", 10, 10, "alphanumeric"),
    ("NJ", "New Jersey", r"^[A-Z][0-9]{14}$", 15, 15, "alphanumeric"),
    ("NM", "New Mexico", r"^[0-9]{8,9}$", 8, 9, "numeric"),
    ("NY", "New York", r"^[0-9]{9}$", 9, 9, "numeric"),
    ("NC", "North Carolina", r"^[0-9]{1,12}$", 1, 12, "numeric"),
    ("ND", "North Dakota", r"^([A-Z]{3}[0-9]{6}|[0-9]{9})$", 9, 9, "alphanumeric"),
    ("OH", "Ohio", r"^[A-Z]{2}[0-9]{6}$", 8, 8, "alphanumeric"),
    ("OK", "Oklahoma", r"^([A-Z][0-9]{9}|[0-9]{9})$", 9, 10, "alphanumeric"),
    ("OR", "Oregon", r"^[0-9]{1,9}$", 1, 9, "numeric"),
    ("PA", "Pennsylvania", r"^[0-9]{8}$", 8, 8, "numeric"),
    ("RI", "Rhode Island", r"^([0-9]{7}|[A-Z][0-9]{6})$", 7, 7, "alphanumeric"),
    ("SC", "South Carolina", r"^[0-9]{5,11}$", 5, 11, "numeric"),
    ("SD", "South Dakota", r"^[0-9]{6,10}$", 6, 10, "numeric"),
    ("TN", "Tennessee", r"^[0-9]{7,9}$", 7, 9, "numeric"),
    ("TX", "Texas", r"^[0-9]{8}$", 8, 8, "numeric"),
    ("UT", "Utah", r"^[0-9]{4,10}$", 4, 10, "numeric"),
    ("VT", "Vermont", r"^([0-9]{8}|[0-9]{7}[A-Z])$", 8, 8, "alphanumeric"),
    ("VA", "Virginia", r"^([A-Z][0-9]{8,11}|[0-9]{9})$", 9, 12, "alphanumeric"),
    ("WA", "Washington", r"^[A-Z0-9]{12}$", 12, 12, "alphanumeric"),
    ("WV", "West Virginia", r"^([0-9]{7}|[A-Z]{1,2}[0-9]{5,6})$", 7, 7, "alphanumeric"),
    ("WI", "Wisconsin", r"^[A-Z][0-9]{13}$", 14, 14, "alphanumeric"),
    ("WY", "Wyoming", r"^[0-9]{9,10}$", 9, 10, "numeric"),
]

NOTES = {
    "TX": "Texas Alcoholic Beverage Commission (TABC) regulations.",
    "GA": "Georgia O.C.G.A. §3-3-23 dram shop liability.",
}


def build(state_code, state_name, regex, min_len, max_len, charset) -> dict:
    expired_weight = 50 if state_code == "TX" else 40
    rule = {
        "state_code": state_code,
        "state_name": state_name,
        "version": "1.0",
        "aamva_versions_supported": AAMVA_VERSIONS,
        "license_number": {
            "regex": regex,
            "min_length": min_len,
            "max_length": max_len,
            "allowed_characters": charset,
        },
        "required_fields": COMMON_REQUIRED,
        "optional_fields": COMMON_OPTIONAL,
        "date_rules": {
            "dob_cannot_be_future": True,
            "expiration_cannot_be_past_for_valid_result": True,
            "minimum_issue_age": 15,
            "maximum_age": 110,
        },
        "address_rules": {
            "postal_code_regex": r"^[0-9]{5}(-[0-9]{4})?$",
            "state_must_match_jurisdiction": False,
        },
        "fraud_indicators": {
            "missing_required_field_weight": 25,
            "regex_mismatch_weight": 25,
            "expired_weight": expired_weight,
            "duplicate_scan_weight": 20,
            "state_mismatch_weight": 20,
        },
        "result_thresholds": {"allow_max": 30, "review_max": 70, "deny_min": 71},
        "min_retention_days": 365,
    }
    if state_code in NOTES:
        rule["regulatory_notes"] = NOTES[state_code]
    return rule


def build_default() -> dict:
    rule = build("XX", "Default", r"^[A-Z0-9]{1,20}$", 1, 20, "alphanumeric")
    rule["state_code"] = "DEFAULT"
    rule["state_name"] = "Default / Unknown jurisdiction"
    rule["address_rules"]["state_must_match_jurisdiction"] = False
    return rule


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    written = 0
    for row in STATES:
        rule = build(*row)
        (OUT / f"{row[0]}.json").write_text(json.dumps(rule, indent=2) + "\n")
        written += 1
    (OUT / "DEFAULT.json").write_text(json.dumps(build_default(), indent=2) + "\n")
    written += 1
    print(f"wrote {written} state rule files to {OUT}")


if __name__ == "__main__":
    main()
