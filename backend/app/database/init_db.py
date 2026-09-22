"""
Creates all tables, inserts fixed reference rows (languages, grades),
and robustly imports CSV datasets using positional column mapping 
with valid TranslationEntry model attributes.
"""
import csv
from pathlib import Path
from app.core.logging_config import get_logger
from app.database.session import Base, SessionLocal, engine
from app.models.models import (
    CurriculumChapter,
    CurriculumGrade,
    CurriculumSubject,
    Language,
    TranslationEntry,
)

logger = get_logger("init_db")

LANGUAGES = [
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

CURRICULUM_PLAN = [
    (1, "Language (Bhasha)", "भाषा", "💬", [
        ("Introductions & Greetings", "परिचय और अभिवादन", ["greeting"]),
    ]),
    (1, "Mathematics", "गणित", "🔢", [
        ("Counting 1-10", "गिनती (1-10)", ["number"]),
    ]),
    (2, "Environmental Studies", "पर्यावरण अध्ययन", "🍃", [
        ("Animals Around Us", "हमारे आस-पास के जानवर", ["animal"]),
        ("Colours", "रंग", ["color"]),
    ]),
    (3, "Environmental Studies", "पर्यावरण अध्ययन", "🍃", [
        ("Food We Eat", "हम जो खाना खाते हैं", ["food", "daily_life"]),
        ("Fruits", "फल", ["fruit"]),
    ]),
    (4, "Language (Bhasha)", "भाषा", "💬", [
        ("Times of Day", "दिन के समय", ["time"]),
    ]),
]


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Languages
        existing_codes = {l.code for l in db.query(Language).all()}
        for code, name_en, name_hi, script, is_tribal, status, bhashini in LANGUAGES:
            if code not in existing_codes:
                db.add(Language(
                    code=code, name_en=name_en, name_hi=name_hi, script=script,
                    is_tribal=is_tribal, status=status, bhashini_supported=bhashini,
                ))
        db.commit()

        # 2. Seed Grades
        existing_grades = {g.grade_number for g in db.query(CurriculumGrade).all()}
        for number, label_en, label_hi in GRADES:
            if number not in existing_grades:
                db.add(CurriculumGrade(grade_number=number, label_en=label_en, label_hi=label_hi))
        db.commit()

        # 3. Locate data/raw folder with robust path resolution for Render/Docker
        project_root = Path(__file__).resolve().parents[3]
        raw_data_dir = project_root / "data" / "raw"

        if not raw_data_dir.exists():
            # Fallbacks for different deployment structures (Render, Docker, etc.)
            alternative_paths = [
                Path.cwd() / "data" / "raw",
                Path.cwd().parent / "data" / "raw",
                Path("/opt/render/project/src/data/raw"),
                Path("/app/data/raw"),
            ]
            for alt_path in alternative_paths:
                if alt_path.exists():
                    raw_data_dir = alt_path
                    break

        logger.info(f"Attempting to scan raw data directory at: {raw_data_dir.resolve()}")

        if raw_data_dir.exists() and raw_data_dir.is_dir():
            csv_files = list(raw_data_dir.glob("*.csv"))
            logger.info(f"Found CSV files: {[f.name for f in csv_files]}")

            for csv_file in csv_files:
                filename_lower = csv_file.name.lower()
                target_lang = "mundari"
                if "santali" in filename_lower:
                    target_lang = "santali"
                elif "ho" in filename_lower:
                    target_lang = "ho"

                with open(csv_file, mode="r", encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    rows = list(reader)
                    if not rows:
                        continue

                    start_idx = 0
                    header = [h.strip().lower() for h in rows[0]]
                    if any(kw in header for kw in ["hindi", "source", "mundari", "target", "word", "translation"]):
                        start_idx = 1

                    imported_count = 0
                    for row in rows[start_idx:]:
                        if len(row) < 2:
                            continue
                        
                        source_text = row[0].strip()
                        target_text = row[1].strip()
                        
                        if not source_text or not target_text or source_text.lower() in ["hindi", "source", "word"]:
                            continue

                        category = "general"
                        if len(row) > 2 and row[2].strip():
                            category = row[2].strip()

                        notes = None
                        if len(row) > 3 and row[3].strip():
                            notes = row[3].strip()

                        exists = (
                            db.query(TranslationEntry)
                            .filter(
                                TranslationEntry.source_text == source_text,
                                TranslationEntry.target_text == target_text
                            )
                            .first()
                        )
                        if not exists:
                            db.add(TranslationEntry(
                                source_language="hi",
                                target_language=target_lang,
                                source_text=source_text,
                                target_text=target_text,
                                category=category,
                                confidence=1.0,
                                verified=True,
                                notes=notes,
                            ))
                            imported_count += 1
                    db.commit()
                    logger.info(f"Successfully imported {imported_count} entries from {csv_file.name}")
        else:
            logger.warning(f"Raw data directory not found at {raw_data_dir}")

        # 4. Seed Curriculum Subjects & Chapters & Link Entries
        for grade_number, subj_en, subj_hi, icon, chapters in CURRICULUM_PLAN:
            grade = db.query(CurriculumGrade).filter(CurriculumGrade.grade_number == grade_number).first()
            if not grade:
                continue

            subject = (
                db.query(CurriculumSubject)
                .filter(CurriculumSubject.grade_id == grade.id, CurriculumSubject.name_en == subj_en)
                .first()
            )
            if not subject:
                subject = CurriculumSubject(grade_id=grade.id, name_en=subj_en, name_hi=subj_hi, icon=icon)
                db.add(subject)
                db.flush()

            for order_index, (title_en, title_hi, categories) in enumerate(chapters):
                chapter = (
                    db.query(CurriculumChapter)
                    .filter(CurriculumChapter.subject_id == subject.id, CurriculumChapter.title_en == title_en)
                    .first()
                )
                if not chapter:
                    chapter = CurriculumChapter(
                        subject_id=subject.id, title_en=title_en, title_hi=title_hi, order_index=order_index,
                    )
                    db.add(chapter)
                    db.flush()

                for category in categories:
                    entries = (
                        db.query(TranslationEntry)
                        .filter(TranslationEntry.category == category)
                        .all()
                    )
                    for entry in entries:
                        if not entry.chapter_id:
                            entry.chapter_id = chapter.id

        db.commit()
        logger.info("Database initialization and CSV data import completed successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()