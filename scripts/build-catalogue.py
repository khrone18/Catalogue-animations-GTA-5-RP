#!/usr/bin/env python3
"""Génère src/data/catalogue.json depuis les sources Lua réelles.

Sources (épinglées pour rester reproductibles) :
  * alberttheprince/rpemotes-reborn — client/AnimationList.lua
  * Scullyy/scully_emotemenu       — shared/data/emotes/*.lua

Usage :
    npm run data            # télécharge si besoin puis régénère le catalogue
    python3 scripts/build-catalogue.py --refresh   # force le téléchargement

Les fichiers bruts sont mis en cache dans data/raw/ (non versionné).
Aucune animation n'est inventée : chaque entrée provient d'une table Lua.
"""
import json, re, sys, urllib.request
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "data" / "catalogue.json"

RP_SHA = "d3553c1985b03ee0bf290592a8378fa20cfeeaed"
SCULLY_SHA = "494cd18b8a381ff12fc603a0aae8a3968667177a"

SOURCES = {
    "AnimationList.lua":
        f"https://raw.githubusercontent.com/alberttheprince/rpemotes-reborn/{RP_SHA}/client/AnimationList.lua",
    "scully_general_emotes.lua":
        f"https://raw.githubusercontent.com/Scullyy/scully_emotemenu/{SCULLY_SHA}/shared/data/emotes/general.lua",
    "scully_dance_emotes.lua":
        f"https://raw.githubusercontent.com/Scullyy/scully_emotemenu/{SCULLY_SHA}/shared/data/emotes/dances.lua",
    "scully_prop_emotes.lua":
        f"https://raw.githubusercontent.com/Scullyy/scully_emotemenu/{SCULLY_SHA}/shared/data/emotes/props.lua",
    "scully_animal_emotes.lua":
        f"https://raw.githubusercontent.com/Scullyy/scully_emotemenu/{SCULLY_SHA}/shared/data/emotes/animal.lua",
    "scully_consumable_emotes.lua":
        f"https://raw.githubusercontent.com/Scullyy/scully_emotemenu/{SCULLY_SHA}/shared/data/emotes/consumables.lua",
    "scully_synchronized_emotes.lua":
        f"https://raw.githubusercontent.com/Scullyy/scully_emotemenu/{SCULLY_SHA}/shared/data/emotes/synchronized.lua",
    "scully_expressions.lua":
        f"https://raw.githubusercontent.com/Scullyy/scully_emotemenu/{SCULLY_SHA}/shared/data/emotes/expressions.lua",
    "scully_walks.lua":
        f"https://raw.githubusercontent.com/Scullyy/scully_emotemenu/{SCULLY_SHA}/shared/data/emotes/walks.lua",
}


def fetch(name: str, refresh: bool) -> Path:
    """Télécharge une source dans data/raw/ (ou réutilise le cache)."""
    RAW.mkdir(parents=True, exist_ok=True)
    target = RAW / name
    if target.exists() and not refresh:
        return target
    url = SOURCES[name]
    print(f"↓ {url}", file=sys.stderr)
    with urllib.request.urlopen(url, timeout=60) as response:
        target.write_bytes(response.read())
    return target


def read_source(name: str) -> str:
    return (RAW / name).read_text(encoding="utf-8")

# ----------------------------- Lua table parser -----------------------------
class LuaParser:
    def __init__(self, text):
        self.s = text
        self.i = 0
        self.n = len(text)

    def skip(self):
        s, n = self.s, self.n
        while self.i < n:
            c = s[self.i]
            if c in " \t\r\n,":
                self.i += 1
            elif s.startswith("--", self.i):
                m = re.match(r"--\[(=*)\[", s[self.i:])
                if m:
                    close = "]" + m.group(1) + "]"
                    j = s.find(close, self.i)
                    self.i = n if j < 0 else j + len(close)
                else:
                    j = s.find("\n", self.i)
                    self.i = n if j < 0 else j + 1
            else:
                break

    def parse_value(self):
        self.skip()
        s = self.s
        c = s[self.i]
        if c == "{":
            return self.parse_table()
        if c in "'\"":
            return self.parse_string(c)
        if c == "[":
            # long string [[...]] or [=[...]=]
            m = re.match(r"\[(=*)\[", s[self.i:])
            if m:
                close = "]" + m.group(1) + "]"
                start = self.i + len(m.group(0))
                j = s.find(close, start)
                self.i = self.n if j < 0 else j + len(close)
                return s[start:self.n if j < 0 else j]
        m = re.match(r"-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?", s[self.i:])
        if m:
            self.i += len(m.group(0))
            txt = m.group(0)
            return float(txt) if ("." in txt or "e" in txt.lower()) else int(txt)
        m = re.match(r"[A-Za-z_][\w.]*", s[self.i:])
        if m:
            self.i += len(m.group(0))
            word = m.group(0)
            if word == "true": return True
            if word == "false": return False
            if word == "nil": return None
            if word == "return":
                # Lua file header: "return { ... }" — skip the keyword and parse the table.
                self.skip()
                return self.parse_value()
            # function call like vec3(...) / locale('x')
            self.skip()
            if self.i < self.n and self.s[self.i] == "(":
                depth = 0
                start = self.i
                while self.i < self.n:
                    ch = self.s[self.i]
                    if ch == "(":
                        depth += 1
                    elif ch == ")":
                        depth -= 1
                        if depth == 0:
                            self.i += 1
                            break
                    self.i += 1
                return {"__call": word, "__raw": self.s[start:self.i]}
            return {"__ident": word}
        # unknown: consume one char
        self.i += 1
        return None

    def parse_string(self, quote):
        s = self.s
        self.i += 1
        out = []
        while self.i < self.n:
            c = s[self.i]
            if c == "\\":
                nxt = s[self.i + 1:self.i + 2]
                mapping = {"n": "\n", "t": "\t", "r": "\r", "\\": "\\", "'": "'", '"': '"'}
                out.append(mapping.get(nxt, nxt))
                self.i += 2
                continue
            if c == quote:
                self.i += 1
                break
            out.append(c)
            self.i += 1
        return "".join(out)

    def parse_table(self):
        assert self.s[self.i] == "{"
        self.i += 1
        arr = []
        obj = OrderedDict()
        while True:
            self.skip()
            if self.i >= self.n:
                break
            if self.s[self.i] == "}":
                self.i += 1
                break
            # key?
            key = None
            save = self.i
            if self.s[self.i] == "[":
                self.i += 1
                key = self.parse_value()
                self.skip()
                if self.i < self.n and self.s[self.i] == "]":
                    self.i += 1
                self.skip()
                if self.i < self.n and self.s[self.i] == "=":
                    self.i += 1
                else:
                    self.i = save
                    key = None
            elif re.match(r"[A-Za-z_][\w]*\s*=", self.s[self.i:self.i + 80]):
                m = re.match(r"([A-Za-z_][\w]*)\s*=", self.s[self.i:])
                key = m.group(1)
                self.i += len(m.group(0))
            if key is not None:
                obj[key] = self.parse_value()
            else:
                arr.append(self.parse_value())
        if obj and not arr:
            return obj
        if obj:
            obj["__array"] = arr
            return obj
        return arr


def extract_section(text, marker):
    m = re.search(re.escape(marker) + r"\s*=\s*\{", text)
    if not m:
        return None
    start = m.end() - 1
    depth = 0
    i = start
    n = len(text)
    while i < n:
        c = text[i]
        if c == '"' or c == "'":
            q = c
            i += 1
            while i < n:
                if text[i] == "\\":
                    i += 2
                    continue
                if text[i] == q:
                    break
                i += 1
        elif c == "-" and text.startswith("--", i):
            j = text.find("\n", i)
            i = n if j < 0 else j
            continue
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return LuaParser(text[start:i + 1]).parse_table()
        i += 1
    return None


def val(entry, key):
    if isinstance(entry, dict):
        return entry.get(key)
    return None


def ident(v):
    if isinstance(v, dict) and "__ident" in v:
        return v["__ident"]
    return v


def arr_of(entry):
    if isinstance(entry, dict):
        return entry.get("__array", [])
    if isinstance(entry, list):
        return entry
    return []


def first_str(items):
    for v in items:
        if isinstance(v, str):
            return v
    return None


# ------------------------------- Build rows --------------------------------
rows = []


def push(**kw):
    kw["id"] = re.sub(r"[^a-z0-9]+", "-", str(kw["command"]).lower()).strip("-")
    rows.append(kw)


# ------------------------------ Téléchargement -------------------------------
refresh = "--refresh" in sys.argv[1:]
for name in SOURCES:
    fetch(name, refresh)

rp = read_source("AnimationList.lua")

# Expressions: ["Aiming"] = {"mood_aiming_1"}
for name, entry in (extract_section(rp, "RP.Expressions") or {}).items():
    if name == "__array":
        continue
    items = arr_of(entry)
    push(label=name, command=name.lower(), expression=first_str(items), kind="expression",
         source="rpemotes", category="Expressions")

# Walks: ["Alien"] = {"move_m@alien"}
for name, entry in (extract_section(rp, "RP.Walks") or {}).items():
    if name == "__array":
        continue
    items = arr_of(entry)
    walk = first_str(items)
    label = next((x for x in items[1:] if isinstance(x, str)), name)
    push(label=label if label != walk else name, command=name.lower(), walk=walk, kind="walk",
         source="rpemotes", category="Demarches")

# Shared / synchronised: [cmd] = {dict, anim, label, target, options}
for name, entry in (extract_section(rp, "RP.Shared") or {}).items():
    if name == "__array":
        continue
    items = arr_of(entry)
    opts = next((x for x in items if isinstance(x, dict)), {})
    push(label=items[2] if len(items) > 2 and isinstance(items[2], str) else name,
         command=name.lower(), dict=items[0] if isinstance(items[0], str) else "",
         anim=items[1] if len(items) > 1 and isinstance(items[1], str) else "",
         other=items[3] if len(items) > 3 and isinstance(items[3], str) else None,
         kind="synchronized", source="rpemotes", category="Duo & synchronise")

# Dances: [cmd] = {dict, anim, label, options}
for name, entry in (extract_section(rp, "RP.Dances") or {}).items():
    if name == "__array":
        continue
    items = arr_of(entry)
    push(label=items[2] if len(items) > 2 and isinstance(items[2], str) else name,
         command=name.lower(), dict=items[0] if isinstance(items[0], str) else "",
         anim=items[1] if len(items) > 1 and isinstance(items[1], str) else "",
         kind="animation", source="rpemotes", category="Danses")

# Animal emotes
for name, entry in (extract_section(rp, "RP.AnimalEmotes") or {}).items():
    if name == "__array":
        continue
    items = arr_of(entry)
    push(label=items[2] if len(items) > 2 and isinstance(items[2], str) else name,
         command=name.lower(), dict=items[0] if isinstance(items[0], str) else "",
         anim=items[1] if len(items) > 1 and isinstance(items[1], str) else "",
         kind="animal", source="rpemotes", category="Animaux")

# Emotes: scenario or animation
for name, entry in (extract_section(rp, "RP.Emotes") or {}).items():
    if name == "__array":
        continue
    items = arr_of(entry)
    if items and isinstance(items[0], dict) and "__ident" in items[0]:
        push(label=items[2] if len(items) > 2 and isinstance(items[2], str) else name,
             command=name.lower(), scenario=items[1] if len(items) > 1 and isinstance(items[1], str) else "",
             scenario_type=ident(items[0]), kind="scenario", source="rpemotes", category="Divers")
    else:
        push(label=items[2] if len(items) > 2 and isinstance(items[2], str) else name,
             command=name.lower(), dict=items[0] if isinstance(items[0], str) else "",
             anim=items[1] if len(items) > 1 and isinstance(items[1], str) else "",
             kind="animation", source="rpemotes", category="Divers")

# Prop emotes
for name, entry in (extract_section(rp, "RP.PropEmotes") or {}).items():
    if name == "__array":
        continue
    items = arr_of(entry)
    opts = next((x for x in items[3:] if isinstance(x, dict)), {})
    prop = opts.get("Prop") if isinstance(opts, dict) else None
    if not prop and isinstance(opts, dict) and isinstance(opts.get("Props"), list) and opts["Props"]:
        p0 = opts["Props"][0]
        prop = val(p0, "Name")
    push(label=items[2] if len(items) > 2 and isinstance(items[2], str) else name,
         command=name.lower(), dict=items[0] if isinstance(items[0], str) else "",
         anim=items[1] if len(items) > 1 and isinstance(items[1], str) else "",
         prop=prop if isinstance(prop, str) else None,
         kind="prop", source="rpemotes", category="Objets")

# ---- Scully files ----
def scully_file(path, kind, category):
    data = LuaParser(read_source(path)).parse_value()
    opts = data.get("options", []) if isinstance(data, dict) else data
    for e in (opts or []):
        if not isinstance(e, dict):
            continue
        command = e.get("Command")
        if not command:
            continue
        label = e.get("Label") or command
        prop = None
        o = e.get("Options") or {}
        if isinstance(o, dict):
            if isinstance(o.get("Prop"), str):
                prop = o["Prop"]
            elif isinstance(o.get("Props"), list) and o["Props"]:
                p0 = o["Props"][0]
                prop = val(p0, "Name")
        push(label=label, command=str(command).lower(), dict=e.get("Dictionary", ""),
             anim=e.get("Animation", ""), prop=prop, kind=kind, source="scully",
             category=category)

scully_file("scully_general_emotes.lua", "animation", "Divers")
scully_file("scully_dance_emotes.lua", "animation", "Danses")
scully_file("scully_prop_emotes.lua", "prop", "Objets")
scully_file("scully_animal_emotes.lua", "animal", "Animaux")
scully_file("scully_consumable_emotes.lua", "prop", "Consommation")
scully_file("scully_synchronized_emotes.lua", "synchronized", "Duo & synchronise")

# Scully expressions / walks have no wrapper table
for path, kind, cat, key in [
    ("scully_expressions.lua", "expression", "Expressions", "Expression"),
    ("scully_walks.lua", "walk", "Demarches", "Walk"),
]:
    data = LuaParser(read_source(path)).parse_value()
    for e in data:
        if not isinstance(e, dict) or not e.get("Command"):
            continue
        push(label=e.get("Label") or e["Command"], command=str(e["Command"]).lower(),
             expression=e.get(key) if kind == "expression" else None,
             walk=e.get(key) if kind == "walk" else None,
             kind=kind, source="scully", category=cat)

# --------------------------------- Merge -----------------------------------
def quality(r):
    score = 0
    if r.get("dict") and r.get("anim"): score += 2
    if r.get("prop"): score += 3
    if r.get("scenario"): score += 1
    if r.get("kind") == "prop": score += 1
    return score

merged = OrderedDict()
for r in rows:
    key = r["command"]
    if not key:
        continue
    old = merged.get(key)
    if not old:
        r["sources"] = sorted({r["source"]})
        merged[key] = r
    else:
        old.setdefault("sources", [old["source"]])
        if r["source"] not in old["sources"]:
            old["sources"].append(r["source"])
        if quality(r) > quality(old):
            srcs = old["sources"]
            r["sources"] = srcs
            merged[key] = r
        else:
            for f in ("prop", "scenario", "other"):
                if not old.get(f) and r.get(f):
                    old[f] = r[f]

# ------------------------------ Classify -----------------------------------
RULES = [
    ("Danses", r"\b(dance|dancing|twerk|groove|boogie|shuffle|bachata|salsa|ballet|breakdance|floss|robot|krump|vogue|twist|swing)\b"),
    ("Salutations", r"\b(wave|salute|handshake|hug|kiss|bow|curtsy|namaste|highfive|high-five|fistbump|bro|greet|dap|handshake|embrace|cheek|wave2|peace)\b"),
    ("Boire & manger", r"\b(beer|drink|coffee|eat|food|burger|taco|donut|doughnut|sandwich|hotdog|wine|champagne|whisky|whiskey|vodka|soda|juice|snack|pizza|fries|steak|bbq|barbecue|cook|chef|bartend|shot|toast|cheers)\b"),
    ("Fumer", r"\b(smoke|smoking|cigarette|cigar|vape|bong|joint|weed)\b"),
    ("Téléphone & tech", r"\b(phone|text|selfie|camera|photo|film|record|laptop|computer|type|typing|keyboard|radio|dj|headphone|binocular|tablet)\b"),
    ("Musique", r"\b(guitar|violin|drum|piano|sax|trumpet|sing|microphone|mic|music|concert|band|harp|flute|cello|bass)\b"),
    ("Police & secours", r"\b(cop|police|sheriff|swat|army|military|soldier|guard|medic|ems|fireman|firefighter|paramedic|handcuff|arrest|ticket|badge|patrol|marine|ranger|security)\b"),
    ("Sport & fitness", r"\b(gym|workout|pushup|push-up|situp|sit-up|yoga|stretch|flex|muscle|jog|run|box|boxing|fight|martial|karate|kung|tai chi|plank|squat|weight|lift|pullup|pull-up|sport|bike|skate|surf|swim)\b"),
    ("Assis & repos", r"\b(sit|sitting|lay|lying|kneel|kneeling|crouch|sleep|rest|lean|relax|campfire|picnic|sunbathe|meditate|nap|sleeping|prone|situp|ledge|bench)\b"),
    ("Métiers & atelier", r"\b(mechanic|repair|weld|hammer|drill|shovel|dig|fish|fishing|garden|janitor|maid|clean|cook|chef|mine|mining|chop|axe|chainsaw|saw|wrench|tool|clipboard|notepad|parking|atm|bin|trash|garbage|sweep|mop|harvest|farm|bail|tow|delivery|mail|paper)\b"),
    ("Gestes", r"\b(point|clap|applaud|thumb|okay|ok|peace|middlefinger|finger|facepalm|shrug|think|crossarm|crossed|handsup|hands up|surrender|stop|shush|beckon|come|yes|no|nod|shake|taunt|flip|insult|wave|salute|dab|hit|slap|punch|kick|fuck|rude|whatever|salute)\b"),
    ("Émotions", r"\b(cry|crying|laugh|laughing|angry|sad|happy|scared|afraid|nervous|shy|embarrass|bored|tired|drunk|sick|injured|hurt|dead|die|pain|scream|panic|pray|beg|plead|love|heart|blush)\b"),
]

def match_cat(text):
    for cat, pattern in RULES:
        if re.search(pattern, text):
            return cat
    return None

def classify(r):
    if r["kind"] == "animal": return "Animaux"
    if r["kind"] == "synchronized": return "Duo & synchronisé"
    if r["kind"] == "expression": return "Expressions"
    if r["kind"] == "walk": return "Démarches"
    if r["category"] == "Consommation": return "Boire & manger"
    label = f"{r.get('label','')} {r.get('command','')}".lower().replace("_", " ")
    found = match_cat(label)
    if found: return found
    dicttext = f"{r.get('dict','')} {r.get('anim','')}".lower().replace("_", " ")
    found = match_cat(dicttext)
    if found: return found
    if r["kind"] == "prop": return "Objets"
    if r["kind"] == "scenario": return "Scénarios"
    return "Général"

# Preview archetype is computed in the app from label/command/dict; no extra data needed.

for r in merged.values():
    r["category"] = classify(r)
    r.pop("source", None)
    r.pop("scenario_type", None)
    for k in [k for k, v in r.items() if v in (None, "", [])]:
        r.pop(k, None)

out = list(merged.values())
out.sort(key=lambda r: (r["category"], r["label"].lower()))
print(f"{len(out)} emotes uniques", file=sys.stderr)
from collections import Counter
print(Counter(r["category"] for r in out), file=sys.stderr)
print(Counter(r["kind"] for r in out), file=sys.stderr)
OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w", encoding="utf-8") as handle:
    json.dump(out, handle, ensure_ascii=False, separators=(",", ":"))
print(f"✓ {OUT.relative_to(ROOT)} ({len(out)} entrées)", file=sys.stderr)
