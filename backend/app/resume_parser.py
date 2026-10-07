import io

from pypdf import PdfReader


class ResumeError(ValueError):
    """The uploaded file could not be used as a resume."""


def extract_text(filename: str, data: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(data))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:  # pypdf raises many different errors for broken files
            raise ResumeError("This PDF could not be read. Try exporting it again.") from exc
    elif name.endswith(".txt"):
        text = data.decode("utf-8", errors="ignore")
    else:
        raise ResumeError("Only PDF and TXT files are supported.")

    text = text.replace("\x00", "").strip()
    if len(text) < 50:
        raise ResumeError(
            "No text found in this file. If it is a scanned image, export a text-based PDF."
        )
    return text
