#!/usr/bin/env python3
"""
Seeds a small, illustrative Grade -> Subject -> Chapter tree and links it to
rows already imported by scripts/import_dataset.py.

Important honesty note (see docs/limitations.md): this is NOT the real
JCERT Class 1-5 curriculum -- the PPT itself lists that as a Phase 2
("formal partnership") deliverable that needs a JCERT MoU. What this
script builds is a believable, correctly-structured demonstration of the
"Browse by Chapter" screen, using only the same verified corpus rows the
rest of the app already shows in Search/Translate -- never invented
textbook content.

Usage (from the project root, after import_dataset.py has run):
    python scripts/seed_curriculum.py
"""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.database.session import SessionLocal  # noqa: E402
from app.models.models import CurriculumChapter, CurriculumGrade, CurriculumSubject, TranslationEntry  # noqa: E402

# (grade_number, subject_name_en, subject_name_hi, icon, [
#     (chapter_title_en, chapter_title_hi, [categories to pull entries from]),
# ])
PLAN = [
    (1, "Language (Bhasha)", "भाषा", "\U0001F4AC", [
        ("Introductions & Greetings", "परिचय और अभिवादन", ["greeting"]),
    ]),
    (1, "Mathematics", "गणित", "\U0001F522", [
        ("Counting 1-10", "गिनती (1-10)", ["number"]),
    ]),
    (2, "Environmental Studies", "पर्यावरण अध्ययन", "\U0001F343", [
        ("Animals Around Us", "हमारे आस-पास के जानवर", ["animal"]),
        ("Colours", "रंग", ["color"]),
    ]),
    (3, "Environmental Studies", "पर्यावरण अध्ययन", "\U0001F343", [
        ("Food We Eat", "हम जो खाना खाते हैं", ["food", "daily_life"]),
        ("Fruits", "फल", ["fruit"]),
    ]),
    (4, "Language (Bhasha)", "भाषा", "\U0001F4AC", [
        ("Times of Day", "दिन के समय", ["time"]),
    ]),
]


def seed() -> None:
    db = SessionLocal()
    try:
        for grade_number, subj_en, subj_hi, icon, chapters in PLAN:
            grade = db.query(CurriculumGrade).filter(CurriculumGrade.grade_number == grade_number).first()
            if not grade:
                print(f"Skipping grade {grade_number}: not found (run backend/app/database/init_db.py first)")
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

                linked = 0
                for category in categories:
                    entries = (
                        db.query(TranslationEntry)
                        .filter(TranslationEntry.category == category, TranslationEntry.chapter_id.is_(None))
                        .all()
                    )
                    for entry in entries:
                        entry.chapter_id = chapter.id
                        linked += 1
                print(f"Grade {grade_number} > {subj_en} > {title_en}: linked {linked} corpus entries")

        db.commit()
        print("Curriculum seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
