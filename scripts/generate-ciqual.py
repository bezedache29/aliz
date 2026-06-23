#!/usr/bin/env python3
"""
Generate assets/data/ciqual.json from CIQUAL 2025 XML files.

Usage:
    python3 scripts/generate-ciqual.py

Downloads alim.xml (~1.5 MB) and compo.xml (~69 MB) from data.gouv.fr,
then generates a trimmed JSON with only the 6 nutritional values needed.
Temporary XML files are cached in /tmp to avoid re-downloading.
"""

import json
import os
import sys
import urllib.request
from xml.etree.ElementTree import iterparse

ALIM_URL = (
    "https://entrepot.recherche.data.gouv.fr/api/access/datafile/"
    ":persistentId?persistentId=doi:10.57745/OH8KXC"
)
COMPO_URL = (
    "https://entrepot.recherche.data.gouv.fr/api/access/datafile/"
    ":persistentId?persistentId=doi:10.57745/O73GDX"
)

CONST_CODES = {
    "328":   "kcal",
    "25000": "proteines",
    "31000": "glucides",
    "40000": "lipides",
    "34100": "fibres",
    "10004": "sel",
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "..", "assets", "data", "ciqual.json")
TMP_ALIM = "/tmp/ciqual_alim.xml"
TMP_COMPO = "/tmp/ciqual_compo.xml"


def parse_teneur(value: str) -> float | None:
    v = value.strip()
    if not v or v == "-":
        return None
    if v.lower() in ("traces", "trace"):
        return 0.0
    if v.startswith("<"):
        return 0.0
    try:
        return float(v.replace(",", "."))
    except ValueError:
        return None


def download(url: str, dest: str) -> None:
    print(f"  Downloading {os.path.basename(dest)}...", flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp, open(dest, "wb") as f:
        downloaded = 0
        while chunk := resp.read(65536):
            f.write(chunk)
            downloaded += len(chunk)
            print(f"\r  {downloaded // 1024 // 1024} MB", end="", flush=True)
    print(f"\r  {os.path.getsize(dest) // 1024} KB — done        ")


def parse_alim(path: str) -> dict[str, str]:
    foods: dict[str, str] = {}
    for _, elem in iterparse(path, events=("end",)):
        if elem.tag == "alim":
            code = elem.get("alim_code", "").strip()
            name = elem.get("alim_nom_fr", "").strip()
            if code and name:
                foods[code] = name
            elem.clear()
    return foods


def parse_compo(path: str) -> dict[str, dict[str, float]]:
    data: dict[str, dict[str, float]] = {}
    target = set(CONST_CODES.keys())
    count = 0
    for _, elem in iterparse(path, events=("end",)):
        if elem.tag == "compo":
            const_code = elem.get("const_code", "")
            if const_code in target:
                alim_code = elem.get("alim_code", "")
                val = parse_teneur(elem.get("teneur", "-"))
                if val is not None:
                    data.setdefault(alim_code, {})[CONST_CODES[const_code]] = round(val, 1)
                count += 1
                if count % 10000 == 0:
                    print(f"\r  {count} entries parsed...", end="", flush=True)
            elem.clear()
    print(f"\r  {count} relevant entries parsed          ")
    return data


def main() -> None:
    print("=== CIQUAL 2025 JSON generator ===\n")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    print("1/4 — Aliments XML")
    if os.path.exists(TMP_ALIM):
        print(f"  Using cached {TMP_ALIM}")
    else:
        download(ALIM_URL, TMP_ALIM)

    print("2/4 — Compositions XML (large file, ~2 min)")
    if os.path.exists(TMP_COMPO):
        print(f"  Using cached {TMP_COMPO}")
    else:
        download(COMPO_URL, TMP_COMPO)

    print("3/4 — Parsing aliments...")
    foods = parse_alim(TMP_ALIM)
    print(f"  {len(foods)} foods found")

    print("4/4 — Parsing compositions...")
    compo = parse_compo(TMP_COMPO)
    print(f"  {len(compo)} compositions found")

    result = []
    for alim_code, name in foods.items():
        nutr = compo.get(alim_code, {})
        kcal = nutr.get("kcal")
        if kcal is None:
            continue
        result.append({
            "id": alim_code,
            "nom": name,
            "kcal": kcal,
            "proteines": nutr.get("proteines", 0.0),
            "glucides": nutr.get("glucides", 0.0),
            "lipides": nutr.get("lipides", 0.0),
            "fibres": nutr.get("fibres"),
            "sel": nutr.get("sel"),
        })

    result.sort(key=lambda x: x["nom"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUTPUT_PATH) // 1024
    print(f"\n✓ {OUTPUT_PATH}")
    print(f"  {len(result)} foods — {size_kb} KB")
    print("\nRestart Expo after regenerating to pick up the new file.")


if __name__ == "__main__":
    main()
