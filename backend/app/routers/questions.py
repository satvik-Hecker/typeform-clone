from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models import NON_ANSWERABLE_TYPES, Question, QuestionOption, QuestionType, utcnow
from app.routers.forms import get_form_or_404
from app.schemas import QuestionCreate, QuestionOut, QuestionUpdate, ReorderRequest

router = APIRouter()


def _get_question_or_404(form_id: int, question_id: int, session: Session) -> Question:
    question = session.get(Question, question_id)
    if not question or question.form_id != form_id:
        raise HTTPException(404, detail="Question not found")
    return question


@router.post("/{form_id}/questions", response_model=QuestionOut, status_code=201)
def create_question(form_id: int, payload: QuestionCreate, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)

    if payload.type in NON_ANSWERABLE_TYPES:
        raise HTTPException(400, detail="Every form already has exactly one welcome and one thank-you page")

    order_index = payload.order_index
    if order_index is None:
        # New questions land right before the thank-you page (if any) rather than at the
        # absolute end, so the ending page stays last without the creator having to reorder it.
        thank_you = next((q for q in form.questions if q.type == QuestionType.thank_you), None)
        if thank_you is not None:
            order_index = thank_you.order_index
            for q in form.questions:
                if q.order_index >= order_index:
                    q.order_index += 1
                    session.add(q)
        else:
            order_index = max((q.order_index for q in form.questions), default=-1) + 1

    question = Question(
        form_id=form_id,
        type=payload.type,
        title=payload.title,
        description=payload.description,
        required=payload.required,
        order_index=order_index,
        placeholder=payload.placeholder,
        min_value=payload.min_value,
        max_value=payload.max_value,
    )
    session.add(question)
    session.flush()

    for option in payload.options:
        session.add(QuestionOption(question_id=question.id, label=option.label, order_index=option.order_index))

    session.commit()
    session.refresh(question)
    return question


@router.patch("/{form_id}/questions/{question_id}", response_model=QuestionOut)
def update_question(
    form_id: int, question_id: int, payload: QuestionUpdate, session: Session = Depends(get_session)
):
    question = _get_question_or_404(form_id, question_id, session)

    if payload.type is not None and payload.type != question.type:
        if payload.type in NON_ANSWERABLE_TYPES or question.type in NON_ANSWERABLE_TYPES:
            raise HTTPException(400, detail="The welcome and thank-you pages can't change type")

    for key, value in payload.model_dump(exclude_unset=True, exclude={"options"}).items():
        setattr(question, key, value)
    question.updated_at = utcnow()

    if payload.options is not None:
        for option in list(question.options):
            session.delete(option)
        session.flush()
        for option in payload.options:
            session.add(QuestionOption(question_id=question.id, label=option.label, order_index=option.order_index))

    # `question` is already attached to the session (fetched via session.get),
    # so no session.add() here — re-adding it after deleting its old options
    # cascades through the still-cached `options` relationship and raises
    # "Instance has been deleted" for the objects we just removed.
    session.commit()
    session.refresh(question)
    return question


@router.delete("/{form_id}/questions/{question_id}", status_code=204)
def delete_question(form_id: int, question_id: int, session: Session = Depends(get_session)):
    question = _get_question_or_404(form_id, question_id, session)
    session.delete(question)
    session.commit()


@router.put("/{form_id}/questions/reorder", response_model=list[QuestionOut])
def reorder_questions(form_id: int, payload: ReorderRequest, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)
    questions_by_id = {q.id: q for q in form.questions}

    if set(payload.ordered_ids) != set(questions_by_id.keys()):
        raise HTTPException(400, detail="ordered_ids must match the form's existing question ids exactly")

    for index, question_id in enumerate(payload.ordered_ids):
        questions_by_id[question_id].order_index = index
        session.add(questions_by_id[question_id])

    session.commit()
    return sorted(questions_by_id.values(), key=lambda q: q.order_index)
