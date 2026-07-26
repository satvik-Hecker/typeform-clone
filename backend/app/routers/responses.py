"""Creator-side results: response list/detail, per-question summary stats, CSV export."""

import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.database import get_session
from app.models import CHOICE_TYPES, Answer, Question, QuestionType, Response
from app.routers.forms import get_form_or_404
from app.schemas import AnswerOut, ChoiceCount, FormSummary, QuestionSummary, ResponseDetail, ResponseListItem

router = APIRouter()


@router.get("/{form_id}/responses", response_model=list[ResponseListItem])
def list_responses(form_id: int, session: Session = Depends(get_session)):
    get_form_or_404(form_id, session)
    return session.exec(
        select(Response).where(Response.form_id == form_id).order_by(Response.started_at.desc())
    ).all()


# NOTE: this static "/export" route must be registered before the dynamic
# "/{response_id}" route below, otherwise Starlette's routing (which matches
# path segments before FastAPI validates the {response_id}: int type) would
# hand "export" to that route first and fail with a 422.
@router.get("/{form_id}/responses/export")
def export_responses_csv(form_id: int, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)
    responses = session.exec(
        select(Response).where(Response.form_id == form_id).order_by(Response.started_at)
    ).all()

    option_labels = {option.id: option.label for q in form.questions for option in q.options}

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["response_id", "started_at", "submitted_at", "is_complete"] + [q.title for q in form.questions]
    )

    for response in responses:
        answers_by_question = {a.question_id: a for a in response.answers}
        row = [
            response.id,
            response.started_at.isoformat(),
            response.submitted_at.isoformat() if response.submitted_at else "",
            response.is_complete,
        ]
        for question in form.questions:
            row.append(_format_answer_for_csv(question, answers_by_question.get(question.id), option_labels))
        writer.writerow(row)

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=form-{form_id}-responses.csv"},
    )


def _format_answer_for_csv(question: Question, answer: Answer | None, option_labels: dict[int, str]) -> str:
    if not answer:
        return ""
    if question.type in CHOICE_TYPES:
        return option_labels.get(answer.selected_option_id, "") if answer.selected_option_id else ""
    if question.type == QuestionType.yes_no:
        return "" if answer.value_bool is None else ("Yes" if answer.value_bool else "No")
    if question.type in (QuestionType.number, QuestionType.rating):
        return "" if answer.value_number is None else str(answer.value_number)
    return answer.value_text or ""


@router.get("/{form_id}/responses/{response_id}", response_model=ResponseDetail)
def get_response(form_id: int, response_id: int, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)
    response = session.get(Response, response_id)
    if not response or response.form_id != form_id:
        raise HTTPException(404, detail="Response not found")

    option_labels = {option.id: option.label for q in form.questions for option in q.options}
    answers_by_question = {a.question_id: a for a in response.answers}
    answers = [
        _answer_out(question, answers_by_question.get(question.id), option_labels) for question in form.questions
    ]

    return ResponseDetail(
        id=response.id,
        form_id=response.form_id,
        started_at=response.started_at,
        submitted_at=response.submitted_at,
        is_complete=response.is_complete,
        answers=answers,
    )


def _answer_out(question: Question, answer: Answer | None, option_labels: dict[int, str]) -> AnswerOut:
    return AnswerOut(
        question_id=question.id,
        question_title=question.title,
        question_type=question.type,
        value_text=answer.value_text if answer else None,
        value_number=answer.value_number if answer else None,
        value_bool=answer.value_bool if answer else None,
        selected_option_label=(
            option_labels.get(answer.selected_option_id) if answer and answer.selected_option_id else None
        ),
    )


def _is_answer_blank(question_type: QuestionType, answer: Answer) -> bool:
    if question_type in CHOICE_TYPES:
        return answer.selected_option_id is None
    if question_type == QuestionType.yes_no:
        return answer.value_bool is None
    if question_type in (QuestionType.number, QuestionType.rating):
        return answer.value_number is None
    return not answer.value_text


@router.get("/{form_id}/summary", response_model=FormSummary)
def get_summary(form_id: int, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)
    responses = session.exec(select(Response).where(Response.form_id == form_id)).all()

    question_summaries = []
    for question in form.questions:
        all_answers = session.exec(select(Answer).where(Answer.question_id == question.id)).all()
        answered = [a for a in all_answers if not _is_answer_blank(question.type, a)]

        summary = QuestionSummary(
            question_id=question.id, title=question.title, type=question.type, answered_count=len(answered)
        )

        if question.type in CHOICE_TYPES:
            option_labels = {option.id: option.label for option in question.options}
            counts = {label: 0 for label in option_labels.values()}
            for a in answered:
                label = option_labels.get(a.selected_option_id)
                if label:
                    counts[label] += 1
            summary.choice_counts = [ChoiceCount(label=label, count=count) for label, count in counts.items()]

        elif question.type == QuestionType.yes_no:
            summary.true_count = sum(1 for a in answered if a.value_bool is True)
            summary.false_count = sum(1 for a in answered if a.value_bool is False)

        elif question.type in (QuestionType.number, QuestionType.rating):
            values = [a.value_number for a in answered if a.value_number is not None]
            if values:
                summary.average = sum(values) / len(values)
                summary.min_value = min(values)
                summary.max_value = max(values)

        question_summaries.append(summary)

    return FormSummary(
        form_id=form_id,
        total_responses=len(responses),
        completed_responses=sum(1 for r in responses if r.is_complete),
        questions=question_summaries,
    )
