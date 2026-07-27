"""
Respondent-facing endpoints — the whole point is that these require no auth
and work for anyone with the published form's shareable link (slug).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import NON_ANSWERABLE_TYPES, Answer, Form, FormStatus, Question, QuestionType, Response, utcnow
from app.schemas import AnswerSubmit, FormOut, ResponseStartOut
from app.validation import validate_answer_format, validate_required

router = APIRouter()


def _get_published_form_or_404(slug: str, session: Session) -> Form:
    form = session.exec(select(Form).where(Form.slug == slug)).first()
    if not form or form.status != FormStatus.published:
        raise HTTPException(404, detail="Form not found")
    return form


def _get_response_or_404(response_id: int, session: Session) -> Response:
    response = session.get(Response, response_id)
    if not response:
        raise HTTPException(404, detail="Response not found")
    return response


@router.get("/forms/{slug}", response_model=FormOut)
def get_public_form(slug: str, session: Session = Depends(get_session)):
    return _get_published_form_or_404(slug, session)


@router.post("/forms/{slug}/responses", response_model=ResponseStartOut, status_code=201)
def start_response(slug: str, session: Session = Depends(get_session)):
    form = _get_published_form_or_404(slug, session)
    response = Response(form_id=form.id)
    session.add(response)
    session.commit()
    session.refresh(response)
    return ResponseStartOut(response_id=response.id)


@router.put("/responses/{response_id}/answers/{question_id}", status_code=204)
def upsert_answer(
    response_id: int, question_id: int, payload: AnswerSubmit, session: Session = Depends(get_session)
):
    response = _get_response_or_404(response_id, session)
    if response.is_complete:
        raise HTTPException(400, detail="This response has already been submitted")

    question = session.get(Question, question_id)
    if not question or question.form_id != response.form_id:
        raise HTTPException(404, detail="Question not found on this form")
    if question.type in NON_ANSWERABLE_TYPES:
        raise HTTPException(400, detail="This page doesn't accept answers")

    validate_answer_format(question, payload)

    existing = session.exec(
        select(Answer).where(Answer.response_id == response_id, Answer.question_id == question_id)
    ).first()
    answer = existing or Answer(response_id=response_id, question_id=question_id)
    answer.value_text = payload.value_text
    answer.value_number = payload.value_number
    answer.value_bool = payload.value_bool
    answer.selected_option_id = payload.selected_option_id
    session.add(answer)
    session.commit()


@router.post("/responses/{response_id}/submit")
def submit_response(response_id: int, session: Session = Depends(get_session)):
    response = _get_response_or_404(response_id, session)
    if response.is_complete:
        raise HTTPException(400, detail="This response has already been submitted")

    form = session.get(Form, response.form_id)
    answers_by_question = {a.question_id: a for a in response.answers}

    for question in form.questions:
        if question.type in NON_ANSWERABLE_TYPES:
            continue
        payload = None
        answer = answers_by_question.get(question.id)
        if answer:
            payload = AnswerSubmit(
                value_text=answer.value_text,
                value_number=answer.value_number,
                value_bool=answer.value_bool,
                selected_option_id=answer.selected_option_id,
            )
        validate_required(question, payload)

    response.is_complete = True
    response.submitted_at = utcnow()
    session.add(response)
    session.commit()

    thank_you = next((q for q in form.questions if q.type == QuestionType.thank_you), None)
    return {"thank_you_message": thank_you.title if thank_you else "Thanks for completing this form!"}
