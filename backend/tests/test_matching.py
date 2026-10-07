from app.matching import compute_match, has_skill, text_similarity

RESUME = """
Ankit Sharma - Python Developer
Built REST APIs with FastAPI and Postgres for 3 client projects.
Frontend work in ReactJS and TypeScript. Deployed with Docker.
"""


def test_whole_word_matching():
    assert has_skill("i know javascript well", "javascript")
    assert not has_skill("i know javascript well", "java")
    assert has_skill("c++ and python", "c++")
    assert not has_skill("c++ and python", "c")


def test_synonyms():
    text = RESUME.lower()
    assert has_skill(text, "postgresql")  # resume says Postgres
    assert has_skill(text, "react")  # resume says ReactJS
    assert not has_skill(text, "kubernetes")


def test_text_similarity_bounds():
    assert text_similarity("", "python developer") == 0.0
    assert round(text_similarity("python developer", "python developer"), 5) == 1.0
    assert text_similarity("python fastapi", "cooking recipes") == 0.0


def test_compute_match_full_and_partial():
    good = compute_match(RESUME, "Python Developer", "Build REST APIs with FastAPI.", ["python", "fastapi", "postgresql"])
    assert good["missing_skills"] == []
    assert good["score"] >= 70

    partial = compute_match(RESUME, "DevOps Engineer", "Manage clusters.", ["kubernetes", "terraform", "docker"])
    assert partial["matched_skills"] == ["docker"]
    assert partial["missing_skills"] == ["kubernetes", "terraform"]
    assert partial["score"] < good["score"]
    assert "kubernetes" in partial["suggestions"][0]


def test_job_without_skills_uses_text_only():
    result = compute_match(RESUME, "Python Developer", "FastAPI REST APIs with Postgres and Docker", [])
    assert 0 < result["score"] <= 100
    assert result["matched_skills"] == [] and result["missing_skills"] == []
