"""
SQLModel table definitions.

Design notes (see JOURNAL.md for the full rationale):
- Normalized schema, no EAV: `question_options` is a real join table instead of
  a JSON blob, and `answers` uses a small set of typed nullable columns
  (value_text / value_number / value_bool / selected_option_id) chosen per
  question type, so aggregate queries (GROUP BY) don't need JSON parsing.
- `Response` rows are created when a respondent *starts* a form (not just on
  submit), so partial/incomplete fills are visible for completion-rate stats.
"""

import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class FormStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class QuestionType(str, enum.Enum):
    short_text = "short_text"
    long_text = "long_text"
    multiple_choice = "multiple_choice"
    dropdown = "dropdown"
    email = "email"
    number = "number"
    yes_no = "yes_no"
    rating = "rating"


CHOICE_TYPES = {QuestionType.multiple_choice, QuestionType.dropdown}


class Creator(SQLModel, table=True):
    __tablename__ = "creators"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    created_at: datetime = Field(default_factory=utcnow)

    forms: list["Form"] = Relationship(back_populates="creator")


class Form(SQLModel, table=True):
    __tablename__ = "forms"

    id: Optional[int] = Field(default=None, primary_key=True)
    creator_id: int = Field(foreign_key="creators.id", index=True)
    title: str
    description: Optional[str] = None
    status: FormStatus = Field(default=FormStatus.draft, index=True)
    slug: str = Field(unique=True, index=True)
    thank_you_message: str = Field(default="Thanks for completing this form!")
    theme: Optional[str] = None  # JSON-encoded: {primaryColor, fontFamily, backgroundColor}
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    published_at: Optional[datetime] = None

    creator: Optional[Creator] = Relationship(back_populates="forms")
    questions: list["Question"] = Relationship(
        back_populates="form",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "Question.order_index",
        },
    )
    responses: list["Response"] = Relationship(
        back_populates="form",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Question(SQLModel, table=True):
    __tablename__ = "questions"

    id: Optional[int] = Field(default=None, primary_key=True)
    form_id: int = Field(foreign_key="forms.id", index=True)
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool = Field(default=False)
    order_index: int = Field(default=0, index=True)
    placeholder: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    form: Optional[Form] = Relationship(back_populates="questions")
    options: list["QuestionOption"] = Relationship(
        back_populates="question",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "QuestionOption.order_index",
        },
    )
    answers: list["Answer"] = Relationship(back_populates="question")


class QuestionOption(SQLModel, table=True):
    __tablename__ = "question_options"

    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="questions.id", index=True)
    label: str
    order_index: int = Field(default=0)

    question: Optional[Question] = Relationship(back_populates="options")


class Response(SQLModel, table=True):
    __tablename__ = "responses"

    id: Optional[int] = Field(default=None, primary_key=True)
    form_id: int = Field(foreign_key="forms.id", index=True)
    started_at: datetime = Field(default_factory=utcnow)
    submitted_at: Optional[datetime] = None
    is_complete: bool = Field(default=False, index=True)

    form: Optional[Form] = Relationship(back_populates="responses")
    answers: list["Answer"] = Relationship(
        back_populates="response",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Answer(SQLModel, table=True):
    __tablename__ = "answers"
    __table_args__ = (
        UniqueConstraint("response_id", "question_id", name="uq_answer_response_question"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    response_id: int = Field(foreign_key="responses.id", index=True)
    question_id: int = Field(foreign_key="questions.id", index=True)
    value_text: Optional[str] = None
    value_number: Optional[float] = None
    value_bool: Optional[bool] = None
    selected_option_id: Optional[int] = Field(default=None, foreign_key="question_options.id")
    created_at: datetime = Field(default_factory=utcnow)

    response: Optional[Response] = Relationship(back_populates="answers")
    question: Optional[Question] = Relationship(back_populates="answers")
