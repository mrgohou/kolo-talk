"""Normalise raw source dumps in data/sources into src/data/generated/*.json."""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "sources"
OUT = ROOT / "src" / "data" / "generated"
OUT.mkdir(parents=True, exist_ok=True)

VULGAR = re.compile(r"\b(sex|sexual|vagina|breast|buttock|prostitute|penis|fuck|endowed|genital)\w*", re.I)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def kolohq():
    rows = json.load(open(SRC / "kolohq_words.json"))
    out = []
    for r in rows:
        term = re.sub(r"\s+", " ", r["word"]).strip()
        definition = (r.get("definition") or "").strip()
        if not term or not definition:
            continue
        out.append({
            "id": "kolo-" + r["slug"],
            "term": term,
            "meaningEn": definition,
            "category": r.get("category") or "word",
            "region": r.get("region"),
            "register": "vulgar" if VULGAR.search(definition) else "informal",
            "sources": [{
                "name": "KoloHQ — Koloqua Dictionary" + (f" ({r['contributor']})" if r.get("contributor") else ""),
                "url": "https://kolohq.lovable.app/entry/" + r["id"],
            }],
        })
    return out


def deedotsherm():
    text = (SRC / "deedotsherm_liberian-english-101.txt").read_text()
    start = text.index("aayah:")
    end = text.index("Share this:")
    out = []
    for line in text[start:end].splitlines():
        m = re.match(r"^([A-Za-z’' ,\-]+?):\s*(.+)$", line.strip())
        if not m:
            continue
        term, rest = m.group(1).strip(), m.group(2).strip()
        pos = None
        pm = re.match(r"^((?:tr\. )?(?:n|v|adj|adv|interj|idiom)\.)\s*(.*)$", rest)
        if pm:
            pos, rest = pm.group(1), pm.group(2)
        out.append({
            "id": "dds-" + slug(term),
            "term": term,
            "pos": pos,
            "meaningEn": rest,
            "category": "word",
            "register": "vulgar" if VULGAR.search(rest) else "informal",
            "sources": [{"name": "Dee Dot Sherm — Liberian English 101", "url": "https://deedotsherm.wordpress.com/2011/02/23/liberian-english-101/"}],
        })
    return out


def youtube():
    rows = json.load(open(SRC / "youtube_index.json"))
    return [{
        "id": r["id"], "title": r.get("title"), "channel": r.get("channel"),
        "views": r.get("views"), "query": r.get("q"),
        "url": f"https://www.youtube.com/watch?v={r['id']}",
    } for r in rows]


for name, fn in [("kolohq", kolohq), ("deedotsherm", deedotsherm), ("youtube", youtube)]:
    data = fn()
    (OUT / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
    print(name, len(data))
