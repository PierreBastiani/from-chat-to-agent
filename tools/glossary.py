"""Builds the glossary slides (deck/slides/glossary-1..4.html): every notion of the talk in the order
it comes up, with the French term next to it (the talk was first given in French).

Usage: python3 -I tools/glossary.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# (english, français, definition, read more)
TERMS = [
    ("LLM", "LLM", "Large language model: trained to predict the next word of a text.", "3Blue1Brown · LLMs explained briefly"),
    ("Token", "token", "Piece of a word, the unit the model reads and writes.", "platform.openai.com/tokenizer"),
    ("Pre-training", "pré-entraînement", "First stage: read a huge corpus to learn to continue any text.", "Karpathy · Intro to LLMs"),
    ("Base model", "modèle de base", "Model out of pre-training: it completes text, with no dialogue format.", "huggingface.co/learn/llm-course"),
    ("Fine-tuning", "fine-tuning", "Extra training on chosen examples, to change the model's behavior.", "huggingface.co/learn/llm-course"),
    ("Instruct / chat model", "modèle instruct", "Model fine-tuned to follow instructions and hold a dialogue.", "huggingface.co/learn/llm-course"),
    ("Temperature", "température", "Sampling setting: 0 takes the most likely token, higher varies more.", "docs.claude.com · Messages API"),
    ("Hallucination", "hallucination", "Wrong answer given with confidence, for lack of information in the context.", "en.wikipedia.org · Hallucination (AI)"),
    ("Context", "contexte", "All the text the model reads on a given call.", "docs.claude.com · context windows"),
    ("Context window", "fenêtre de contexte", "Maximum size of the context, counted in tokens.", "docs.claude.com · context windows"),
    ("Harness", "harnais", "The program around the model: prepares the text, calls the model, runs the tools.", "mubbie.github.io · Agents are Loops"),
    ("Stop sequence", "mot d’arrêt", "Text that makes the harness cut the generation as soon as the model writes it.", "github.com/ollama/ollama · docs/api.md"),
    ("Special token", "token spécial", "Chat-format tag (<|im_start|>…) learned during fine-tuning.", "huggingface.co/docs · chat templates"),
    ("System prompt", "prompt système", "Instructions the harness puts at the start of the context.", "docs.claude.com · system prompts"),
    ("Tool, tool call", "outil, appel d’outil", "Action the model asks for in text and the harness runs.", "docs.claude.com · tool use"),
    ("Agentic loop", "boucle agentique", "Think, act, observe, repeat while a tool is called.", "anthropic.com · Building effective agents"),
    ("Agent", "agent", "A model in that loop, with tools.", "anthropic.com · Building effective agents"),
    ("Chain of thought", "chaîne de raisonnement", "Steps the model writes before its answer.", "docs.claude.com · extended thinking"),
    ("Permissions", "permissions", "Harness rules on what it runs; the model cannot get around them.", "code.claude.com/docs · permissions"),
    ("Rules file", "fichier de règles", "GEMINI.md, CLAUDE.md: text added at the start of every conversation.", "code.claude.com/docs · memory"),
    ("Skill", "skill", "Folder with a SKILL.md: instructions loaded only when they are needed.", "docs.claude.com · Agent Skills"),
    ("Deterministic", "déterministe", "Same input, same output: a script is, the model's reply is not.", "en.wikipedia.org · Deterministic algorithm"),
    ("Sub-agent", "sous-agent", "Agent started by an agent, with an empty context and a single task.", "code.claude.com/docs · subagents"),
    ("MCP", "MCP", "Model Context Protocol: gives a harness a service's tools (database, licenses), with its access rights.", "modelcontextprotocol.io"),
    ("API", "API", "One program's entry point for another, often a URL called over HTTP.", "developer.mozilla.org · Web APIs"),
    ("JSON", "JSON", "Text format for structured data, used for tool calls.", "json.org"),
    ("Bash", "bash", "The command language of the Linux terminal.", "linuxcommand.org"),
    ("CLI", "CLI", "Command-line interface: a program used in the terminal, like claude or codex.", "linuxcommand.org"),
    ("Headless mode", "mode headless", "Agent run without an interface, driven by a script.", "code.claude.com/docs · headless"),
    ("Markdown", "Markdown", "Lightly formatted text (# titles, lists); the format of skills.", "commonmark.org/help"),
    ("Ollama", "Ollama", "Software that runs an open model locally, without Internet.", "ollama.com"),
]
PER = 8
# The Kensae wordmark (Baou level) of the footer band, taken from a slide so it stays one copy.
KM = re.search(r'<svg class="km".*?</svg>', (ROOT / "deck/slides/plan.html").read_text()).group(0)
pages = [TERMS[i:i + PER] for i in range(0, len(TERMS), PER)]
e = html.escape
for n, page in enumerate(pages, 1):
    rows = "\n".join(f"<tr><td>{e(en)}</td><td class=\"en\">{e(fr)}</td><td>{e(d)}</td><td>{e(doc)}</td></tr>"
                     for en, fr, d, doc in page)
    slide = f"""<section id="glossary-{n}">
<h2>Glossary · {n} of {len(pages)}</h2>
<table class="gloss">
<tr class="hd"><th style="width:17%">English</th><th style="width:15%">Français</th><th style="width:44%">Definition</th><th style="width:24%">Read more</th></tr>
{rows}
</table>
<div class="foot"><div class="fl">{KM}<p>Glossary</p></div><p class="pn"></p></div>
<aside class="notes">Every notion in the presentation, in the order it comes up, with the French term next to it.</aside>
</section>
"""
    (ROOT / f"deck/slides/glossary-{n}.html").write_text(slide)
print(len(TERMS), "terms,", len(pages), "slides")
