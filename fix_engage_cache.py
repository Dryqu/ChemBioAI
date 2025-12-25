#!/usr/bin/env python3
"""
Add cache-busting version parameter to engage.js script tags
"""
import os
import re
from pathlib import Path

def fix_engage_cache():
    posts_dir = Path(__file__).parent / 'posts'
    
    # Pattern to find engage.js script tags
    pattern = r'<script src="../assets/js/engage\.js"></script>'
    replacement = '<script src="../assets/js/engage.js?v=2"></script>'
    
    files_updated = 0
    for html_file in posts_dir.glob('*.html'):
        content = html_file.read_text(encoding='utf-8')
        
        if 'engage.js' in content and '?v=' not in content:
            new_content = re.sub(pattern, replacement, content)
            html_file.write_text(new_content, encoding='utf-8')
            files_updated += 1
            print(f"✅ Updated: {html_file.name}")
    
    print(f"\n🎉 Cache-busting added to {files_updated} files")
    print("Deploy these changes and the browser will load the new engage.js")

if __name__ == '__main__':
    fix_engage_cache()
