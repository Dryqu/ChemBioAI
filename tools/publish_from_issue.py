#!/usr/bin/env python3
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple, Optional

import urllib.request


REPO_ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = REPO_ROOT / "posts"
POSTS_JSON = POSTS_DIR / "posts.json"
AUTHOR_NAME = "Yi Qu"

# Used to style hyperlinks "in blue"
LINK_BLUE = "#2563eb"


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd)


def git(*args: str) -> None:
    run(["git", *args])


def today_date_string() -> str:
    # Match your posts.json style: "December 3, 2025" (no leading zero)
    now = datetime.now()
    month = now.strftime("%B")
    day = now.day
    year = now.year
    return f"{month} {day}, {year}"


def estimate_reading_time(text: str) -> str:
    # Simple: 200 wpm, minimum 1 min
    words = len(re.findall(r"\w+", text))
    minutes = max(1, (words + 199) // 200)
    return f"{minutes} min read"


def slugify(title: str) -> str:
    s = title.strip().lower()
    s = re.sub(r"[’']", "", s)  # drop apostrophes
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "post"


def unique_slug(base_slug: str) -> str:
    slug = base_slug
    i = 2
    while (POSTS_DIR / f"{slug}.html").exists():
        slug = f"{base_slug}-{i}"
        i += 1
    return slug


def pick_template_html() -> Path:
    candidates = sorted(POSTS_DIR.glob("*.html"))
    if not candidates:
        raise RuntimeError("No template found. Ensure you have at least one posts/*.html file.")
    # Use most recently modified as template
    return max(candidates, key=lambda p: p.stat().st_mtime)


def add_blue_style_to_links(html: str) -> str:
    # Add inline style to <a> tags if not present
    def repl(match: re.Match) -> str:
        tag = match.group(0)
        if re.search(r'\sstyle\s*=\s*"', tag, flags=re.I):
            return tag
        # Insert style attribute right after <a
        return tag[:-1] + f' style="color: {LINK_BLUE};"' + ">"
    return re.sub(r"<a\b[^>]*>", repl, html, flags=re.I)


def parse_issue_body(issue_body: str) -> Dict[str, str]:
    """
    Parse GitHub Issue form output, which typically looks like:

    Post title:
    My Title

    Category:
    Science Labs

    Summary:
    ...

    Body HTML:
    <p>...</p>
    """
    # Normalize
    body = issue_body.replace("\r\n", "\n").strip()

    # Remove any stray ChatGPT citation artifact lines if present
    body = re.sub(r"^::contentReference\[oaicite:\d+\]\{index=\d+\}\s*$", "", body, flags=re.M)

    def extract(label: str) -> Optional[str]:
        # Capture text after "Label:" until next "\n\n<NextLabel>:" or end
        pattern = rf"(?is)^\s*{re.escape(label)}\s*:\s*\n(.*?)(?=\n\s*\w[\w\s]*\s*:\s*\n|$)"
        m = re.search(pattern, body, flags=re.M)
        return m.group(1).strip() if m else None

    title = extract("Post title") or extract("Title")  # fallback
    category = extract("Category")
    summary = extract("Summary") or extract("SUMMARY")
    body_html = extract("Body HTML") or extract("BODY HTML")

    if not title or not category or not summary or not body_html:
        raise RuntimeError(
            "Missing required fields in issue body. "
            "Expected Post title, Category, Summary, and Body HTML."
        )

    return {
        "title": title,
        "category": category,
        "summary": summary,
        "body_html": body_html,
    }


def load_posts_json() -> list[dict]:
    if not POSTS_JSON.exists():
        raise RuntimeError("posts/posts.json not found.")
    data = json.loads(POSTS_JSON.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise RuntimeError("posts/posts.json must be a JSON list.")
    return data


def save_posts_json(items: list[dict]) -> None:
    POSTS_JSON.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def update_template_html(template_html: str, title: str, category: str, date_str: str, body_html: str) -> str:
    html = template_html

    # Update <title>...</title>
    html = re.sub(
        r"(?is)<title>.*?</title>",
        f"<title>{title} - ChemBio AI Insights</title>",
        html,
        count=1,
    )

    # Update category label in header (first uppercase span)
    html = re.sub(
        r'(?is)(<span[^>]*text-transform:\s*uppercase[^>]*>)(.*?)(</span>)',
        rf"\1{category}\3",
        html,
        count=1,
    )

    # Update h1 in article header (first <h1 ...>...</h1>)
    html = re.sub(
        r"(?is)(<h1\b[^>]*>)(.*?)(</h1>)",
        rf"\1{title}\3",
        html,
        count=1,
    )

    # Update date line containing “• By Yi Qu”
    html = re.sub(
        r"(?is)(<p[^>]*>\s*)([A-Za-z]+\s+\d{1,2},\s+\d{4})(\s*•\s*By\s*Yi\s+Qu\s*</p>)",
        rf"\1{date_str}\3",
        html,
        count=1,
    )

    # Replace article body content inside <div class="article-body" ...> ... </div>
    body_html = add_blue_style_to_links(body_html)
    m = re.search(r'(?is)(<div\b[^>]*class="article-body"[^>]*>)(.*?)(</div>)', html)
    if not m:
        raise RuntimeError('Template missing <div class="article-body"> ... </div>')

    start, end = m.span(2)
    html = html[:start] + "\n" + body_html.strip() + "\n" + html[end:]

    return html


def github_api_request(method: str, url: str, token: str, data: Optional[dict] = None) -> None:
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "chembioai-publisher",
    }
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        resp.read()


def comment_and_close_issue(repo: str, issue_number: str, token: str, comment: str) -> None:
    base = f"https://api.github.com/repos/{repo}/issues/{issue_number}"
    github_api_request("POST", f"{base}/comments", token, {"body": comment})
    github_api_request("PATCH", base, token, {"state": "closed"})


def main() -> None:
    issue_body = os.environ.get("ISSUE_BODY", "")
    issue_number = os.environ.get("ISSUE_NUMBER")
    repo = os.environ.get("REPO")
    token = os.environ.get("GITHUB_TOKEN")

    if not issue_body or not issue_number or not repo or not token:
        raise RuntimeError("Missing environment variables. Need ISSUE_BODY, ISSUE_NUMBER, REPO, GITHUB_TOKEN.")

    fields = parse_issue_body(issue_body)
    title = fields["title"]
    category = fields["category"]
    summary = fields["summary"]
    body_html = fields["body_html"]

    date_str = today_date_string()

    # Load posts.json
    items = load_posts_json()
    max_id = 0
    for it in items:
        if isinstance(it, dict) and "id" in it and isinstance(it["id"], int):
            max_id = max(max_id, it["id"])
    new_id = max_id + 1

    base_slug = slugify(title)
    slug = unique_slug(base_slug)

    # Create HTML from template
    template_path = pick_template_html()
    template_html = template_path.read_text(encoding="utf-8")
    new_html = update_template_html(template_html, title=title, category=category, date_str=date_str, body_html=body_html)

    # Write new post file
    out_path = POSTS_DIR / f"{slug}.html"
    out_path.write_text(new_html, encoding="utf-8")

    # Update posts.json entry
    reading_time = estimate_reading_time(summary + "\n" + body_html)
    new_entry = {
        "id": new_id,
        "title": title,
        "slug": slug,
        "date": date_str,
        "category": category,
        "name": AUTHOR_NAME,
        "summary": summary,
        "readingTime": reading_time,
        "contentUrl": f"/posts/{slug}.html",
    }

    # Add newest at top
    items.insert(0, new_entry)
    save_posts_json(items)

    # Commit only two files
    git("config", "user.name", "github-actions[bot]")
    git("config", "user.email", "github-actions[bot]@users.noreply.github.com")

    git("add", str(out_path.as_posix()), str(POSTS_JSON.as_posix()))
    git("commit", "-m", f"Add new post: {title}")

    # Comment + close
    comment = (
        "✅ Published!\n\n"
        f"- **Slug:** `{slug}`\n"
        f"- **HTML:** `posts/{slug}.html`\n"
        f"- **posts.json id:** `{new_id}`\n\n"
        "JSON entry added:\n"
        "```json\n"
        f"{json.dumps(new_entry, indent=2, ensure_ascii=False)}\n"
        "```"
    )
    comment_and_close_issue(repo=repo, issue_number=issue_number, token=token, comment=comment)


if __name__ == "__main__":
    main()

