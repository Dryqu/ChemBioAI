# 🚀 How to Publish Articles Using ChatGPT or Manus AI

This guide shows you how to easily publish articles to your ChemBioAI-Insights website using AI assistants connected to GitHub.

## ✨ Quick Start

### Option 1: Ultra-Simple Prompt (Recommended)

Open `SIMPLE-PROMPT.txt` and copy the template. Replace `[PASTE YOUR ARTICLE CONTENT HERE]` with your article, then send to ChatGPT or Manus AI.

### Option 2: Detailed Prompt

Open `QUICK-PUBLISH-PROMPT.txt` for a more detailed prompt with examples and formatting guidelines.

### Option 3: Full Documentation

See `AI-PUBLISH-PROMPT.md` for complete documentation, troubleshooting, and advanced options.

---

## 📝 Article Format

Your article text file must follow this structure:

```
Category Name
Article Title
Month DD, YYYY

First paragraph becomes the excerpt automatically.

## Section Header

Section content here.

## Another Section

More content.

- Bullet point 1
- Bullet point 2
```

### Available Categories

Choose one:
- **Pharma** - Target discovery & safety
- **AgTech** - Crop protection & modeling
- **Science Labs** - Automation & SOPs
- **Tools & Tips** - Practical AI guides
- **Global AI Trends** - Regulation & future tech
- **Learning Resources** - Tutorials & courses
- **Contribute** - Share your research

---

## 🤖 What the AI Will Do

When you give ChatGPT or Manus AI the prompt:

1. ✅ Save your article as a `.txt` file
2. ✅ Convert it to a beautifully formatted HTML page
3. ✅ Update the website's article index
4. ✅ Commit and push to GitHub
5. ✅ Your article goes live!

---

## 📋 Example Workflow

**You:** "Publish this article:"

```
Pharma
AI in Drug Discovery
December 1, 2025

Artificial intelligence is revolutionizing pharmaceutical research...

## How It Works

AI algorithms analyze vast databases...

## Benefits

- Faster discovery
- Lower costs
- Better predictions
```

**AI:** 
- Creates `ai-in-drug-discovery.txt`
- Runs `node scripts/txt-to-html.js ai-in-drug-discovery.txt`
- Runs `npm run refresh-posts`
- Commits: "Published: AI in Drug Discovery"
- Pushes to GitHub
- ✅ Done!

---

## 🎯 Using the Workflow Command

If you're using an AI agent that supports workflows (like this one), you can simply say:

```
/publish-article
```

Then provide your article content when prompted.

---

## 🧪 Test Article

A test article has been created and published successfully:
- **File:** `test-article.txt`
- **HTML:** `posts/getting-started-with-ai-in-your-lab.html`
- **Category:** Tools & Tips
- **Status:** ✅ Published

You can view it at: http://localhost:8000/posts/getting-started-with-ai-in-your-lab.html

---

## 📁 Files Created for You

| File | Purpose |
|------|---------|
| `SIMPLE-PROMPT.txt` | Ultra-simple copy-paste prompt |
| `QUICK-PUBLISH-PROMPT.txt` | Quick reference with example |
| `AI-PUBLISH-PROMPT.md` | Complete documentation |
| `.agent/workflows/publish-article.md` | Workflow for AI agents |
| `test-article.txt` | Example article (can be deleted) |

---

## 🔧 Manual Publishing (If Needed)

If you want to publish manually without AI:

```bash
# 1. Create your article.txt file
# 2. Convert to HTML
node scripts/txt-to-html.js your-article.txt

# 3. Update index
npm run refresh-posts

# 4. Commit and push
git add .
git commit -m "Published: Your Article Title"
git push origin main
```

---

## 💡 Tips

- **Keep it simple:** The simpler your prompt, the better
- **Use examples:** Show the AI the format you want
- **Verify:** Always ask the AI to confirm the article was published
- **Test locally:** Run `python -m http.server 8000` to preview before pushing

---

## ❓ Troubleshooting

**AI says "command not found"?**
- Make sure the AI has access to your GitHub repository
- Verify Node.js is installed in the repository environment

**Article not appearing?**
- Check that both scripts ran successfully
- Verify `posts/posts.json` was updated
- Refresh your browser (Ctrl+F5)

**Formatting looks wrong?**
- Check your article uses `##` for headers
- Ensure bullet points use `-` with a space
- Verify blank lines between paragraphs

---

## 🎉 You're All Set!

Just copy one of the prompt files, paste your article content, and let ChatGPT or Manus AI handle the rest!

**Need help?** Check `PUBLISHING.md` for more details about the publishing system.
