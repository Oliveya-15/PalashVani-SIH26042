"""
MODIFIED FILE -- this replaces your existing backend/app/database/init_db.py
with a real architectural fix for the problem you flagged: schema
creation and reference-data seeding no longer happen as a side effect of
the app *starting up*. See docs/admin-notes.md "Why the auto-seed-on-boot
pattern had to go" for the full explanation; short version:

  OLD flow: every time the app process started (including Render
  free-tier's automatic spin-down/spin-up), `init_db()` ran
  `Base.metadata.create_all()` + re-checked/inserted reference rows. This
  was a workaround for data not persisting -- and on Render's free tier
  with a SQLite file on ephemeral disk, that's *exactly* the symptom you'd
  see: the database quietly resets on every restart, silently deleting
  every registered user along with it.

  NEW flow: schema changes are explicit, tracked Alembic migrations
  (backend/migrations/) run once per deploy, not once per boot. Reference
  data (languages, grades) is seeded by a standalone script
  (scripts/seed_reference_data.py), also run once per deploy, not on
  every request cycle. The app itself (app/main.py) no longer touches the
  database at startup at all -- it just starts serving requests against
  whatever schema/data is already there.

This file still exposes `seed_reference_data()` (the actual seeding
logic, unchanged) for that script to call -- it's just no longer wrapped
in a `create_all()` + wired into the app's startup event.
"""
from app.core.logging_config import get_logger
from app.database.session import SessionLocal
from app.models.models import CurriculumGrade, Language

logger = get_logger("init_db")

LANGUAGES = [
    # code,       name_en,        name_hi,          script,        is_tribal, status,    bhashini
    ("hi",        "Hindi",        "हिन्दी",          "Devanagari",  False,     "active",   True),
    ("en",        "English",      "अंग्रेज़ी",          "Latin",       False,     "active",   True),
    ("mundari",   "Mundari",      "मुंडारी",          "Devanagari",  True,      "active",   False),
    ("ho",        "Ho",           "हो",               "Warang Citi / Devanagari", True, "planned", False),
    ("santali",   "Santali",      "संताली",          "Ol Chiki / Devanagari",    True, "planned", False),
]

GRADES = [
    (1, "Grade 1", "कक्षा 1"),
    (2, "Grade 2", "कक्षा 2"),
    (3, "Grade 3", "कक्षा 3"),
    (4, "Grade 4", "कक्षा 4"),
    (5, "Grade 5", "कक्षा 5"),
]


def seed_reference_data() -> None:
    """Idempotent: safe to run multiple times, only ever inserts rows that
    are missing. Assumes the schema already exists -- run
    `alembic upgrade head` first. See scripts/seed_reference_data.py."""
    db = SessionLocal()
    try:
        existing_codes = {l.code for l in db.query(Language).all()}
        for code, name_en, name_hi, script, is_tribal, status, bhashini in LANGUAGES:
            if code not in existing_codes:
                db.add(Language(
                    code=code, name_en=name_en, name_hi=name_hi, script=script,
                    is_tribal=is_tribal, status=status, bhashini_supported=bhashini,
                ))
        db.commit()

        existing_grades = {g.grade_number for g in db.query(CurriculumGrade).all()}
        for number, label_en, label_hi in GRADES:
            if number not in existing_grades:
                db.add(CurriculumGrade(grade_number=number, label_en=label_en, label_hi=label_hi))
        db.commit()
        logger.info("Reference data seeded (languages + grades).")
    finally:
        db.close()


def init_db() -> None:
    """Compatibility wrapper for legacy imports."""
    seed_reference_data()


if __name__ == "__main__":
    seed_reference_data()