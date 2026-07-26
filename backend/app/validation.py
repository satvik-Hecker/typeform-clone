"""
Server-side answer validation. The frontend also validates (required fields,
email format, number range) for instant feedback, but the server is the
source of truth — a request that skips the UI must still be rejected.
"""

import re

from fastapi import HTTPException

from app.models import CHOICE_TYPES, Question, QuestionType
from app.schemas import AnswerSubmit

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def answer_is_empty(question_type: QuestionType, payload: AnswerSubmit) -> bool:
    if question_type in CHOICE_TYPES:
        return payload.selected_option_id is None
    if question_type == QuestionType.yes_no:
        return payload.value_bool is None
    if question_type in (QuestionType.number, QuestionType.rating):
        return payload.value_number is None
    # short_text, long_text, email
    return payload.value_text is None or payload.value_text.strip() == ""


def validate_answer_format(question: Question, payload: AnswerSubmit) -> None:
    """Raises HTTPException(422) if a *provided* value is malformed for the type."""
    if answer_is_empty(question.type, payload):
        return  # emptiness (vs. required-ness) is checked separately at submit time

    if question.type == QuestionType.email:
        if not EMAIL_RE.match(payload.value_text or ""):
            raise HTTPException(422, detail=f"'{payload.value_text}' is not a valid email address")

    elif question.type in (QuestionType.number, QuestionType.rating):
        value = payload.value_number
        if question.min_value is not None and value < question.min_value:
            raise HTTPException(422, detail=f"Value must be >= {question.min_value}")
        if question.max_value is not None and value > question.max_value:
            raise HTTPException(422, detail=f"Value must be <= {question.max_value}")

    elif question.type in CHOICE_TYPES:
        valid_ids = {option.id for option in question.options}
        if payload.selected_option_id not in valid_ids:
            raise HTTPException(422, detail="selected_option_id does not belong to this question")


def validate_required(question: Question, payload: AnswerSubmit | None) -> None:
    if not question.required:
        return
    if payload is None or answer_is_empty(question.type, payload):
        raise HTTPException(422, detail=f"'{question.title}' is required")
