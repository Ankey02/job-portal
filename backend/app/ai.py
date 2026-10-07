"""Optional AI feedback using the Google Gemini API.

The app works without it. Set GEMINI_API_KEY in .env to turn it on.
"""
import httpx

from .config import settings

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class AIError(Exception):
    pass


def ai_enabled() -> bool:
    return bool(settings.gemini_api_key)


def build_prompt(resume_text: str, title: str, description: str, match: dict) -> str:
    return f"""You are a career coach reviewing a resume for one specific job.

JOB TITLE: {title}
JOB DESCRIPTION:
{description[:3000]}

SKILLS FOUND IN RESUME: {", ".join(match["matched_skills"]) or "none"}
SKILLS MISSING FROM RESUME: {", ".join(match["missing_skills"]) or "none"}

RESUME:
{resume_text[:6000]}

Write feedback for the candidate in plain text, no markdown, under 180 words, in three short parts:
Strengths: two points that fit this job.
Gaps: two points that are missing or weak for this job.
Changes to make: three specific edits to the resume for this job.
Only use facts from the resume. Do not invent experience."""


def get_ai_feedback(resume_text: str, title: str, description: str, match: dict) -> str:
    if not ai_enabled():
        raise AIError("AI feedback is not configured")
    try:
        res = httpx.post(
            GEMINI_URL.format(model=settings.gemini_model),
            headers={"x-goog-api-key": settings.gemini_api_key},
            json={
                "contents": [
                    {"parts": [{"text": build_prompt(resume_text, title, description, match)}]}
                ]
            },
            timeout=45,
        )
        res.raise_for_status()
        parts = res.json()["candidates"][0]["content"]["parts"]
        text = "".join(part.get("text", "") for part in parts).strip()
    except httpx.HTTPStatusError as exc:
        raise AIError(f"The AI service returned an error ({exc.response.status_code})") from exc
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        raise AIError("The AI service did not return a usable answer") from exc
    if not text:
        raise AIError("The AI service returned an empty answer")
    return text
