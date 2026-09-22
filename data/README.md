# Data directory

```
data/
├── raw/          Source CSVs, exactly as sourced (never edited in place)
├── processed/    Generated: the SQLite database file lives here (gitignored)
└── seed/         Reserved for future hand-written seed fixtures
```

## `raw/hindi_mundari_seed.csv`

A **57-row, hand-sourced demonstration corpus** covering greetings, numbers
1-10, colours, animals, food & vegetables, fruits, and times of day.

**This is intentionally small.** The project brief's own AI-integration
prompt referenced a much larger Hindi→Mundari corpus (~30,000 pairs); no
such file was supplied alongside the SIH PPT and logo, and the project's
explicit "never invent fake translation records" rule means we did not
fabricate one. Every single row in this file is instead sourced, and
individually citable, from two publicly available Mundari
language-learning references:

| Source | What was taken from it |
|---|---|
| [Omniglot.com — Numbers in Mundari](https://omniglot.com/language/numbers/mundari.htm) | Cardinal numbers 1–10 |
| [mundariversity.com](https://mundariversity.com) (Basic Conversations, Colour Names, Pet Animal Names, Food Related Words, Vegetables Names, Fruit names, Time in Mundari, Essential Words: Food & Taste lessons) | Greetings, colours, animals, food, vegetables, fruit, time-of-day vocabulary |

Every row's `source` column carries its specific citation. The `verified`
column is `TRUE` for all 57 rows precisely because each was checked against
one of these two sources before being included — nothing here is a guess.

**Replacing this with a production corpus:** drop a CSV with the same
columns (`hindi_text,mundari_text,category,transliteration,source,verified`)
into `data/raw/`, run it through `scripts/validate_dataset.py`, then
`scripts/import_dataset.py`. The PPT's own feasibility slide names the
intended production sources for a real deployment -- StoryWeaver (CC-BY-4.0),
Karya, AdiBhashaa, and JCERT curriculum PDFs -- each of which carries its
own licence that would need to be checked before import; see the licensing
note in the root `LICENSE` file.

## Why CSV instead of JSON/Excel

Plain CSV was chosen deliberately: it is diffable in `git`, editable by a
non-programmer in Excel/Sheets, and readable by both the validation script
and a human reviewer without any special tooling -- important given a real
production corpus will likely be compiled by people who are not software
engineers.
