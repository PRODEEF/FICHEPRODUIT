#!/usr/bin/env python3
"""
Valide un CSV prêt pour l'import Supabase table catalog_products.

Usage:
  python validate-catalog-csv.py chemin/vers/fichier.csv

Exit 0 = OK (warnings possibles)
Exit 1 = erreurs bloquantes
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

REQUIRED_HEADERS = [
    "name",
    "brand",
    "sector",
    "category",
    "sub_category",
    "year",
    "price",
    "description",
    "detailed_description",
    "images",
    "url",
    "attributes",
]

REQUIRED_FIELDS = ["name", "brand", "sector", "category", "price", "url"]

FORBIDDEN_HEADERS = {"id", "created_at", "updated_at"}

CANONICAL_SECTORS = [
    "Nautisme",
    "Glisse",
    "Vélo",
    "Outdoor",
    "Montagne",
    "Mode",
    "Maison",
    "Animalerie",
    "Sport",
    "Jardin",
    "Bricolage",
    "Puériculture",
    "Bijoux",
    "Montres",
    "Gastronomie",
    "Gaming",
    "Autres",
]

SECTOR_LOOKUP = {s.lower(): s for s in CANONICAL_SECTORS}

REFERENCE_MAX_LENGTH = 64


class Reporter:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, line: int, message: str) -> None:
        self.errors.append(f"L{line}: {message}")

    def warn(self, line: int, message: str) -> None:
        self.warnings.append(f"L{line}: {message}")


def is_valid_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def parse_price(raw: str, line: int, report: Reporter) -> bool:
    cleaned = raw.strip().replace(" ", "").replace("€", "").replace("\u00a0", "")
    if not cleaned:
        report.error(line, "price obligatoire manquant")
        return False
    cleaned = cleaned.replace(",", ".")
    try:
        float(cleaned)
    except ValueError:
        report.error(line, f"price invalide : {raw!r}")
        return False
    return True


def parse_year(raw: str, line: int, report: Reporter) -> None:
    if not raw.strip():
        return
    try:
        year = int(raw.strip())
    except ValueError:
        report.error(line, f"year doit être un entier ou vide : {raw!r}")
        return
    if year < 1900 or year > 2100:
        report.warn(line, f"year inhabituel : {year}")


def parse_json_array(raw: str, line: int, field: str, report: Reporter) -> None:
    if not raw.strip():
        return
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        report.error(line, f"{field} JSON invalide : {exc}")
        return
    if not isinstance(data, list):
        report.error(line, f"{field} doit être un tableau JSON")
        return
    for item in data:
        if not isinstance(item, str):
            report.error(line, f"{field} : chaque élément doit être une chaîne URL")
        elif not is_valid_url(item):
            report.warn(line, f"{field} URL suspecte : {item!r}")


def validate_reference(ref: str, line: int, report: Reporter) -> None:
    if not ref:
        report.warn(line, "attributes.reference manquante (export PrestaShop impossible)")
        return
    if len(ref) > REFERENCE_MAX_LENGTH:
        report.warn(line, f"reference > {REFERENCE_MAX_LENGTH} car. : {ref!r}")
    if '{"' in ref or "Choose your region" in ref:
        report.warn(line, "reference ressemble à un dump JSON / i18n")
    if ref.count(",") > 5:
        report.warn(line, "reference contient trop de virgules")


def parse_attributes(raw: str, line: int, report: Reporter) -> None:
    if not raw.strip():
        report.warn(line, "attributes vide")
        return
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        report.error(line, f"attributes JSON invalide : {exc}")
        return
    if not isinstance(data, dict):
        report.error(line, "attributes doit être un objet JSON")
        return
    for key, value in data.items():
        if not isinstance(key, str):
            report.error(line, "attributes : clés doivent être des chaînes")
        if not isinstance(value, str):
            report.error(line, f"attributes.{key} doit être une chaîne, pas {type(value).__name__}")
    ref = data.get("reference", "")
    if isinstance(ref, str):
        validate_reference(ref.strip(), line, report)


def normalize_sector(raw: str) -> str:
    return SECTOR_LOOKUP.get(raw.strip().lower(), raw.strip())


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    text = path.read_text(encoding="utf-8-sig")
    if ";" in text.splitlines()[0] and "," not in text.splitlines()[0]:
        raise ValueError(
            "Séparateur point-virgule détecté en en-tête. Exporter en CSV UTF-8 virgule."
        )
    reader = csv.DictReader(text.splitlines())
    if reader.fieldnames is None:
        raise ValueError("Fichier CSV vide ou sans en-tête")
    headers = [h.strip() for h in reader.fieldnames]
    rows = [{k.strip(): (v or "") for k, v in row.items()} for row in reader]
    return headers, rows


def validate(path: Path) -> Reporter:
    report = Reporter()

    try:
        headers, rows = read_csv(path)
    except ValueError as exc:
        report.errors.append(str(exc))
        return report
    except OSError as exc:
        report.errors.append(f"Lecture impossible : {exc}")
        return report

    if not rows:
        report.errors.append("Aucune ligne de données (seulement l'en-tête)")

    extra = set(headers) - set(REQUIRED_HEADERS)
    missing = set(REQUIRED_HEADERS) - set(headers)
    forbidden = set(headers) & FORBIDDEN_HEADERS

    if forbidden:
        report.errors.append(
            f"Colonnes auto-générées à retirer : {', '.join(sorted(forbidden))}"
        )
    if missing:
        report.errors.append(f"Colonnes manquantes : {', '.join(sorted(missing))}")
    if extra:
        report.warnings.append(f"Colonnes inconnues (seront ignorées à l'import) : {', '.join(sorted(extra))}")

    if headers != REQUIRED_HEADERS:
        report.warnings.append(
            f"Ordre en-têtes : attendu {REQUIRED_HEADERS}, reçu {headers}"
        )

    seen_urls: dict[str, int] = {}

    for index, row in enumerate(rows, start=2):
        for field in REQUIRED_FIELDS:
            if not row.get(field, "").strip():
                report.error(index, f"{field} obligatoire manquant")

        sector = row.get("sector", "").strip()
        if sector:
            canonical = normalize_sector(sector)
            if canonical != sector and canonical in CANONICAL_SECTORS:
                report.warn(
                    index,
                    f"sector {sector!r} → normaliser en {canonical!r}",
                )
            elif sector not in CANONICAL_SECTORS:
                report.warn(index, f"sector hors liste canonique : {sector!r}")

        parse_price(row.get("price", ""), index, report)
        parse_year(row.get("year", ""), index, report)
        parse_json_array(row.get("images", ""), index, "images", report)
        parse_attributes(row.get("attributes", ""), index, report)

        url = row.get("url", "").strip()
        if url and not is_valid_url(url):
            report.warn(index, f"url suspecte : {url!r}")
        if url:
            if url in seen_urls:
                report.warn(
                    index,
                    f"url dupliquée (déjà L{seen_urls[url]}) : {url!r}",
                )
            else:
                seen_urls[url] = index

    return report


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python validate-catalog-csv.py <fichier.csv>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"Fichier introuvable : {path}", file=sys.stderr)
        return 2

    report = validate(path)

    print(f"Validation : {path.name}")
    print(f"  Erreurs   : {len(report.errors)}")
    print(f"  Warnings  : {len(report.warnings)}")

    for msg in report.errors:
        print(f"  [ERROR]   {msg}")
    for msg in report.warnings:
        print(f"  [WARN]    {msg}")

    if report.errors:
        print("\n[ECHEC] Import Supabase probablement bloque — corriger les erreurs.")
        return 1

    print("\n[OK] Format valide pour import Supabase (verifier warnings si besoin).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
