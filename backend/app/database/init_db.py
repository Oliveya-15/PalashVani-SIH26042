"""
Creates all tables, inserts fixed reference rows (languages, grades),
automatically discovers and imports all CSV datasets from data/raw/,
and seeds the curriculum chapters. Completely idempotent and automated.
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

        # 3. Auto-discover and import all CSV files from data/raw/
        project_root = Path(__file__).resolve().parents[3]
        raw_data_dir = project_root / "data" / "raw"

        if raw_data_dir.exists():
            csv_files = list(raw_data_dir.glob("*.csv"))
            for csv_file in csv_files:
                filename_lower = csv_file.name.lower()
                target_lang = "mundari"
                if "santali" in filename_lower:
                    target_lang = "santali"
                elif "ho" in filename_lower:
                    target_lang = "ho"

                with open(csv_file, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    imported_count = 0
                    for row in reader:
                        source_text = row.get("hindi") or row.get("source") or row.get("source_text")
                        if source_text:
                            source_text = source_text.strip()

                        target_text = row.get(target_lang) or row.get("target") or row.get("target_text") or row.get("mundari")
                        if target_text:
                            target_text = target_text.strip()

                        if not source_text or not target_text:
                            continue

                        category = row.get("category", "general").strip()
                        notes = row.get("notes", "").strip() or None

                        exists = (
                            db.query(TranslationEntry)
                            .filter_by(source_text=source_text, target_text=target_text, target_language=target_lang)
                            .first()
                        )
                        if not exists:
                            db.add(TranslationEntry(
                                source_language="hi",
                                target_language=target_lang,
                                source_text=source_text,
                                target_text=target_text,
                                category=category,
                                source_type="dataset",
                                confidence=1.0,
                                verified=True,
                                notes=notes,
                            ))
                            imported_count += 1
                    db.commit()
                    logger.info(f"Auto-imported {imported_count} entries from {csv_file.name}")
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
                        .filter(TranslationEntry.category == category, TranslationEntry.chapter_id.is_(None))
                        .all()
                    )
                    for entry in entries:
                        entry.chapter_id = chapter.id

        db.commit()
        logger.info("Database initialised, datasets auto-discovered & imported, and curriculum auto-seeded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()