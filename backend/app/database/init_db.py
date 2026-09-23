"""
MODIFIED FILE -- your existing backend/app/database/init_db.py with ONE
line added: `from app.models.user import User`. That import is what
registers the new `users` table on the shared SQLAlchemy metadata before
Base.metadata.create_all() runs -- without it, `create_all()` would never
know the users table exists and it wouldn't get created.

Everything else below is identical to your current file. If your live
file has diverged, just add the single import line marked "NEW" below to
your own copy instead of replacing the whole file.
"""
from app.core.logging_config import get_logger
from app.database.session import Base, SessionLocal, engine
from app.models.models import CurriculumGrade, Language
from app.models.user import User  # NEW -- registers the `users` table with Base.metadata

logger = get_logger("init_db")

LANGUAGES = [
    # code,      name_en,        name_hi,          script,        is_tribal, status,    bhashini
    ("hi",       "Hindi",        "हिन्दी",           "Devanagari",  False,     "active",  True),
    ("en",       "English",      "अंग्रेज़ी",          "Latin",       False,     "active",  True),
    ("mundari",  "Mundari",      "मुंडारी",           "Devanagari",  True,      "active",  False),
    ("ho",       "Ho",           "हो",               "Warang Citi / Devanagari", True, "planned", False),
    ("santali",  "Santali",      "संताली",           "Ol Chiki / Devanagari",    True, "planned", False),
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
        logger.info("Database initialised (tables + reference data).")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
