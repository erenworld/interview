"""Render an interview to audio with Kokoro, an open-source (Apache 2.0) TTS model.

Answers use a voice matching the guest, questions a second voice. Writes
public/assets/audio/<slug>.mp3 and public/assets/audio/<slug>.json (the start time of every
paragraph), which the site's player uses to play and follow along. It reads the
built pages, so run `npm run build` first.

    python tools/voices/generate.py franck-pachot [--limit 5]
    python tools/voices/generate.py --all

Setup (Python 3.11): brew install espeak-ng, then
    pip install "kokoro>=0.9" soundfile "setuptools<81" \
      "en_core_web_sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl"
"""
import argparse, json, os, re, subprocess, sys, tempfile, time
from html.parser import HTMLParser
from pathlib import Path

# Kokoro's phonemizer ships without espeak-ng data on macOS: use Homebrew's (brew install espeak-ng).
for prefix in ("/opt/homebrew", "/usr/local"):
    if Path(f"{prefix}/share/espeak-ng-data").exists():
        os.environ.setdefault("ESPEAK_DATA_PATH", f"{prefix}/share/espeak-ng-data")
        os.environ.setdefault("PHONEMIZER_ESPEAK_LIBRARY", f"{prefix}/lib/libespeak-ng.dylib")
        break

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "assets" / "audio"
PAGES = ROOT / "dist" / "articles"  # built pages: run `npm run build` first
STOP = re.compile(r"^(where-can-people-find|links$|can-people-contact|whats-the-best-way-to-reach)")
EXTRAS = re.compile(r"<!-- ds:extra -->.*?<!-- /ds:extra -->", re.S)
SR = 24000
VOICES = {"female": "af_heart", "male": "am_michael"}


class Segments(HTMLParser):
    """Title, then every question and answer of .article-body, in reading order.
    Mirrors the segments the site's player builds in site.js, so indexes line up."""

    def __init__(self):
        super().__init__()
        self.segments, self.depth, self.in_body, self.stop, self.cur, self.buf = [], 0, False, False, None, ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "h1" and not self.segments and self.cur is None:
            self.cur, self.buf = ("h1", None), ""
        if tag == "div" and a.get("class") == "article-body":
            self.in_body, self.depth = True, 0
        if not self.in_body or self.stop:
            return
        if tag == "div":
            self.depth += 1
        if tag == "h2" and STOP.match(a.get("id", "")):
            self.stop = True
        elif tag in ("h2", "p", "li", "blockquote") and self.cur is None:
            self.cur, self.buf = (tag, a.get("id")), ""

    def handle_endtag(self, tag):
        if self.in_body and tag == "div":
            self.depth -= 1
            if self.depth == 0:
                self.in_body = False
        if self.cur and tag == self.cur[0]:
            text = re.sub(r"\s+", " ", self.buf).strip()
            if len(text) > 1:
                role = "guest" if tag in ("p", "li", "blockquote") else "host"
                self.segments.append({"role": role, "text": text, "id": self.cur[1]})
            self.cur = None

    def handle_data(self, data):
        if self.cur:
            self.buf += data


def render(slug, pipeline, limit=None):
    import numpy as np

    html = (PAGES / f"{slug}.html").read_text()
    gender = re.search(r'data-voice="(\w+)"', html).group(1)
    name = re.search(r'data-guest="([^"]+)"', html).group(1)
    guest_voice = VOICES[gender]
    host_voice = VOICES["male" if gender == "female" else "female"]

    parser = Segments()
    parser.feed(EXTRAS.sub("", html))
    segments = parser.segments
    segments[0]["text"] = f"Interview with {name}, on DatabaseStory."
    if limit:
        segments = segments[:limit]

    pieces, timeline, t, started = [], [], 0.0, time.time()
    for index, seg in enumerate(segments):
        timeline.append({"t": round(t, 2), "role": seg["role"], "id": seg["id"]})
        voice = guest_voice if seg["role"] == "guest" else host_voice
        for result in pipeline(seg["text"], voice=voice, speed=1.0):
            audio = result.audio.numpy() if hasattr(result.audio, "numpy") else np.asarray(result.audio)
            pieces.append(audio)
            t += len(audio) / SR
        gap = 0.6 if seg["role"] == "host" else 0.4
        pieces.append(np.zeros(int(SR * gap), dtype=np.float32))
        t += gap
        print(f"\r{slug}: {index + 1}/{len(segments)} paragraphs", end="", flush=True)
    print()

    import soundfile as sf

    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        sf.write(tmp.name, np.concatenate(pieces), SR)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name, "-ac", "1",
                        "-af", "loudnorm=I=-18:TP=-1.5", "-codec:a", "libmp3lame", "-b:a", "48k",
                        str(OUT / f"{slug}.mp3")], check=True)
    (OUT / f"{slug}.json").write_text(json.dumps({"duration": round(t, 2), "segments": timeline}, indent=1))
    print(f"wrote public/assets/audio/{slug}.mp3 ({t / 60:.1f} min of audio in {(time.time() - started) / 60:.1f} min)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--limit", type=int, help="only the first N paragraphs (quick test)")
    ap.add_argument("--threads", type=int, default=2, help="CPU threads to use (default 2)")
    args = ap.parse_args()
    slugs = sorted(p.stem for p in PAGES.glob("*.html")) if args.all else args.slugs
    if not slugs:
        sys.exit("Give an article slug, or --all.")

    import torch
    from kokoro import KPipeline

    torch.set_num_threads(args.threads)  # keep the machine cool: a couple of cores is plenty

    pipeline = KPipeline(lang_code="a")  # American English
    for slug in slugs:
        render(slug, pipeline, args.limit)


if __name__ == "__main__":
    main()
