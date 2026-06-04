"""State-level compliance configuration loader.

Thin wrapper over the state rules engine that resolves the effective rule set
for a location (which may pin a state_code) or a parsed document.
"""
from __future__ import annotations

from . import state_rules_engine
from .parsed_id import ParsedID


def rules_for(state_code: str | None) -> dict:
    return state_rules_engine.load_rules(state_code)


def rules_for_document(parsed: ParsedID, *, location_state: str | None = None) -> dict:
    state = parsed.state or location_state
    return state_rules_engine.load_rules(state)


def expired_weight(rules: dict) -> int:
    return int(state_rules_engine.fraud_weights(rules)["expired_weight"])


def duplicate_weight(rules: dict) -> int:
    return int(state_rules_engine.fraud_weights(rules)["duplicate_scan_weight"])


def thresholds(rules: dict) -> dict:
    return state_rules_engine.thresholds(rules)
