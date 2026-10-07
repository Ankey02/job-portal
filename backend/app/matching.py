"""Resume-to-job matching with plain Python (no API key needed).

score = 70% skill coverage + 30% text similarity.
It is a simple, explainable heuristic, not a trained model.
"""
import math
import re
from collections import Counter

# Different ways people write the same skill
SYNONYM_GROUPS = [
    {"javascript", "js"},
    {"typescript", "ts"},
    {"postgresql", "postgres"},
    {"react", "reactjs", "react.js"},
    {"node.js", "nodejs", "node"},
    {"next.js", "nextjs"},
    {"kubernetes", "k8s"},
    {"machine learning", "ml"},
    {"rest api", "rest apis", "restful", "rest"},
    {"ci/cd", "cicd", "github actions"},
    {"aws", "amazon web services"},
    {"mongodb", "mongo"},
    {"scikit-learn", "sklearn"},
    {"tailwind", "tailwind css", "tailwindcss"},
]

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "in", "is",
    "it", "of", "on", "or", "our", "that", "the", "this", "to", "we", "will", "with", "you",
    "your", "i", "my", "was", "were", "they", "their", "who", "what", "can", "should", "must",
}


def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-z][a-z0-9+#.]*", text.lower())
    words = [w.rstrip(".") for w in words]
    return [w for w in words if len(w) > 1 and w not in STOPWORDS]


def skill_variants(skill: str) -> set[str]:
    skill = skill.strip().lower()
    for group in SYNONYM_GROUPS:
        if skill in group:
            return group
    return {skill}


def has_skill(text_lower: str, skill: str) -> bool:
    """True if the skill (or a synonym) appears as a whole word, so 'java' does not match 'javascript'."""
    for variant in skill_variants(skill):
        pattern = r"(?<![a-z0-9])" + re.escape(variant) + r"(?![a-z0-9+#])"
        if re.search(pattern, text_lower):
            return True
    return False


def text_similarity(a: str, b: str) -> float:
    """Cosine similarity of word counts: 0 = nothing in common, 1 = identical wording."""
    va, vb = Counter(tokenize(a)), Counter(tokenize(b))
    if not va or not vb:
        return 0.0
    dot = sum(count * vb[word] for word, count in va.items())
    norm = math.sqrt(sum(c * c for c in va.values())) * math.sqrt(sum(c * c for c in vb.values()))
    return dot / norm


def build_suggestions(resume_text: str, missing: list[str], score: int) -> list[str]:
    tips: list[str] = []
    if missing:
        tips.append(
            "The job asks for skills your resume does not mention: "
            + ", ".join(missing[:6])
            + ". If you have used them, add a project or bullet point that shows it."
        )
    if len(resume_text.split()) < 150:
        tips.append("Your resume is quite short. Add more detail about projects and what you built.")
    if not re.search(r"\d", resume_text):
        tips.append("Add numbers to show impact, for example users served, speed gains or team size.")
    if score >= 75 and not missing:
        tips.append("Strong match. Put the skills this job lists near the top of your resume.")
    elif score < 40:
        tips.append("This role is a weak match right now. Look for jobs closer to your current skills.")
    return tips


def compute_match(resume_text: str, title: str, description: str, skills: list[str]) -> dict:
    resume_lower = resume_text.lower()
    skills = [s for s in skills if s.strip()]
    matched = [s for s in skills if has_skill(resume_lower, s)]
    missing = [s for s in skills if s not in matched]

    # Raw cosine between a resume and a job post is usually 0.1-0.4, so 0.5 counts as full marks
    job_text = f"{title} {description} {' '.join(skills)}"
    similarity = min(1.0, text_similarity(resume_text, job_text) / 0.5)

    if skills:
        coverage = len(matched) / len(skills)
        score = round(100 * (0.7 * coverage + 0.3 * similarity))
    else:
        score = round(100 * similarity)

    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "suggestions": build_suggestions(resume_text, missing, score),
    }
