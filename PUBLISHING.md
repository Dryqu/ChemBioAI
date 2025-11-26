# ChemBio AI Insights - Content Publishing Guide

## Publishing New Articles

This site has been set up to make publishing new articles as simple as possible, especially for AI agents like Manus AI.

### Method 1: From Text File (Easiest!)

If you have your article in a simple text file:

1. **Create a text file** with this format:
   ```
   Category Name
   Article Title
   November 25, 2025
   
   Your first paragraph goes here. This will become the excerpt.
   
   ## Section Header
   
   Section content...
   
   - Bullet point 1
   - Bullet point 2
   ```

2. **Convert to HTML**: Run `node scripts/txt-to-html.js your-article.txt`
3. **Update the list**: Run `npm run refresh-posts`
4. **Done!** Your article is live.

See `example-article.txt` for a complete example.

### Method 2: Automatic (For existing HTML files)

1. **Create the Article**: Add a new HTML file to the `posts/` directory following the template structure
2. **Run the Script**: Execute `npm run refresh-posts`
3. **Done!** The script will automatically:
   - Extract the title, date, category, and excerpt from your HTML
   - Update `posts.json` with the new article
   - Sort all articles by date (newest first)

### Method 3: Manual

If you prefer to manually update `posts.json`, add a new entry like this:

```json
{
  "id": 6,
  "title": "Your Article Title",
  "slug": "your-article-slug",
  "date": "November 25, 2025",
  "category": "Pharma",
  "excerpt": "A brief description of your article...",
  "contentUrl": "/posts/your-article-slug.html"
}
```

## Article HTML Template

When creating a new article, use this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Title - ChemBio AI Insights</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <header>
        <div class="container nav-container">
            <a href="../index.html" class="logo">
                <div class="logo-icon">AI</div>
                <div class="logo-text">
                    <h1>ChemBio AI</h1>
                    <span>Insights</span>
                </div>
            </a>
            <nav>
                <a href="../index.html" class="btn" style="background: transparent; color: var(--primary-color); border: 1px solid var(--border-color);">Back to Home</a>
            </nav>
        </div>
    </header>

    <main>
        <article class="container" style="max-width: 800px; margin-top: 3rem; margin-bottom: 5rem;">
            <div class="article-header" style="text-align: center; margin-bottom: 3rem;">
                <span style="color: var(--accent-color); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Category Name</span>
                <h1 style="font-size: 2.5rem; margin: 1rem 0; color: var(--primary-color);">Your Article Title</h1>
                <p style="color: #64748b;">November 25, 2025</p>
            </div>

            <div class="article-body" style="font-size: 1.125rem; color: var(--text-color);">
                <p style="margin-bottom: 1.5rem;">Your first paragraph (this will be used as the excerpt).</p>

                <h2 style="font-size: 1.75rem; color: var(--primary-color); margin-top: 2.5rem; margin-bottom: 1rem;">Section Title</h2>
                <p style="margin-bottom: 1.5rem;">Section content...</p>
            </div>
        </article>
    </main>

    <footer>
        <div class="container footer-content">
            <div>
                <p>&copy; 2025 ChemBio AI Insights. All rights reserved.</p>
            </div>
            <div>
                <p>Contact: <a href="mailto:chembioaiinsights@gmail.com" style="color: white;">chembioaiinsights@gmail.com</a></p>
            </div>
        </div>
    </footer>
</body>
</html>
```

## Available Categories

- Pharma
- AgTech
- Science Labs
- Tools & Tips
- Global AI Trends
- Learning Resources

## For Manus AI Integration

Since Manus AI is connected to your GitHub:

1. Have Manus AI create a new HTML file in `posts/` using the template above
2. Have it run `npm run refresh-posts` to update the article list
3. Commit and push to GitHub
4. Your site will automatically update!

No need to manually edit `posts.json` - the automation script handles everything.
