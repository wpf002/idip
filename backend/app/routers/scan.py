"""Scan, challenge, and offline-sync endpoints."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.rate_limiter import RateLimitExceeded, check_rate_limit
from ..database import get_db
from ..models.models import Location, Scan, WebhookConfig
from ..schemas import (
    ChallengeRequest,
    ChallengeResponse,
    ScanRequest,
    ScanResponse,
    StructuredScanRequest,
    SyncResponse,
    SyncResult,
)
from ..services import audit_logger
from ..services.decision_engine import run_pipeline
from ..services.face_challenge import generate_questions, grade_answers, score_challenge
from ..services.parsed_id import ParsedID
from ..services.pos_webhook import send_deny_webhook
from ..services.risk_scorer import flag, map_result, score_risk
from ..services.violations import DATA_MISMATCH, Violation
from .deps import get_current_location

router = APIRouter(prefix="/v1", tags=["scan"])

MAX_SYNC_RECORDS = 500


async def _fire_deny_webhook(location_id: str, scan_payload: dict) -> None:
    """Best-effort DENY webhook delivery (runs in background)."""
    from ..database import async_session_factory

    async with async_session_factory() as session:
        cfg = await session.scalar(
            select(WebhookConfig)
            .where(WebhookConfig.location_id == location_id)
            .where(WebhookConfig.is_active.is_(True))
        )
        if not cfg:
            return
        try:
            await send_deny_webhook(
                endpoint_url=cfg.endpoint_url,
                secret=cfg.secret_key or "",
                scan=scan_payload,
            )
        except Exception:
            pass


@router.post("/scan", response_model=ScanResponse)
async def scan(
    payload: ScanRequest,
    background: BackgroundTasks,
    location: Location = Depends(get_current_location),
    db: AsyncSession = Depends(get_db),
) -> ScanResponse:
    try:
        await check_rate_limit(location.id)
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="scan rate limit exceeded",
            headers={"Retry-After": str(exc.retry_after)},
        )

    decision = await run_pipeline(
        db,
        raw_data=payload.barcode_data,
        document_input_type=payload.document_input_type,
        location_id=location.id,
        location_state=location.state_code,
        scan_method=payload.scan_method,
    )

    record = await audit_logger.log_scan(
        db,
        hashed_license_number=decision.hashed_license_number,
        state_code=decision.state,
        dob=decision.parsed.date_of_birth,
        age=decision.age,
        expiration_date=decision.parsed.expiration_date,
        risk_score=decision.risk_score,
        result=decision.result,
        flags=decision.flags,
        document_type=decision.parsed.document_type,
        location_id=location.id,
        staff_id=payload.staff_id,
        scan_method=payload.scan_method,
        synced=True,
        client_timestamp=payload.client_timestamp,
    )

    if decision.result == "DENY":
        background.add_task(
            _fire_deny_webhook,
            location.id,
            {
                "scan_id": record.id,
                "result": decision.result,
                "risk_score": decision.risk_score,
                "state": decision.state,
                "timestamp": record.timestamp.isoformat(),
                "location_id": location.id,
            },
        )

    return ScanResponse(
        scan_id=record.id,
        timestamp=record.timestamp,
        document_type=decision.parsed.document_type,
        age=decision.age,
        is_valid_age=decision.is_valid_age,
        is_expired=decision.is_expired,
        risk_score=decision.risk_score,
        result=decision.result,
        flags=decision.flags,
        state=decision.state,
        name=decision.parsed.full_name or None,
        sex=decision.parsed.sex,
        height=decision.parsed.height,
        eye_color=decision.parsed.eye_color,
        hair_color=decision.parsed.hair_color,
        nationality=decision.parsed.nationality,
        issuing_country=decision.parsed.issuing_country,
        parse_errors=decision.parsed.parse_errors,
        challenge_available=decision.challenge_available,
        challenge_required=decision.challenge_required,
    )


@router.post("/scan/structured", response_model=ScanResponse)
async def scan_structured(
    payload: StructuredScanRequest,
    background: BackgroundTasks,
    location: Location = Depends(get_current_location),
    db: AsyncSession = Depends(get_db),
) -> ScanResponse:
    """Score fields already parsed on-device (e.g. by a dedicated ID-scanning
    SDK) through the same risk/rules/fraud pipeline."""
    try:
        await check_rate_limit(location.id)
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="scan rate limit exceeded",
            headers={"Retry-After": str(exc.retry_after)},
        )

    state = (payload.address_state or "").upper() or None
    parsed = ParsedID(
        document_type=payload.document_type,
        source="STRUCTURED",  # skips AAMVA/MRZ format checks — the SDK validated it
        first_name=payload.first_name,
        middle_name=payload.middle_name,
        last_name=payload.last_name,
        date_of_birth=payload.date_of_birth,
        expiration_date=payload.expiration_date,
        sex=payload.sex,
        height=payload.height,
        eye_color=payload.eye_color,
        license_number=payload.document_number,
        address_state=state,
        postal_code=payload.postal_code,
        state=state,
        nationality=payload.nationality,
        issuing_country=payload.issuing_country,
    )

    extra: list[Violation] = []
    if payload.data_match is False:
        extra.append(flag(DATA_MISMATCH, message="document data did not match (possible tamper)"))

    decision = await run_pipeline(
        db,
        parsed=parsed,
        extra_violations=extra,
        location_id=location.id,
        location_state=location.state_code,
        scan_method=payload.scan_method,
    )

    record = await audit_logger.log_scan(
        db,
        hashed_license_number=decision.hashed_license_number,
        state_code=decision.state,
        dob=decision.parsed.date_of_birth,
        age=decision.age,
        expiration_date=decision.parsed.expiration_date,
        risk_score=decision.risk_score,
        result=decision.result,
        flags=decision.flags,
        document_type=decision.parsed.document_type,
        location_id=location.id,
        staff_id=payload.staff_id,
        scan_method=payload.scan_method,
        synced=True,
        client_timestamp=payload.client_timestamp,
    )

    if decision.result == "DENY":
        background.add_task(
            _fire_deny_webhook,
            location.id,
            {
                "scan_id": record.id,
                "result": decision.result,
                "risk_score": decision.risk_score,
                "state": decision.state,
                "timestamp": record.timestamp.isoformat(),
                "location_id": location.id,
            },
        )

    return ScanResponse(
        scan_id=record.id,
        timestamp=record.timestamp,
        document_type=decision.parsed.document_type,
        age=decision.age,
        is_valid_age=decision.is_valid_age,
        is_expired=decision.is_expired,
        risk_score=decision.risk_score,
        result=decision.result,
        flags=decision.flags,
        state=decision.state,
        name=decision.parsed.full_name or None,
        sex=decision.parsed.sex,
        height=decision.parsed.height,
        eye_color=decision.parsed.eye_color,
        hair_color=decision.parsed.hair_color,
        nationality=decision.parsed.nationality,
        issuing_country=decision.parsed.issuing_country,
        parse_errors=decision.parsed.parse_errors,
        challenge_available=decision.challenge_available,
        challenge_required=decision.challenge_required,
    )


@router.post("/challenge", response_model=ChallengeResponse)
async def challenge(
    payload: ChallengeRequest,
    location: Location = Depends(get_current_location),
    db: AsyncSession = Depends(get_db),
) -> ChallengeResponse:
    scan_row = await db.get(Scan, payload.scan_id)
    if scan_row is None or scan_row.location_id != location.id:
        raise HTTPException(status_code=404, detail="scan not found")

    # Determine number of failures.
    if payload.failures is not None:
        failures = max(0, int(payload.failures))
        challenge_violation = score_challenge(failures)
    elif payload.answers is not None and payload.barcode_data:
        from ..services.decision_engine import detect_and_parse

        parsed: ParsedID = detect_and_parse(payload.barcode_data)
        questions = generate_questions(parsed)
        failures, challenge_violation = grade_answers(questions, payload.answers)
    else:
        raise HTTPException(
            status_code=422,
            detail="provide either 'failures' or 'answers'+'barcode_data'",
        )

    # Rebuild violations from stored flags, drop any prior challenge entries.
    prior = [
        Violation(f["code"], f.get("message", f["code"]), int(f.get("weight", 0)))
        for f in (scan_row.flags or [])
        if not f["code"].startswith("CHALLENGE_")
    ]
    prior.append(challenge_violation)
    risk = score_risk(prior)

    scan_row.risk_score = risk.score
    scan_row.result = risk.result
    scan_row.flags = risk.flags
    await db.commit()
    await db.refresh(scan_row)

    return ChallengeResponse(
        scan_id=scan_row.id,
        failures=failures,
        risk_score=scan_row.risk_score,
        result=scan_row.result,
        flags=scan_row.flags,
    )


@router.post("/sync", response_model=SyncResponse)
async def sync(
    records: list[ScanRequest],
    location: Location = Depends(get_current_location),
    db: AsyncSession = Depends(get_db),
) -> SyncResponse:
    if len(records) > MAX_SYNC_RECORDS:
        raise HTTPException(
            status_code=413, detail=f"max {MAX_SYNC_RECORDS} records per sync"
        )

    # Flush in client_timestamp chronological order (last-write-wins downstream).
    ordered = sorted(
        records,
        key=lambda r: r.client_timestamp or datetime.now(timezone.utc),
    )

    results: list[SyncResult] = []
    for rec in ordered:
        decision = await run_pipeline(
            db,
            raw_data=rec.barcode_data,
            document_input_type=rec.document_input_type,
            location_id=location.id,
            location_state=location.state_code,
            scan_method=rec.scan_method,
        )
        row = await audit_logger.log_scan(
            db,
            hashed_license_number=decision.hashed_license_number,
            state_code=decision.state,
            dob=decision.parsed.date_of_birth,
            age=decision.age,
            expiration_date=decision.parsed.expiration_date,
            risk_score=decision.risk_score,
            result=decision.result,
            flags=decision.flags,
            document_type=decision.parsed.document_type,
            location_id=location.id,
            staff_id=rec.staff_id,
            scan_method=rec.scan_method,
            synced=True,
            client_timestamp=rec.client_timestamp,
        )
        results.append(
            SyncResult(
                client_timestamp=rec.client_timestamp,
                scan_id=row.id,
                result=decision.result,
                risk_score=decision.risk_score,
            )
        )

    return SyncResponse(synced=len(results), results=results)
