"""English narration of the deck with Kokoro (kokoro-onnx, Apache 2.0, runs on CPU), one WAV per slide.

Setup (Python <= 3.12):  pip install kokoro-onnx soundfile numpy
  and download kokoro-v1.0.onnx + voices-v1.0.bin from https://github.com/thewh1teagle/kokoro-onnx/releases
  into ~/.cache/kokoro-tts (or set KOKORO_DIR).
Usage: python tools/narrate.py [--voice af_heart] [--only id1,id2] [--force]

Reads voiceover/en.md (one "## <slide id>" section per slide), generates it sentence by sentence,
trims the silences and joins them with short pauses. Writes build/audio/en/<id>.wav and
build/audio/en/durations.json. An existing slide WAV is kept unless --force.
"""
import argparse
import json
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
MODELS = os.environ.get("KOKORO_DIR", os.path.expanduser("~/.cache/kokoro-tts"))
GAP_S, LEAD_S, TAIL_S, SPEED = 0.32, 0.4, 0.8, 1.0
# Spoken spellings, applied only to what the voice reads (en.md stays readable).
# Checked by transcribing the output with Whisper (tools/check_voice.py).
SAY = [("M.C.P.", "M C P"), ("H.T.M.L.", "H T M L"), ("S.S.H.", "S S H"),
       ("I.T.", "I T"), ("dot M.D.", "dot M D"), ("Llama", "Lahma"), ("GPT-3", "G P T 3"), ("ChatGPT", "Chat G P T"),
       ("Tcl", "tickle")]


def sections(md_path):
    out, cur = {}, None
    for line in md_path.read_text().splitlines():
        m = re.match(r"^## (\S+)\s*$", line)
        if m:
            cur = m.group(1)
            out[cur] = ""
        elif cur and line.strip():
            out[cur] = (out[cur] + " " + line.strip()).strip()
    return out


def sentences(text):
    return [p for p in re.split(r"(?<=[.!?])\s+(?=[A-Z\"0-9])", text) if p.strip()]


def spoken(text):
    for a, b in SAY:
        text = text.replace(a, b)
    return text


def trim(wav, sr, top_db=40):
    """Cuts leading and trailing silence (simple energy gate, no librosa in this venv)."""
    frame = int(0.02 * sr)
    if len(wav) < frame * 3:
        return wav
    energy = np.array([np.sqrt(np.mean(wav[i:i + frame] ** 2)) for i in range(0, len(wav) - frame, frame)])
    loud = np.where(energy > energy.max() * 10 ** (-top_db / 20))[0]
    if not len(loud):
        return wav
    return wav[max(0, loud[0] - 1) * frame:min(len(wav), (loud[-1] + 2) * frame)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--only", default="")
    ap.add_argument("--out", default=str(ROOT / "build/audio"))
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    script = sections(ROOT / "voiceover/en.md")
    only = [s for s in args.only.split(",") if s]
    out_dir = Path(args.out) / "en"
    out_dir.mkdir(parents=True, exist_ok=True)
    dur_path = out_dir / "durations.json"
    durations = json.loads(dur_path.read_text()) if dur_path.exists() else {}
    kokoro = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    lang = "en-gb" if args.voice.startswith("b") else "en-us"
    for sid, text in script.items():
        if only and sid not in only:
            continue
        dest = out_dir / f"{sid}.wav"
        if dest.exists() and not args.force:
            durations[sid] = round(sf.info(dest).duration, 3)
            continue
        if not text:
            durations[sid] = 0.0
            continue
        sr, chunks = 24000, []
        for s in sentences(spoken(text)):
            wav, sr = kokoro.create(s, voice=args.voice, speed=SPEED, lang=lang)
            chunks += [trim(np.asarray(wav, np.float32), sr), np.zeros(int(GAP_S * sr), np.float32)]
        full = np.concatenate([np.zeros(int(LEAD_S * sr), np.float32)] + chunks + [np.zeros(int(TAIL_S * sr), np.float32)])
        sf.write(dest, full, sr)
        durations[sid] = round(len(full) / sr, 3)
        dur_path.write_text(json.dumps(durations, indent=2))
        print(sid, durations[sid], "s", flush=True)
    dur_path.write_text(json.dumps(durations, indent=2))


if __name__ == "__main__":
    main()
