"""
Seed script: wipes and recreates the schema, then loads a default creator,
a couple of published forms (covering all 8 question types between them)
with realistic sample responses, and one draft form so the dashboard shows
both statuses.

Run from the `backend/` directory (matters because the SQLite URL is
relative): `python -m app.seed`
"""

from datetime import timedelta

from sqlmodel import Session, SQLModel

from app.database import engine
from app.models import Answer, Creator, Form, FormStatus, Question, QuestionOption, QuestionType, Response, utcnow


def reset_schema() -> None:
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)


def add_response(
    session: Session,
    form: Form,
    questions_by_title: dict[str, Question],
    answers: dict[str, object],
    *,
    started_days_ago: int,
    complete: bool = True,
) -> Response:
    started_at = utcnow() - timedelta(days=started_days_ago)
    response = Response(
        form_id=form.id,
        started_at=started_at,
        submitted_at=started_at + timedelta(minutes=4) if complete else None,
        is_complete=complete,
    )
    session.add(response)
    session.flush()

    for title, value in answers.items():
        question = questions_by_title[title]
        answer = Answer(response_id=response.id, question_id=question.id)

        if question.type in (QuestionType.multiple_choice, QuestionType.dropdown):
            option = next(o for o in question.options if o.label == value)
            answer.selected_option_id = option.id
        elif question.type == QuestionType.yes_no:
            answer.value_bool = bool(value)
        elif question.type in (QuestionType.number, QuestionType.rating):
            answer.value_number = float(value)
        else:
            answer.value_text = str(value)

        session.add(answer)

    return response


def seed_feedback_form(session: Session, creator: Creator) -> None:
    form = Form(
        creator_id=creator.id,
        title="Customer Feedback Survey",
        description="Help us improve — takes less than 2 minutes.",
        status=FormStatus.published,
        slug="customer-feedback",
        thank_you_message="Thanks so much for your feedback! 🎉",
        welcome_title="Help us make our product better",
        welcome_description="This survey takes less than 2 minutes and your answers directly shape what we build next.",
        published_at=utcnow() - timedelta(days=10),
        created_at=utcnow() - timedelta(days=14),
        updated_at=utcnow() - timedelta(hours=2),
    )
    session.add(form)
    session.flush()

    q_name = Question(form_id=form.id, type=QuestionType.short_text, title="What's your name?",
                       required=True, order_index=0, placeholder="Jane Doe")
    q_email = Question(form_id=form.id, type=QuestionType.email, title="What's your email?",
                        required=True, order_index=1, placeholder="jane@example.com")
    q_rating = Question(form_id=form.id, type=QuestionType.rating,
                         title="How satisfied are you with our product?",
                         description="1 = very dissatisfied, 5 = very satisfied",
                         required=True, order_index=2, min_value=1, max_value=5)
    q_source = Question(form_id=form.id, type=QuestionType.multiple_choice,
                         title="How did you hear about us?", required=False, order_index=3)
    q_recommend = Question(form_id=form.id, type=QuestionType.yes_no,
                            title="Would you recommend us to a friend?", required=True, order_index=4)
    q_comments = Question(form_id=form.id, type=QuestionType.long_text,
                           title="Any other comments?",
                           description="Optional — anything else you'd like us to know.",
                           required=False, order_index=5)

    session.add_all([q_name, q_email, q_rating, q_source, q_recommend, q_comments])
    session.flush()

    for i, label in enumerate(["Social media", "Friend or colleague", "Search engine", "Advertisement"]):
        session.add(QuestionOption(question_id=q_source.id, label=label, order_index=i))
    session.flush()

    questions_by_title = {q.title: q for q in [q_name, q_email, q_rating, q_source, q_recommend, q_comments]}

    sample_answers = [
        {"What's your name?": "Alicia Gomez", "What's your email?": "alicia.gomez@mail.com",
         "How satisfied are you with our product?": 5, "How did you hear about us?": "Friend or colleague",
         "Would you recommend us to a friend?": True, "Any other comments?": "Love the new dashboard!"},
        {"What's your name?": "Marcus Chen", "What's your email?": "marcus.chen@mail.com",
         "How satisfied are you with our product?": 4, "How did you hear about us?": "Search engine",
         "Would you recommend us to a friend?": True, "Any other comments?": ""},
        {"What's your name?": "Priya Nair", "What's your email?": "priya.nair@mail.com",
         "How satisfied are you with our product?": 3, "How did you hear about us?": "Social media",
         "Would you recommend us to a friend?": False,
         "Any other comments?": "Onboarding could be clearer."},
        {"What's your name?": "Tomás Rivera", "What's your email?": "tomas.rivera@mail.com",
         "How satisfied are you with our product?": 5, "How did you hear about us?": "Advertisement",
         "Would you recommend us to a friend?": True, "Any other comments?": ""},
        {"What's your name?": "Sara Kim", "What's your email?": "sara.kim@mail.com",
         "How satisfied are you with our product?": 2, "How did you hear about us?": "Search engine",
         "Would you recommend us to a friend?": False, "Any other comments?": "Too many bugs lately."},
    ]
    for i, answers in enumerate(sample_answers):
        add_response(session, form, questions_by_title, answers, started_days_ago=9 - i)

    # One respondent who started but never finished — feeds the completion-rate bonus stat.
    add_response(
        session, form, questions_by_title,
        {"What's your name?": "Devon Lee", "What's your email?": "devon.lee@mail.com"},
        started_days_ago=1, complete=False,
    )


def seed_job_application_form(session: Session, creator: Creator) -> None:
    form = Form(
        creator_id=creator.id,
        title="Job Application — Product Designer",
        description="Apply for the Product Designer role on our team.",
        status=FormStatus.published,
        slug="job-application-designer",
        thank_you_message="Thanks for applying! We'll be in touch within a week.",
        published_at=utcnow() - timedelta(days=6),
        created_at=utcnow() - timedelta(days=9),
        updated_at=utcnow() - timedelta(days=1),
    )
    session.add(form)
    session.flush()

    q_name = Question(form_id=form.id, type=QuestionType.short_text, title="Full name",
                       required=True, order_index=0)
    q_email = Question(form_id=form.id, type=QuestionType.email, title="Email address",
                        required=True, order_index=1)
    q_experience = Question(form_id=form.id, type=QuestionType.number,
                             title="Years of relevant experience", required=True, order_index=2,
                             min_value=0, max_value=50)
    q_position = Question(form_id=form.id, type=QuestionType.dropdown, title="Which team are you applying to?",
                           required=True, order_index=3)
    q_relocate = Question(form_id=form.id, type=QuestionType.yes_no,
                           title="Are you willing to relocate?", required=True, order_index=4)
    q_why = Question(form_id=form.id, type=QuestionType.long_text,
                      title="Why do you want to work with us?", required=True, order_index=5)
    q_skill = Question(form_id=form.id, type=QuestionType.rating, title="Rate your Figma proficiency",
                        description="1 = beginner, 10 = expert",
                        required=True, order_index=6, min_value=1, max_value=10)

    session.add_all([q_name, q_email, q_experience, q_position, q_relocate, q_why, q_skill])
    session.flush()

    for i, label in enumerate(["Product Design", "Brand Design", "UX Research"]):
        session.add(QuestionOption(question_id=q_position.id, label=label, order_index=i))
    session.flush()

    questions_by_title = {
        q.title: q for q in [q_name, q_email, q_experience, q_position, q_relocate, q_why, q_skill]
    }

    sample_answers = [
        {"Full name": "Jordan Blake", "Email address": "jordan.blake@mail.com",
         "Years of relevant experience": 6, "Which team are you applying to?": "Product Design",
         "Are you willing to relocate?": True,
         "Why do you want to work with us?": "I admire the craft in your recent releases.",
         "Rate your Figma proficiency": 9},
        {"Full name": "Nina Petrova", "Email address": "nina.petrova@mail.com",
         "Years of relevant experience": 3, "Which team are you applying to?": "UX Research",
         "Are you willing to relocate?": False,
         "Why do you want to work with us?": "Your research culture stands out to me.",
         "Rate your Figma proficiency": 6},
        {"Full name": "Ahmed Farouk", "Email address": "ahmed.farouk@mail.com",
         "Years of relevant experience": 10, "Which team are you applying to?": "Brand Design",
         "Are you willing to relocate?": True,
         "Why do you want to work with us?": "I want to help shape the brand at scale.",
         "Rate your Figma proficiency": 10},
        {"Full name": "Emily Zhang", "Email address": "emily.zhang@mail.com",
         "Years of relevant experience": 1, "Which team are you applying to?": "Product Design",
         "Are you willing to relocate?": True,
         "Why do you want to work with us?": "Great opportunity to grow early in my career.",
         "Rate your Figma proficiency": 5},
    ]
    for i, answers in enumerate(sample_answers):
        add_response(session, form, questions_by_title, answers, started_days_ago=5 - i)

    add_response(
        session, form, questions_by_title,
        {"Full name": "Liam O'Connor", "Email address": "liam.oconnor@mail.com"},
        started_days_ago=0, complete=False,
    )


def seed_draft_event_form(session: Session, creator: Creator) -> None:
    form = Form(
        creator_id=creator.id,
        title="Event Registration (draft)",
        description="Sign up for our upcoming product launch event.",
        status=FormStatus.draft,
        slug="event-registration-draft",
        created_at=utcnow() - timedelta(days=1),
        updated_at=utcnow() - timedelta(hours=3),
    )
    session.add(form)
    session.flush()

    session.add(Question(form_id=form.id, type=QuestionType.short_text, title="Full name",
                          required=True, order_index=0))
    session.add(Question(form_id=form.id, type=QuestionType.email, title="Email address",
                          required=True, order_index=1))


def main() -> None:
    print("Resetting schema...")
    reset_schema()

    with Session(engine) as session:
        creator = Creator(email="mehul.sharma0522@gmail.com", name="Mehul Sharma")
        session.add(creator)
        session.flush()

        print("Seeding Customer Feedback Survey...")
        seed_feedback_form(session, creator)

        print("Seeding Job Application form...")
        seed_job_application_form(session, creator)

        print("Seeding draft Event Registration form...")
        seed_draft_event_form(session, creator)

        session.commit()

    print("Done.")


if __name__ == "__main__":
    main()
