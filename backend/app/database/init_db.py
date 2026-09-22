"""
Creates all tables and inserts the fixed reference rows (languages,
grades) that the rest of the app assumes exist. Safe to run repeatedly --
every insert here is "get-or-create".

This is intentionally NOT an Alembic migration. For a single-developer
academic prototype backed by SQLite, `Base.metadata.create_all()` plus this
idempotent seeding script is simpler to explain in a viva and to run on a
classmate's laptop than a full migration chain. Alembic *is* included
(see backend/requirements.txt and docs/database.md) and is the documented
next step before any multi-environment / PostgreSQL deployment, where
create_all() is no longer safe once real data exists.
"""
import sys
from pathlib import Path

from app.core.logging_config import get_logger
from app.database.session import Base, SessionLocal, engine
from app.models.models import CurriculumGrade, Language

# Add project root so we can import scripts safely
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from scripts.seed_curriculum import seed as seed_curriculum_chapters
except ImportError:
    seed_curriculum_chapters = None

logger = get_logger("init_db")

LANGUAGES = [
    # code,      name_en,       name_hi,          script,                     is_tribal, status,    bhashini
    ("hi",       "Hindi",       "हिन्दी",          "Devanagari",               False,     "active",  True),
    ("en",       "English",     "अंग्रेज़ी",          "Latin",                    False,     "active",  True),
    ("mundari",  "Mundari",     "मुंडारी",          "Devanagari",               True,      "active",  False),
    ("ho",       "Ho",          "हो",               "Warang Citi / Devanagari", True,      "planned", False),
    ("santali",  "Santali",     "संताली",          "Ol Chiki / Devanagari",    True,      "planned", False),
]

GRADES = [
    (1, "Grade 1", "कक्षा 1"),
    (2, "Grade 2", "कक्षा 2"),
    (3, "Grade 3", "कक्षा 3"),
    (4, "Grade 4", "कक्षा 4"),
    (5, "Grade 5", "कक्षा 5"),
]


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
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

        # Automatically seed curriculum chapters and link corpus entries
        if seed_curriculum_chapters:
            try:
                seed_curriculum_chapters()
                logger.info("Curriculum chapters auto-seeded successfully.")
            except Exception as e:
                logger.warning(f"Curriculum seeding note: {e}")

        logger.info("Database initialised (tables + reference data).")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()