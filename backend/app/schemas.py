"""
Pydantic request/response DTOs.

Kept separate from the SQLModel table models (app.models) because the API
shape genuinely differs from the storage shape in a few places: creating a
question accepts a nested list of options in one call, the forms list needs
a computed `response_count` that isn't a column, and a response's answers are
read back joined with the question title/type for display.
"""

from datetime import datetime, timezone
from typing import Annotated, Optional

from pydantic import BaseModel, Field, PlainSerializer

from app.models import FormStatus, QuestionType


def _utc_iso(dt: datetime) -> str:
    """SQLite drops tzinfo on the round trip, so a naive value read back from
    the DB is always actually UTC (every datetime this app writes comes from
    `utcnow()`). Without re-attaching tzinfo here, the serialized string has
    no offset/`Z` suffix, and browsers parse it as *local* time instead of
    UTC — silently skewing every "time ago" display by the client's UTC
    offset (e.g. a form created seconds ago reads "6 hours ago" in IST)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


UTCDateTime = Annotated[datetime, PlainSerializer(_utc_iso, return_type=str)]


# ---- Question options ----

class QuestionOptionIn(BaseModel):
    label: str
    order_index: int = 0


class QuestionOptionOut(BaseModel):
    id: int
    label: str
    order_index: int

    model_config = {"from_attributes": True}


# ---- Questions ----

class QuestionCreate(BaseModel):
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool = False
    order_index: Optional[int] = None
    placeholder: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    options: list[QuestionOptionIn] = Field(default_factory=list)


class QuestionUpdate(BaseModel):
    type: Optional[QuestionType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    placeholder: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    # When provided, fully replaces the question's option set.
    options: Optional[list[QuestionOptionIn]] = None


class QuestionOut(BaseModel):
    id: int
    form_id: int
    type: QuestionType
    title: str
    description: Optional[str]
    required: bool
    order_index: int
    placeholder: Optional[str]
    min_value: Optional[float]
    max_value: Optional[float]
    options: list[QuestionOptionOut]

    model_config = {"from_attributes": True}


class ReorderRequest(BaseModel):
    ordered_ids: list[int]


# ---- Forms ----

class FormCreate(BaseModel):
    title: str
    description: Optional[str] = None


class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thank_you_message: Optional[str] = None
    theme: Optional[str] = None


class FormListItem(BaseModel):
    id: int
    title: str
    status: FormStatus
    slug: str
    response_count: int
    created_at: UTCDateTime
    updated_at: UTCDateTime

    model_config = {"from_attributes": True}


class FormOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: FormStatus
    slug: str
    thank_you_message: str
    theme: Optional[str]
    created_at: UTCDateTime
    updated_at: UTCDateTime
    published_at: Optional[UTCDateTime]
    questions: list[QuestionOut]

    model_config = {"from_attributes": True}


# ---- Respondent flow ----

class ResponseStartOut(BaseModel):
    response_id: int


class AnswerSubmit(BaseModel):
    """One field is expected to be populated, matching the question's type."""

    value_text: Optional[str] = None
    value_number: Optional[float] = None
    value_bool: Optional[bool] = None
    selected_option_id: Optional[int] = None


class AnswerOut(BaseModel):
    question_id: int
    question_title: str
    question_type: QuestionType
    value_text: Optional[str]
    value_number: Optional[float]
    value_bool: Optional[bool]
    selected_option_label: Optional[str]


class ResponseListItem(BaseModel):
    id: int
    started_at: UTCDateTime
    submitted_at: Optional[UTCDateTime]
    is_complete: bool


class ResponseDetail(BaseModel):
    id: int
    form_id: int
    started_at: UTCDateTime
    submitted_at: Optional[UTCDateTime]
    is_complete: bool
    answers: list[AnswerOut]


# ---- Summary stats ----

class ChoiceCount(BaseModel):
    label: str
    count: int


class QuestionSummary(BaseModel):
    question_id: int
    title: str
    type: QuestionType
    answered_count: int
    choice_counts: Optional[list[ChoiceCount]] = None
    true_count: Optional[int] = None
    false_count: Optional[int] = None
    average: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None


class FormSummary(BaseModel):
    form_id: int
    total_responses: int
    completed_responses: int
    questions: list[QuestionSummary]
