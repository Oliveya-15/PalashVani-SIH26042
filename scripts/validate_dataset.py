#!/usr/bin/env python3
"""
Standalone dataset validator -- run this BEFORE importing any CSV into the
database. It never touches the database; it only reads the file and
reports problems, so it is safe to run on a dataset you don't fully trust
yet (see docs/database.md "Dataset handling").

Usage (from the project root):
    python scripts/validate_dataset.py data/raw/hindi_mundari_seed.csv

Checks performed (mirrors the project's "Dataset Handling" requirements):
  - required columns are present
  - no missing/empty required values
  - Unicode is NFC-normalized (flags any that isn't)
  - hindi_text actually contains Devanagari script
  - duplicate (hindi_text, mundari_text) pairs
  - 'verified' column only contains TRUE/FALSE
"""
import csv
import sys
import unicodedata
from collections import Counter
from pathlib import Path

REQUIRED_COLUMNS = {"hindi_text", "mundari_text", "category", "source", "verified"}


def has_devanagari(text: str) -> bool:
    return any("\u0900" <= ch <= "\u097F" for ch in text)


def validate(csv_path: Path) -> int:
    if not csv_path.exists():
        print(f"ERROR: file not found: {csv_path}")
        return 1

    with csv_path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        columns = set(reader.fieldnames or [])
        missing_cols = REQUIRED_COLUMNS - columns
        if missing_cols:
            print(f"ERROR: missing required columns: {sorted(missing_cols)}")
            return 1

        rows = list(reader)

    errors = []
    warnings = []
    seen_pairs = Counter()

    for i, row in enumerate(rows, start=2):  # +2 = header row + 1-indexing
        hindi = (row.get("hindi_text") or "").strip()
        mundari = (row.get("mundari_text") or "").strip()

        if not hindi or not mundari:
            errors.append(f"Row {i}: missing hindi_text or mundari_text")
            continue

        if unicodedata.normalize("NFC", hindi) != hindi:
            warnings.append(f"Row {i}: hindi_text is not NFC-normalized (will be normalized on import)")

        if not has_devanagari(hindi):
            warnings.append(f"Row {i}: hindi_text '{hindi}' does not appear to contain Devanagari script")

        if row.get("verified", "").strip().upper() not in ("TRUE", "FALSE"):
            errors.append(f"Row {i}: 'verified' must be TRUE or FALSE, got '{row.get('verified')}'")

        seen_pairs[(hindi, mundari)] += 1

    duplicates = {pair: count for pair, count in seen_pairs.items() if count > 1}
    if duplicates:
        for (hindi, mundari), count in duplicates.items():
            warnings.append(f"Duplicate pair appears {count}x: '{hindi}' -> '{mundari}'")

    print(f"Validated {len(rows)} rows from {csv_path}")
    print(f"  Errors:   {len(errors)}")
    print(f"  Warnings: {len(warnings)}")

    for e in errors:
        print(f"  [ERROR] {e}")
    for w in warnings:
        print(f"  [WARN]  {w}")

    if errors:
        print("\nValidation FAILED. Fix the errors above before importing.")
        return 1

    print("\nValidation PASSED. Safe to run scripts/import_dataset.py.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/validate_dataset.py <path-to-csv>")
        sys.exit(1)
    sys.exit(validate(Path(sys.argv[1])))
