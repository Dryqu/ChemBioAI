#!/usr/bin/env python3
"""
ChemBioAI Issue → Post Publisher

Reads GitHub Issue Form fields (Post title / Category / Summary / Body HTML),
creates a new posts/<slug>.html using an existing template in posts/*.html,
updates posts/posts.json, commits, and comments + closes the issue.

Designed to be robust against:
- Issue forms that output "### Post title" style headings
- Issue forms that output "Post title:" label blocks
- Accidental ChatGPT artifacts like ::contentReference[oaicite:...]
"""

import json
import os
import re
import subprocess
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple


REPO_ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = REPO_ROOT / "posts"
POSTS_JSON = POSTS_DIR / "posts.json"

AUTHOR_NAME = "Yi Qu"
LINK_COLOR = "#2563eb"


# ----------------------------
# Shell helpers
# ----------------------------
def sh(cmd: str) -> str:
    p = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}\n\nSTDOUT:\n{p.stdout}\n\nSTDERR:\n{p.stderr}")
    return p.stdout.strip()


# ----------------------------
# Data helpers
# ----------------------------
def load_posts() -> list:
    if not POSTS_JSON.exists():
        raise FileNotFoundError(f"Missing {POSTS_JSON}")
    return json.loads(POSTS_JSON.read_text(encoding="utf-8"))


def save_posts(posts: list) -> None:
    POSTS_JSON.write_text(json.dumps(posts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def today_str() -> str:
    # Example: "December 28, 2025"
    return datetime.now().strftime("%B %d, %Y").replace(" 0", " ")


def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"['']", "", s)          # remove apostrophes
    s = re.sub(r"[^a-z0-9]+", "-", s)   # non-alnum -> hyphen
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "post"


def unique_slug(base_slug: str, posts: list) -> str:
    existing = {p.get("slug", "") for p in posts}
    candidate = base_slug
    i = 2
    while candidate in existing or (POSTS_DIR / f"{candidate}.html").exists():
        candidate = f"{base_slug}-{i}"
        i += 1
    return candidate


def estimate_reading_time(body_html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", body_html)
    words = re.findall(r"\b\w+\b", text)
    minutes = max(1, round(len(words) / 200))
    return f"{minutes} min read"


def style_links_blue(body_html: str) -> str:
    # Add style to <a> tags that don't already have style=
    def repl(m: re.Match) -> str:
        tag = m.group(0)
        if re.search(r'\sstyle\s*=', tag, flags=re.I):
            return tag
        return tag[:-1] + f' style="color: {LINK_COLOR};"' + ">"
    return re.sub(r"<a\s+[^>]*?>", repl, body_html, flags=re.I)


def strip_chatgpt_artifacts(text: str) -> str:
    """
    Removes lines that contain ChatGPT internal artifacts like:
    ::contentReference[oaicite:0]{index=0}
    """
    cleaned_lines = []
    for line in (text or "").splitlines():
        if "contentReference" in line or "oaicite" in line:
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines).strip()


# ----------------------------
# Issue parsing (robust)
# ----------------------------
def parse_issue_body(issue_body: str, fallback_title: str = "") -> Tuple[str, str, str, str]:
    """
    Supports BOTH styles:

    1) Issue forms "### Field" style:
       ### Post title
       My Title
       ### Category
       Science Labs
       ### Summary
       ...
       ### Body HTML
       <p>...</p>

    2) Label blocks:
       Post title:
       My Title
       Category:
       Science Labs
       Summary:
       ...
       Body HTML:
       <p>...</p>

    Returns: (title, category, summary, body_html)
    """
    body = strip_chatgpt_artifacts(issue_body).replace("\r\n", "\n").replace("\r", "\n").strip()

    # Identify section headers
    # We'll treat these as "markers" that start a section and continue until next marker.
    markers = {
        "title": [
            r"^\s*###\s*Post\s+title\s*$",
            r"^\s*Post\s+title\s*:\s*$",
            r"^\s*###\s*Title\s*$",
            r"^\s*Title\s*:\s*$",
        ],
        "category": [
            r"^\s*###\s*Category\s*$",
            r"^\s*Category\s*:\s*$",
        ],
        "summary": [
            r"^\s*###\s*Summary\s*$",
            r"^\s*Summary\s*:\s*$",
            r"^\s*SUMMARY\s*:\s*$",
        ],
        "body_html": [
            r"^\s*###\s*Body\s*HTML\s*$",
            r"^\s*Body\s*HTML\s*:\s*$",
            r"^\s*BODY\s*HTML\s*:\s*$",
        ],
    }

    def is_marker(line: str) -> Optional[str]:
        for key, pats in markers.items():
            for pat in pats:
                if re.match(pat, line, flags=re.I):
                    return key
        return None

    sections: Dict[str, str] = {"title": "", "category": "", "summary": "", "body_html": ""}
    current: Optional[str] = None

    for raw_line in body.split("\n"):
        line = raw_line.rstrip("\n")

        key = is_marker(line)
        if key:
            current = key
            continue

        # Accumulate section content
        if current:
            sections[current] += (line + "\n")

    # Trim
    for k in sections:
        sections[k] = sections[k].strip()

    # Fallback: if title not in body, use issue title (strip [Publish])
    title = sections["title"]
    if not title and fallback_title:
        t = re.sub(r"^\s*\[publish\]\s*", "", fallback_title, flags=re.I).strip()
        title = t

    category = sections["category"]
    summary = sections["summary"]
    body_html = sections["body_html"]

    # Sometimes GitHub UI renders fields like:
    # "Post title:" then same-line value (rare). Handle that too:
    if not title:
        m = re.search(r"Post\s+title\s*:\s*(.+)", body, flags=re.I)
        if m:
            title = m.group(1).strip()
    if not category:
        m = re.search(r"Category\s*:\s*(.+)", body, flags=re.I)
        if m:
            category = m.group(1).strip()

    # Validate
    missing = [k for k, v in [("Post title", title), ("Category", category), ("Summary", summary), ("Body HTML", body_html)] if not v]
    if missing:
        raise ValueError(
            "Missing required fields: " + ", ".join(missing) + ".\n\n"
            "Fix: open the Issue and make sure it contains these sections:\n"
            "Post title, Category, Summary, Body HTML.\n"
            "If you used an Issue Form, the script expects the '### Field' sections to exist."
        )

    return title.strip(), category.strip(), summary.strip(), body_html.strip()


# ----------------------------
# Template + HTML generation
# ----------------------------
def load_template_html() -> str:
    templates = sorted(POSTS_DIR.glob("*.html"))
    if not templates:
        raise FileNotFoundError("No template found in posts/*.html. Add at least one existing post HTML file.")

    # Prefer a template that contains the ENGAGE MODULE marker
    for p in templates:
        txt = p.read_text(encoding="utf-8")
        if re.search(r"<!--\s*ENGAGE MODULE\s*-->", txt, flags=re.I):
            return txt

    # Otherwise just use the first
    return templates[0].read_text(encoding="utf-8")


def replace_between(html: str, start_pat: str, end_pat: str, replacement: str) -> str:
    m1 = re.search(start_pat, html, flags=re.I | re.S)
    m2 = re.search(end_pat, html, flags=re.I | re.S)
    if not m1 or not m2 or m2.start() <= m1.end():
        raise ValueError("Template structure not found for replacement (article-body / ENGAGE MODULE markers).")
    return html[: m1.end()] + replacement + html[m2.start() :]


def build_post_html(template: str, category: str, title: str, date: str, body_html: str) -> str:
    out = template

    # Replace the main article title (first <h1> in article body)
    # Skip the site header by being more specific:
    # We look for <h1> ONLY after the </header> tag.
    
    # 1. Split HTML into header part and body part
    header_end_match = re.search(r'</header>', out, flags=re.I)
    if header_end_match:
        split_idx = header_end_match.end()
        html_pre = out[:split_idx]
        html_post = out[split_idx:]
        
        # 2. Replace <h1> in the body part only
        html_post = re.sub(
            r'(<h1[^>]*>\s*)(.*?)(\s*</h1>)',
            rf"\1{title}\3",
            html_post,
            count=1,
            flags=re.I | re.S,
        )
        
        # 3. Replace Category (first <span> in the body part)
        html_post = re.sub(
            r'(<span[^>]*>\s*)(.*?)(\s*</span>)',
            rf"\1{category}\3",
            html_post,
            count=1,
            flags=re.I | re.S,
        )
        out = html_pre + html_post
    else:
        # Fallback if no </header> found (shouldn't happen with our templates)
        out = re.sub(
            r'(<h1[^>]*>\s*)(.*?)(\s*</h1>)',
            rf"\1{title}\3",
            out,
            count=1,
            flags=re.I | re.S,
        )
        # Fallback category replacement
        out = re.sub(
            r'(<span[^>]*>\s*)(.*?)(\s*</span>)',
            rf"\1{category}\3",
            out,
            count=1,
            flags=re.I | re.S,
        )

    # Date + author line (first <p ...> ... </p> after title in header area)
    # We replace the FIRST <p> inside the article header block (good enough for your template style).
    out = re.sub(
        r'(<p[^>]*>\s*)(.*?)(\s*</p>)',
        rf"\1{date} • By {AUTHOR_NAME}\3",
        out,
        count=1,
        flags=re.I | re.S,
    )

    # Body HTML inside <div class="article-body"...> ... <!-- ENGAGE MODULE -->
    body_html = style_links_blue(body_html)
    start_pat = r'(<div\s+class="article-body"[^>]*>)'
    end_pat = r'(</div>\s*<!--\s*ENGAGE MODULE\s*-->)'
    out = replace_between(out, start_pat, end_pat, "\n" + body_html + "\n\n")

    # Update <title> tag
    out = re.sub(
        r"(<title>\s*)(.*?)(\s*</title>)",
        rf"\1{title} - ChemBio AI Insights\3",
        out,
        count=1,
        flags=re.I | re.S,
    )

    return out


# ----------------------------
# GitHub API: comment + close
# ----------------------------
def github_api_request(url: str, token: str, method: str, payload: dict) -> None:
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "chembioai-publisher",
            },
            method=method,
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        raise RuntimeError(f"GitHub API HTTP error {e.code}: {error_body}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"GitHub API connection error: {e.reason}")


def comment_and_close_issue(repo: str, issue_number: str, token: str, comment: str) -> None:
    github_api_request(
        url=f"https://api.github.com/repos/{repo}/issues/{issue_number}/comments",
        token=token,
        method="POST",
        payload={"body": comment},
    )
    github_api_request(
        url=f"https://api.github.com/repos/{repo}/issues/{issue_number}",
        token=token,
        method="PATCH",
        payload={"state": "closed"},
    )


# ----------------------------
# Main
# ----------------------------
def main() -> None:
    issue_title = os.environ.get("ISSUE_TITLE", "")
    issue_body = os.environ.get("ISSUE_BODY", "")
    issue_number = os.environ.get("ISSUE_NUMBER", "")
    repo = os.environ.get("REPO", "")
    token = os.environ.get("GITHUB_TOKEN", "")

    if not issue_body or not issue_number or not repo or not token:
        raise RuntimeError("Missing required env vars (ISSUE_BODY, ISSUE_NUMBER, REPO, GITHUB_TOKEN).")

    title, category, summary, body_html = parse_issue_body(issue_body, fallback_title=issue_title)

    posts = load_posts()
    base_slug = slugify(title)
    slug = unique_slug(base_slug, posts)

    new_id = (max((p.get("id", 0) for p in posts), default=0) + 1)

    date = today_str()
    reading_time = estimate_reading_time(body_html)

    template = load_template_html()
    html = build_post_html(template, category, title, date, body_html)

    # Write new post file
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
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

    # Check if there are changes to commit
    try:
        diff_check = subprocess.run(
            "git diff --cached --quiet",
            shell=True,
            capture_output=True
        )
        if diff_check.returncode == 0:
            # No changes staged
            print("No changes to commit. Post may already exist.")
            comment = (
                "⚠️ **No changes detected**\n\n"
                f"A post with slug `{slug}` may already exist, or the content is identical to an existing post.\n"
                "Please check the repository and try again with different content."
            )
            comment_and_close_issue(repo=repo, issue_number=issue_number, token=token, comment=comment)
            return
    except Exception as e:
        print(f"Warning: Could not check git diff status: {e}")
        # Continue to attempt commit anyway

    # Commit
    safe_title = title.replace('"', '\\"')
    try:
        sh(f'git commit -m "Add new post: {safe_title}"')
    except RuntimeError as e:
        # Handle commit failures gracefully
        error_msg = str(e)
        comment = (
            "❌ **Commit failed**\n\n"
            f"Error while committing changes:\n```\n{error_msg}\n```\n\n"
            "Please check the repository status and try again."
        )
        comment_and_close_issue(repo=repo, issue_number=issue_number, token=token, comment=comment)
        raise

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
