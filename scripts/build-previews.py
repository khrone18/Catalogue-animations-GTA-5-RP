#!/usr/bin/env python3
"""Correspondance catalogue → rendus 3D statiques de Plebmasters Forge.

Pour chaque dictionnaire du catalogue, on interroge l'API public de Forge
(https://api.plebmasters.de/v1/animations/search) et on récupère l'aperçu
statique (`imageThumbnailUrl`) du ped jouant l'animation.

L'identifiant Forge d'une animation est `{dictionnaire}@{nom_d_animation}`.

Sortie : src/data/forge-previews.json — { "{dict}@{anim}": "chemin vers l'image" }
L'image complète est servie par https://assets-gta.plebmasters.de/animations/<chemin>.

Le quota de l'API est serré (429) : requêtes séquentielles, lentes, avec
backoff long, cooldown initial et reprise incrémentale (le fichier de sortie
est écrit tous les 25 dictionnaires et sert de cache).
"""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOGUE = ROOT / "src" / "data" / "catalogue.json"
OUT = ROOT / "src" / "data" / "forge-previews.json"

API = "https://api.plebmasters.de/v1/animations/search"
ASSETS_PREFIX = "https://assets-gta.plebmasters.de/animations/"
PED = "A_F_Y_Beach_01"
TAKE = 40
MAX_PER_DICT = 400        # garde-fou anti boucle infinie
INTERVAL = 1.1            # secondes entre deux requêtes (quota serré)
COOLDOWN = 150            # pause initiale pour laisser respirer le quota
RETRIES = 6               # tentatives max par requête

HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://forge.plebmasters.de",
    "Referer": "https://forge.plebmasters.de/",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) terrain-emotes-catalogue/2.0",
}


def post(term: str, skip: int, take: int):
    last: Exception | None = None
    for attempt in range(RETRIES):
        try:
            time.sleep(INTERVAL)
            body = json.dumps(
                {
                    "SearchTerm": term,
                    "SearchTags": [],
                    "Skip": skip,
                    "Take": take,
                    "PedModelName": PED,
                }
            ).encode()
            req = urllib.request.Request(API, body, headers=HEADERS, method="POST")
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429:
                wait = 30.0 * (attempt + 1)
                print(f"  429 → pause {int(wait)} s", file=sys.stderr)
            else:
                wait = 1.0 * (attempt + 1)
            time.sleep(wait)
        except Exception as e:
            last = e
            time.sleep(1.0 * (attempt + 1))
    raise last if last else RuntimeError("post failed")


def main():
    catalogue = json.loads(CATALOGUE.read_text())
    pairs = [
        (e["dict"], e["anim"])
        for e in catalogue
        if isinstance(e.get("dict"), str)
        and isinstance(e.get("anim"), str)
        and e.get("dict")
        and e.get("anim")
    ]
    wanted = {f"{d}@{a}" for d, a in pairs}

    previews: dict[str, str] = {}
    if OUT.exists():
        try:
            previews.update(json.loads(OUT.read_text()))
            print(f"resume: {len(previews)} déjà mappés", file=sys.stderr)
        except Exception:
            pass

    dicts = sorted({d for d, _ in pairs if not any(f"{d}@{a}" in previews for _, a in pairs if d in "")} )
    dicts = sorted({d for d, _ in pairs if not any(k.startswith(f"{d}@") for k in previews)})
    print(f"{len(dicts)} dictionnaires restants · {len(previews)} déjà mappés", file=sys.stderr)

    def save():
        OUT.write_text(json.dumps(previews, ensure_ascii=False, separators=(",", ":")))

    print(f"cooldown initial {COOLDOWN} s…", file=sys.stderr)
    time.sleep(COOLDOWN)

    errors = 0
    for i, d in enumerate(dicts, 1):
        try:
            skip = 0
            while skip < MAX_PER_DICT:
                data = post(d, skip, TAKE)
                results = data.get("results") or []
                for r in results:
                    if (
                        not r.get("isAdvertisement")
                        and r.get("dictionaryName") == d
                        and r.get("imageThumbnailUrl")
                    ):
                        ident = f"{r['dictionaryName']}@{r['name']}"
                        if ident in wanted:
                            url = r["imageThumbnailUrl"]
                            previews[ident] = (
                                url[len(ASSETS_PREFIX):]
                                if url.startswith(ASSETS_PREFIX)
                                else url
                            )
                if not results or len(results) < TAKE:
                    break
                skip += TAKE
        except Exception as exc:
            errors += 1
            print(f"dictionnaire {d}: {type(exc).__name__}", file=sys.stderr)
        if i % 25 == 0:
            save()
            print(f"[{i}/{len(dicts)}] {len(previews)} correspondances · {errors} échecs", file=sys.stderr)

    save()
    print(f"✓ {OUT.name} — {len(previews)} rendus mappés · {errors} échecs", file=sys.stderr)


if __name__ == "__main__":
    main()
