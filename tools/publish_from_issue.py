#!/usr/bin/env python3
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple
import urllib.request


REPO_ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = REPO_ROOT / "posts"
POSTS_JSON = POSTS_DIR / "posts.json"

AUTHOR_NAME = "Yi Qu"
LINK_COLOR = "#2563eb"


def sh(cmd: str) -> str:
    return subprocess.check_output(cmd, shell=True, text=True).strip()


def load_posts() -> list:
    if not POSTS_JSON.exists():
        raise FileNotFoundError(f"Missing {POSTS_JSON}")
    return json.loads(POSTS_JSON.read_text(encoding="utf-8"))


def save_posts(posts: list) -> None:
    POSTS_JSON.write_text(json.dumps(posts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def today_str() -> str:
    return datetime.now().strftime("%B %d, %Y")


def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[’']", "", s)                 # remove apostrophes
    s = re.sub(r"[^a-z0-9]+", "-", s)          # non-alnum -> hyphen
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "post"


def unique_slug(base_slug: str, posts: list) -> str:
    existing = {p.get("slug", "") for p in posts}
    # Also check file collisions
    candidate = base_slug
    i = 2
    while candidate in existing or (POSTS_DIR / f"{candidate}.html").exists():
        candidate = f"{base_slug}-{i}"
        i += 1
    return candidate


def estimate_reading_time(body_html: str) -> str:
    # 200 wpm rough estimate
    text = re.sub(r"<[^>]+>", " ", body_html)
    words = re.findall(r"\b\w+\b", text)
    minutes = max(1, round(len(words) / 200))
    return f"{minutes} min read"


def style_links_blue(body_html: str) -> str:
    # Add style attr to <a> that doesn't already have a style
    def repl(m: re.Match) -> str:
        tag = m.group(0)
        if re.search(r'\sstyle\s*=', tag, flags=re.I):
            return tag
        # insert style before closing >
        return tag[:-1] + f' style="color: {LINK_COLOR};"' + ">"
    return re.sub(r"<a\s+[^>]*?>", repl, body_html, flags=re.I)


def strip_chatgpt_artifacts(text: str) -> str:
    # Remove contentReference/oaicite artifacts if pasted into issue
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        if "contentReference" in line or "oaicite" in line:
            continue
        cleaned.append(line)
    return "\n".join(cleaned).strip()


def parse_issue_body(issue_body: str) -> Tuple[str, str, str, str]:
    """
    Extract:
      - Post title
      - Category
      - Summary
      - Body HTML

    Works with GitHub issue forms output like:
      Post title:
      ...
      Category:
      ...
      Summary:
      ...
      Body HTML:
      ...
    """
    body = strip_chatgpt_artifacts(issue_body)

    def get_block(label: str) -> Optional[str]:
        # match label then capture until next label or end
        pattern = rf"{label}\s*:\s*\n(.*?)(?=\n[A-Za-z][A-Za-z \-/]+:\s*\n|\Z)"
        m = re.search(pattern, body, flags=re.S)
        return m.group(1).strip() if m else None

    title = get_block("Post title") or get_block("Title")  # fallback
    category = get_block("Category")
    summary = get_block("Summary") or get_block("SUMMARY")
    body_html = get_block("Body HTML") or get_block("BODY HTML")

    if not title or not category or not summary or not body_html:
        raise ValueError(
            "Missing required fields. Ensure the issue contains Post title, Category, Summary, and Body HTML."
        )

    return title.strip(), category.strip(), summary.strip(), body_html.strip()


def load_template_html() -> str:
    templates = sorted(POSTS_DIR.glob("*.html"))
    if not templates:
        raise FileNotFoundError("No template found in posts/*.html. Add at least one existing post HTML file.")
    return templates[0].read_text(encoding="utf-8")


def replace_between(html: str, start_pat: str, end_pat: str, replacement: str) -> str:
    m1 = re.search(start_pat, html, flags=re.I | re.S)
    m2 = re.search(end_pat, html, flags=re.I | re.S)
    if not m1 or not m2 or m2.start() <= m1.end():
        raise ValueError("Template structure not found for replacement.")
    return html[: m1.end()] + replacement + html[m2.start() :]


def build_post_html(template: str, category: str, title: str, date: str, body_html: str) -> str:
    out = template

    # Category badge (first span in header area)
    out = re.sub(
        r'(<span[^>]*>\s*)(.*?)(\s*</span>)',
        rf"\1{category}\3",
        out,
        count=1,
        flags=re.I | re.S,
    )

    # Title (first <h1 ...>...</h1>)
    out = re.sub(
        r'(<h1[^>]*>\s*)(.*?)(\s*</h1>)',
        rf"\1{title}\3",
        out,
        count=1,
        flags=re.I | re.S,
    )

    # Date + author line (first <p ...>DATE • By ...</p> after title)
    out = re.sub(
        r'(<p[^>]*>\s*)(.*?)(\s*</p>)',
        rf"\1{date} • By {AUTHOR_NAME}\3",
        out,
        count=1,
        flags=re.I | re.S,
    )

    # Body HTML inside <div class="article-body"...> ... </div>
    body_html = style_links_blue(body_html)
    start_pat = r'(<div\s+class="article-body"[^>]*>)'
    end_pat = r'(</div>\s*<!--\s*ENGAGE MODULE\s*-->)'
    out = replace_between(out, start_pat, end_pat, "\n" + body_html + "\n\n")

    # Also update <title> tag in <head>
    out = re.sub(
        r"(<title>\s*)(.*?)(\s*</title>)",
        rf"\1{title} - ChemBio AI Insights\3",
        out,
        count=1,
        flags=re.I | re.S,
    )

    return out


def comment_and_close_issue(repo: str, issue_number: str, token: str, comment: str) -> None:
    api = f"https://api.github.com/repos/{repo}/issues/{issue_number}/comments"
    req = urllib.request.Request(
        api,
        data=json.dumps({"body": comment}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "chembioai-publisher",
        },
        method="POST",
    )
    urllib.request.urlopen(req).read()

    # Close issue
    api2 = f"https://api.github.com/repos/{repo}/issues/{issue_number}"
    req2 = urllib.request.Request(
        api2,
        data=json.dumps({"state": "closed"}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "chembioai-publisher",
        },
        method="PATCH",
    )
    urllib.request.urlopen(req2).read()


def main() -> None:
    issue_body = os.environ.get("ISSUE_BODY", "")
    issue_number = os.environ.get("ISSUE_NUMBER", "")
    repo = os.environ.get("REPO", "")
    token = os.environ.get("GITHUB_TOKEN", "")

    if not issue_body or not issue_number or not repo or not token:
        raise RuntimeError("Missing required env vars (ISSUE_BODY, ISSUE_NUMBER, REPO, GITHUB_TOKEN).")

    title, category, summary, body_html = parse_issue_body(issue_body)

    posts = load_posts()
    base_slug = slugify(title)
    slug = unique_slug(base_slug, posts)

    new_id = (max((p.get("id", 0) for p in posts), default=0) + 1)

    date = today_str()
    reading_time = estimate_reading_time(body_html)

    template = load_template_html()
    html = build_post_html(template, category, title, date, body_html)

    # Write new post file
    post_path = POSTS_DIR / f"{slug}.html"
    post_path.write_text(html, encoding="utf-8")

    new_entry = {
        "id": new_id,
        "title": title,
        "slug": slug,
        "date": date,
        "category": category,
        "name": AUTHOR_NAME,
        "summary": summary,
        "readingTime": reading_time,
        "contentUrl": f"/posts/{slug}.html",
    }

    # Prepend newest
    posts.insert(0, new_entry)
    save_posts(posts)

    # Commit only the two files
    sh(f'git add "{post_path.as_posix()}" "{POSTS_JSON.as_posix()}"')
    sh(f'git commit -m "Add new post: {title}"')

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
