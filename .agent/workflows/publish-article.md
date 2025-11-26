---
description: Publish a new article from a text file
---

# Publish Article Workflow

This workflow guides you through publishing a new article to the ChemBioAI-Insights website.

## Prerequisites

- Article content in .txt format with:
  - Line 1: Category (Pharma, AgTech, Science Labs, Tools & Tips, Global AI Trends, or Learning Resources)
  - Line 2: Article Title
  - Line 3: Date (format: Month DD, YYYY)
  - Line 4+: Article content (use ## for headers, - for bullets)

## Steps

1. **Save your article as a .txt file** in the repository root
   - Use a descriptive filename (e.g., `ai-drug-discovery.txt`)
   - Ensure it follows the format above

// turbo
2. **Convert the text file to HTML**
   ```
   node scripts/txt-to-html.js [your-filename].txt
   ```
   - This creates an HTML file in the `posts/` directory
   - The script automatically generates a URL-friendly slug

// turbo
3. **Update the article index**
   ```
   npm run refresh-posts
   ```
   - This updates `posts/posts.json` with your new article
   - Articles are automatically sorted by date (newest first)

4. **Commit and push to GitHub**
   ```
   git add .
   git commit -m "Published: [Your Article Title]"
   git push origin main
   ```

## Verification

After publishing, verify:
- [ ] HTML file created in `posts/` directory
- [ ] `posts/posts.json` updated with new article entry
- [ ] Article appears on localhost:8000 (if running locally)
- [ ] Changes committed and pushed to GitHub

## Example

For an article about AI drug discovery:

```bash
# 1. Create ai-drug-discovery.txt with your content
# 2. Convert to HTML
node scripts/txt-to-html.js ai-drug-discovery.txt

# 3. Update index
npm run refresh-posts

# 4. Commit and push
git add .
git commit -m "Published: AI-Powered Drug Discovery"
git push origin main
```

## Troubleshooting

**Script errors?**
- Check that your .txt file has at least 4 lines
- Verify the filename is correct
- Ensure you're in the repository root directory

**Article not appearing?**
- Make sure you ran `npm run refresh-posts`
- Check `posts/posts.json` for your article entry
- Refresh your browser (clear cache if needed)

**Git push fails?**
- Ensure you have write access to the repository
- Check that you're on the correct branch
- Verify your GitHub authentication is set up
