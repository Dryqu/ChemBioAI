#!/usr/bin/env python3
import re
from pathlib import Path

posts_dir = Path(__file__).parent / 'posts'
count = 0

for html_file in posts_dir.glob('*.html'):
    content = html_file.read_text(encoding='utf-8')
    if '?v=2' in content:
        new_content = content.replace('engage.js?v=2', 'engage.js?v=3')
        html_file.write_text(new_content, encoding='utf-8')
        count += 1

print(f'✅ Updated {count} files to v=3')
