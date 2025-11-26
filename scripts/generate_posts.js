const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../posts');
const outputFile = path.join(postsDir, 'posts.json');

// Helper to extract content between tags
function extract(content, startTag, endTag) {
    const regex = new RegExp(`${startTag}([^]*?)${endTag}`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
}

// Helper to clean HTML tags from text
function stripTags(html) {
    return html.replace(/<[^>]*>/g, '').trim();
}

try {
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.html'));
    const posts = [];
    let idCounter = 1;

    console.log(`Found ${files.length} HTML files in ${postsDir}`);

    files.forEach(file => {
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Scope to the <article> tag to avoid header/logo matches
        const articleContentMatch = content.match(/<article[^>]*>([^]*?)<\/article>/i);
        const articleContent = articleContentMatch ? articleContentMatch[1] : content;

        // Extract Metadata from article content

        // 1. Category: Inside the span in .article-header
        const categoryMatch = articleContent.match(/<span[^>]*style="color: var\(--accent-color\)[^>]*>([^<]+)<\/span>/i);
        let category = categoryMatch ? categoryMatch[1].trim() : 'Uncategorized';
        // Clean up newlines/spaces
        category = category.replace(/\s+/g, ' ');

        // 2. Title: <h1>...</h1> (may span multiple lines)
        const titleMatch = articleContent.match(/<h1[^>]*>([^]*?)<\/h1>/i);
        let title = titleMatch ? stripTags(titleMatch[1]) : 'Untitled';
        // Clean up newlines/spaces
        title = title.replace(/\s+/g, ' ').trim();

        // 3. Date: <p ...>Month Day, Year</p>
        const dateMatch = articleContent.match(/>([A-Z][a-z]+ \d{1,2}, \d{4})<\/p>/);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

        // 4. Excerpt: First paragraph in .article-body
        const bodyMatch = articleContent.match(/<div class="article-body"[^>]*>\s*<p[^>]*>([^<]+)<\/p>/i);
        let excerpt = bodyMatch ? stripTags(bodyMatch[1]) : '';
        // Clean up newlines/spaces in excerpt
        excerpt = excerpt.replace(/\s+/g, ' ').trim();
        // Truncate excerpt if too long
        if (excerpt.length > 150) {
            excerpt = excerpt.substring(0, 147) + '...';
        }

        // 5. Slug and URL
        const slug = file.replace('.html', '');
        const contentUrl = `/posts/${file}`;

        posts.push({
            id: idCounter++,
            title,
            slug,
            date, // Keep original format string for display, or parse to YYYY-MM-DD if needed for sorting
            category,
            excerpt,
            contentUrl
        });

        console.log(`Processed: ${title} (${category})`);
    });

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write to posts.json
    fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2));
    console.log(`\nSuccessfully updated posts.json with ${posts.length} articles.`);

} catch (error) {
    console.error('Error generating posts:', error);
    process.exit(1);
}
