#!/usr/bin/env python3
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple
import urllib.request

REPO_ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = REPO_ROOT / "posts"
POSTS_JSON = POSTS_DIR / "posts.json"

AUTHOR_NAME = "Yi Qu"
LINK_COLOR = "#2563eb"


def sh(cmd: str) -> str:
    return subprocess.check_output(cmd, shell=True, text=True).strip()


def today_str() -> str:
    return datetime.now().strftime("%B %d, %Y")


def load_posts() -> list:
    return json.loads(POSTS_JSON.read_text(encoding="utf-8"))


def save_posts(posts: list) -> None:
    POSTS_JSON.write_text(
        json.dumps(posts, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[’']", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "post"


def unique_slug(base: str, posts: list) -> str:
    existing = {p["slug"] for p in posts}
    slug = base
    i = 2
    while slug in existing or (POSTS_DIR / f"{slug}.html").exists():
        slug = f"{base}-{i}"
        i += 1
    return slug


def estimate_reading_time(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    words = re.findall(r"\w+", text)
    return f"{max(1, round(len(words) / 200))} min read"


def style_links_blue(html: str) -> str:
    return re.sub(
        r'<a\s+([^>]*?)>',
        lambda m: (
            f'<a {m.group(1)}>'
            if "style=" in m.group(1)
            else f'<a {m.group(1)} style="color: {LINK_COLOR};">'
        ),
        html,
        flags=re.I,
    )


def strip_chatgpt_artifacts(text: str) -> str:
    return "\n".join(
        line for line in text.splitlines()
        if "contentReference" not in line and "oaicite" not in line
    ).strip()


# 🔥 FIXED ISSUE FORM PARSER (THIS IS THE KEY)
def parse_issue_body(issue_body: str) -> Tuple[str, str, str, str]:
    body = strip_chatgpt_artifacts(issue_body).replace("\r\n", "\n")

    labels = ["Post title", "Category", "Summary", "Body HTML"]

    def extract(label: str) -> Optional[str]:
        next_labels = "|".join(re.escape(l) for l in labels)
        pattern = rf"""
        (?:
            ^\s*###\s*{re.escape(label)}\s*$ |
            ^\s*{re.escape(label)}\s*:\s*$ |
            ^\s*{re.escape(label)}\s*$
        )
        \n
        (.*?)
        (?=
            \n\s*(?:###\s*)?(?:{next_labels})\s*(?::|\n) |
            \Z
        )
        """
        m = re.search(pattern, body, flags=re.I | re.S | re.M | re.X)
        return m.group(1).strip() if m else None

    title = extract("Post title")
    category = extract("Category")
    summary = extract("Summary")
    body_html = extract("Body HTML")

    if not all([title, category, summary, body_html]):
        raise ValueError(
            "Missing required fields. Ensure the issue contains Post title, Category, Summary, and Body HTML."
        )

    return title, category, summary, body_html


def load_template() -> str:
    templates = sorted(POSTS_DIR.glob("*.html"))
    if not templates:
        raise RuntimeError("No template found in posts/*.html")
    return templates[0].read_text(encoding="utf-8")


def build_post(template: str, category: str, title: str, body_html: str) -> str:
    html = template
    html = re.sub(r"<span[^>]*>.*?</span>", f"<span>{category}</span>", html, count=1, flags=re.S)
    html = re.sub(r"<h1[^>]*>.*?</h1>", f"<h1>{title}</h1>", html, count=1, flags=re.S)
    html = re.sub(
        r"<p[^>]*>.*?By .*?</p>",
        f"<p>{today_str()} • By {AUTHOR_NAME}</p>",
        html,
        count=1,
        flags=re.S,
    )

    body_html = style_links_blue(body_html)
    html = re.sub(
        r'(<div class="article-body"[^>]*>).*?(</div>\s*<!--\s*ENGAGE MODULE\s*-->)',
        rf"\1\n{body_html}\n\2",
        html,
        flags=re.S,
    )

    html = re.sub(
        r"<title>.*?</title>",
        f"<title>{title} - ChemBio AI Insights</title>",
        html,
        count=1,
        flags=re.S,
    )

    return html


def comment_and_close(repo: str, issue: str, token: str, text: str):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
    }

    urllib.request.urlopen(
        urllib.request.Request(
            f"https://api.github.com/repos/{repo}/issues/{issue}/comments",
            data=json.dumps({"body": text}).encode(),
            headers=headers,
            method="POST",
        )
    )

    urllib.request.urlopen(
        urllib.request.Request(
            f"https://api.github.com/repos/{repo}/issues/{issue}",
            data=json.dumps({"state": "closed"}).encode(),
            headers=headers,
            method="PATCH",
        )
    )


def main():
    issue_body = os.environ["ISSUE_BODY"]
    issue_number = os.environ["ISSUE_NUMBER"]
    repo = os.environ["REPO"]
    token = os.environ["GITHUB_TOKEN"]

    title, category, summary, body_html = parse_issue_body(issue_body)

    posts = load_posts()
    slug = unique_slug(slugify(title), posts)

    html = build_post(load_template(), category, title, body_html)
    post_path = POSTS_DIR / f"{slug}.html"
    post_path.write_text(html, encoding="utf-8")

    entry = {
        "id": max((p["id"] for p in posts), default=0) + 1,
        "title": title,
        "slug": slug,
        "date": today_str(),
        "category": category,
        "name": AUTHOR_NAME,
        "summary": summary,
        "readingTime": estimate_reading_time(body_html),
        "contentUrl": f"/posts/{slug}.html",
    }

    posts.insert(0, entry)
    save_posts(posts)

    sh(f'git add "{post_path}" "{POSTS_JSON}"')
    sh(f'git commit -m "Add new post: {title}"')

    comment_and_close(
        repo,
        issue_number,
        token,
        f"✅ Published!\n\nSlug: `{slug}`\n\n```json\n{json.dumps(entry, indent=2)}\n```",
    )


if __name__ == "__main__":
    main()
