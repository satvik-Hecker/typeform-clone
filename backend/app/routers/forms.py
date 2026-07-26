from fastapi import APIRouter, Depends, HTTPException
from nanoid import generate
from sqlalchemy import func
from sqlmodel import Session, select

from app.database import get_session
from app.models import Form, FormStatus, Question, QuestionOption, Response, utcnow
from app.schemas import FormCreate, FormListItem, FormOut, FormUpdate

router = APIRouter()

# Real creator auth is out of scope per the assignment spec — a single
# default creator is seeded and every form/question mutation acts as them.
DEFAULT_CREATOR_ID = 1


def _slug() -> str:
    return generate(size=10)


def get_form_or_404(form_id: int, session: Session) -> Form:
    form = session.get(Form, form_id)
    if not form:
        raise HTTPException(404, detail="Form not found")
    return form


@router.get("", response_model=list[FormListItem])
def list_forms(session: Session = Depends(get_session)):
    rows = session.exec(
        select(Form, func.count(Response.id))
        .outerjoin(Response, Response.form_id == Form.id)
        .where(Form.creator_id == DEFAULT_CREATOR_ID)
        .group_by(Form.id)
        .order_by(Form.updated_at.desc())
    ).all()
    return [
        FormListItem(
            id=form.id,
            title=form.title,
            status=form.status,
            slug=form.slug,
            response_count=count,
            created_at=form.created_at,
            updated_at=form.updated_at,
        )
        for form, count in rows
    ]


@router.post("", response_model=FormOut, status_code=201)
def create_form(payload: FormCreate, session: Session = Depends(get_session)):
    form = Form(
        creator_id=DEFAULT_CREATOR_ID,
        title=payload.title,
        description=payload.description,
        slug=_slug(),
    )
    session.add(form)
    session.commit()
    session.refresh(form)
    return form


@router.get("/{form_id}", response_model=FormOut)
def get_form(form_id: int, session: Session = Depends(get_session)):
    return get_form_or_404(form_id, session)


@router.patch("/{form_id}", response_model=FormOut)
def update_form(form_id: int, payload: FormUpdate, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(form, key, value)
    form.updated_at = utcnow()
    session.add(form)
    session.commit()
    session.refresh(form)
    return form


@router.delete("/{form_id}", status_code=204)
def delete_form(form_id: int, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)
    session.delete(form)
    session.commit()


@router.post("/{form_id}/duplicate", response_model=FormOut, status_code=201)
def duplicate_form(form_id: int, session: Session = Depends(get_session)):
    original = get_form_or_404(form_id, session)

    copy = Form(
        creator_id=original.creator_id,
        title=f"{original.title} (copy)",
        description=original.description,
        status=FormStatus.draft,
        slug=_slug(),
        thank_you_message=original.thank_you_message,
        theme=original.theme,
    )
    session.add(copy)
    session.flush()  # assigns copy.id for the questions below, without committing yet

    for question in original.questions:
        new_question = Question(
            form_id=copy.id,
            type=question.type,
            title=question.title,
            description=question.description,
            required=question.required,
            order_index=question.order_index,
            placeholder=question.placeholder,
            min_value=question.min_value,
            max_value=question.max_value,
        )
        session.add(new_question)
        session.flush()
        for option in question.options:
            session.add(
                QuestionOption(question_id=new_question.id, label=option.label, order_index=option.order_index)
            )

    session.commit()
    session.refresh(copy)
    return copy


@router.post("/{form_id}/publish", response_model=FormOut)
def publish_form(form_id: int, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)
    if not form.questions:
        raise HTTPException(400, detail="Cannot publish a form with no questions")
    form.status = FormStatus.published
    form.published_at = utcnow()
    form.updated_at = utcnow()
    session.add(form)
    session.commit()
    session.refresh(form)
    return form


@router.post("/{form_id}/unpublish", response_model=FormOut)
def unpublish_form(form_id: int, session: Session = Depends(get_session)):
    form = get_form_or_404(form_id, session)
    form.status = FormStatus.draft
    form.updated_at = utcnow()
    session.add(form)
    session.commit()
    session.refresh(form)
    return form
