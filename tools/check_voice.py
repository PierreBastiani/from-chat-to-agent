"""Transcribes the generated narration with Whisper, to catch mispronounced words.

Setup (Apple Silicon): pip install mlx-whisper
Usage: python tools/check_voice.py build/audio/en/*.wav
Prints each file's transcript; compare it with voiceover/en.md by eye.
"""
import sys

import mlx_whisper

for f in sys.argv[1:]:
    r = mlx_whisper.transcribe(f, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="en")
    print("==", f.rsplit("/", 1)[-1], "\n", r["text"].strip(), flush=True)
