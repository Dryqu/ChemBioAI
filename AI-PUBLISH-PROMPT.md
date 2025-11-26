# AI Publishing Prompt for ChemBio AI Insights

## Quick Start: Copy & Paste This Prompt

```
I need you to publish this article to the ChemBioAI-Insights repository on GitHub.

**Article Content:**
[PASTE YOUR TXT FILE CONTENT HERE]

**Instructions:**
1. Save the article content as a .txt file in the root directory (use the article title as filename, e.g., "my-article.txt")
2. Run: `node scripts/txt-to-html.js [filename].txt`
3. Run: `npm run refresh-posts`
4. Commit and push all changes to GitHub with message: "Published: [Article Title]"

The article should follow this format:
- Line 1: Category (choose from: Pharma, AgTech, Science Labs, Tools & Tips, Global AI Trends, Learning Resources, Contribute)
- Line 2: Article Title
- Line 3: Date (format: Month DD, YYYY)
- Line 4+: Article content (use ## for section headers, - for bullet points)
```

---

## Example Article Format

When providing your article to the AI, format it like this:

```
Pharma
AI-Powered Clinical Trial Optimization
November 25, 2025

Clinical trials are the most expensive and time-consuming phase of drug development. Artificial intelligence is revolutionizing this process by optimizing patient recruitment, predicting outcomes, and identifying the most promising trial designs.

## Patient Matching

One of the biggest challenges in clinical trials is finding the right patients. AI algorithms can scan electronic health records to identify candidates who meet specific inclusion criteria, dramatically reducing recruitment time.

## Predictive Analytics

Machine learning models can analyze interim trial data to predict final outcomes, allowing researchers to make go/no-go decisions earlier. This saves millions in costs and gets effective treatments to patients faster.

## Key Benefits

- Reduce trial duration by 30-50%
- Lower costs through better patient targeting
- Improve success rates with predictive modeling
- Enable more ethical, adaptive protocols
```

---

## Available Categories

Choose one of these categories for your article:

- **Pharma** - Target discovery & safety
- **AgTech** - Crop protection & modeling
- **Science Labs** - Automation & SOPs
- **Tools & Tips** - Practical AI guides
- **Global AI Trends** - Regulation & future tech
- **Learning Resources** - Tutorials & courses

---

## Formatting Guidelines

### Text Formatting
- **Section Headers**: Use `## Header Text` for major sections
- **Bullet Lists**: Use `- Item text` for bullet points
- **Paragraphs**: Just write normally, each paragraph separated by a blank line

### What Gets Generated
The automation will:
1. Convert your .txt file to a fully-styled HTML page
2. Extract the first paragraph as the article excerpt
3. Generate a URL-friendly slug from the title
4. Update the site's article index automatically
5. Make it appear on the homepage and category pages

---

## Complete Workflow for AI Agents

### Step-by-Step Process

1. **Receive Article Content** from user (in the format above)

2. **Create Text File**
   ```bash
   # Save content to a .txt file with a descriptive name
   # Example: ai-drug-discovery.txt
   ```

3. **Convert to HTML**
   ```bash
   node scripts/txt-to-html.js [your-article-name].txt
   ```

4. **Update Article Index**
   ```bash
   npm run refresh-posts
   ```

5. **Commit to GitHub**
   ```bash
   git add .
   git commit -m "Published: [Article Title]"
   git push origin main
   ```

6. **Confirm Success**
   - Verify the HTML file was created in `posts/` directory
   - Verify `posts/posts.json` was updated
   - Confirm all files are committed and pushed

---

## Troubleshooting

### Common Issues

**Error: "File not found"**
- Make sure the .txt file is in the root directory of the repository
- Check the filename matches what you're passing to the script

**Error: "Text file must have at least 4 lines"**
- Ensure your article has: Category, Title, Date, and at least one paragraph

**Article doesn't appear on site**
- Make sure you ran `npm run refresh-posts` after creating the HTML
- Check that `posts/posts.json` was updated
- Verify the changes were committed and pushed to GitHub

**Formatting looks wrong**
- Check that section headers use `##` (two hash marks)
- Ensure bullet points use `-` (dash with space)
- Make sure there are blank lines between paragraphs

---

## Quick Reference: File Locations

```
ChemBioAI-Insights/
├── posts/                          # All article HTML files go here
│   ├── your-article-slug.html     # Generated HTML
│   └── posts.json                 # Auto-updated index
├── scripts/
│   ├── txt-to-html.js             # Converts .txt to HTML
│   └── generate_posts.js          # Updates posts.json
├── example-article.txt            # Reference example
└── your-new-article.txt           # Your article (temporary)
```

---

## Example: Complete AI Interaction

**User says:**
"Publish this article: [pastes article content]"

**AI should:**
1. Create `new-article.txt` with the content
2. Run `node scripts/txt-to-html.js new-article.txt`
3. Run `npm run refresh-posts`
4. Commit with message: "Published: [Article Title]"
5. Push to GitHub
6. Respond: "✓ Article published successfully! It will appear on the site at: https://[your-domain]/posts/[slug].html"

---

## Notes for AI Agents

- **Always** run both scripts in order: `txt-to-html.js` first, then `refresh-posts`
- **Always** commit ALL changes (the .txt file, HTML file, and posts.json)
- **Always** use descriptive commit messages with the article title
- The .txt file can be deleted after publishing if desired, but keeping it is fine too
- The first paragraph of the article becomes the excerpt automatically
- Articles appear newest-first on the homepage (sorted by date)
