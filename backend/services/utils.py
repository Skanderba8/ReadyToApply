import os

_FR_WORDS = ["le ", "la ", "les ", "de ", "du ", "des ", "et ", "en ", "pour ",
             "avec ", "dans ", "sur ", "une ", "est ", "sont ", "par ", "au "]


def load_prompt(filename: str) -> str:
    """Load a prompt file from the prompts directory."""
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", filename)
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


def detect_lang(text: str) -> str:
    """Return 'fr' if text looks French, else 'en'."""
    lower = text.lower()
    hits = sum(1 for w in _FR_WORDS if w in lower)
    return "fr" if hits >= 4 else "en"
