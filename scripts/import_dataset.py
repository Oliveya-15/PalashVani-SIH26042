#!/usr/bin/env python3
"""
Imports a validated Hindi-<->tribal-language CSV into the database.

Usage (from the project root, backend venv active):
    python scripts/import_dataset.py data/raw/hindi_mundari_seed.csv --target mundari

What it does (see docs/database.md "Dataset handling" for the full
rationale): validates the file (reusing validate_dataset.py so the two
scripts can never silently disagree), normalizes every row, upserts each
pair as a TranslationEntry (source language is always assumed to be
Hindi -- change --source if that's ever not true), and refreshes the
DatasetMetadata row for the target language with real, computed counts
and the citation strings already present in the CSV's `source` column.

This script is idempotent: running it twice on the same file updates
existing rows instead of duplicating them.
"""
import argparse
import csv
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from validate_dataset import validate  # noqa: E402  (scripts/ is on sys.path when run as above)

from app.database.init_db import init_db  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.models.models import DatasetMetadata, Language, TranslationEntry  # noqa: E402


def parse_bool(value: str) -> bool:
    return (value or "").strip().upper() == "TRUE"


def import_csv(csv_path: Path, source_code: str, target_code: str) -> None:
    init_db()
    db = SessionLocal()
    try:
        source_lang = db.query(Language).filter(Language.code == source_code).first()
        target_lang = db.query(Language).filter(Language.code == target_code).first()
        if not source_lang or not target_lang:
            print(f"ERROR: language codes '{source_code}' / '{target_code}' not found. "
                  f"Add them to backend/app/database/init_db.py first.")
            sys.exit(1)

        with csv_path.open(encoding="utf-8") as f:
            rows = list(csv.DictReader(f))

        inserted, updated = 0, 0
        sources_seen: set[str] = set()

        for row in rows:
            hindi = unicodedata.normalize("NFC", (row.get("hindi_text") or "").strip())
            target_text = unicodedata.normalize("NFC", (row.get("mundari_text") or "").strip())
            if not hindi or not target_text:
                continue

            normalized = _normalize_for_lookup(hindi)
            category = (row.get("category") or "general").strip() or "general"
            transliteration = (row.get("transliteration") or "").strip()
            source_citation = (row.get("source") or "").strip()
            verified = parse_bool(row.get("verified", ""))
            if source_citation:
                sources_seen.add(source_citation)

            existing = (
                db.query(TranslationEntry)
                .filter(
                    TranslationEntry.source_text == hindi,
                    TranslationEntry.target_language_id == target_lang.id,
                )
                .first()
            )
            if existing:
                existing.target_text = target_text
                existing.category = category
                existing.transliteration = transliteration
                existing.source_citation = source_citation
                existing.verified = verified
                existing.normalized_source = normalized
                updated += 1
            else:
                db.add(TranslationEntry(
                    source_language_id=source_lang.id,
                    target_language_id=target_lang.id,
                    source_text=hindi,
                    target_text=target_text,
                    normalized_source=normalized,
                    category=category,
                    transliteration=transliteration,
                    source_citation=source_citation,
                    verified=verified,
                ))
                inserted += 1

        db.commit()

        total_pairs = db.query(TranslationEntry).filter(
            TranslationEntry.target_language_id == target_lang.id
        ).count()

        meta = db.query(DatasetMetadata).filter(DatasetMetadata.language_id == target_lang.id).first()
        combined_source = "; ".join(sorted(sources_seen)) or "Manually curated seed dataset"
        if meta:
            meta.total_pairs = total_pairs
            meta.source = combined_source
            meta.last_updated = datetime.utcnow()
        else:
            db.add(DatasetMetadata(
                language_id=target_lang.id,
                total_pairs=total_pairs,
                source=combined_source,
                license="Mixed -- see docs/database.md for per-source licensing notes",
                coverage_note=(
                    "Small curated demonstration corpus for prototype purposes. "
                    "Not the full 97,826-pair research corpus referenced in the SIH pitch -- "
                    "see docs/limitations.md."
                ),
            ))
        db.commit()

        print(f"Import complete: {inserted} inserted, {updated} updated, {total_pairs} total rows for "
              f"{source_lang.name_en} -> {target_lang.name_en}.")
    finally:
        db.close()


def _normalize_for_lookup(text: str) -> str:
    # kept in sync with app.translation.normalize.normalize_text
    from app.translation.normalize import normalize_text
    return normalize_text(text)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--source", default="hi", help="Source language code (default: hi)")
    parser.add_argument("--target", default="mundari", help="Target language code (default: mundari)")
    parser.add_argument("--skip-validation", action="store_true")
    args = parser.parse_args()

    if not args.skip_validation:
        print("Validating dataset first...")
        if validate(args.csv_path) != 0:
            print("Aborting import: validation failed. Re-run with --skip-validation to force.")
            sys.exit(1)
        print()

    import_csv(args.csv_path, args.source, args.target)
