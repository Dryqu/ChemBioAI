const fs = require('fs');
const path = require('path');

// Usage: node scripts/txt-to-html.js <input.txt>
const inputFile = process.argv[2];

if (!inputFile) {
    console.error('Usage: node scripts/txt-to-html.js <input.txt>');
    console.error('Example: node scripts/txt-to-html.js my-article.txt');
    process.exit(1);
}

if (!fs.existsSync(inputFile)) {
    console.error(`Error: File "${inputFile}" not found.`);
    process.exit(1);
}

try {
    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 4) {
        console.error('Error: Text file must have at least 4 lines:');
        console.error('Line 1: Category');
        console.error('Line 2: Title');
        console.error('Line 3: Date (e.g., November 25, 2025)');
        console.error('Line 4+: Content (use ## for section headers)');
        process.exit(1);
    }

    const category = lines[0];
    const title = lines[1];
    const date = lines[2];
    const bodyLines = lines.slice(3);

    // Generate slug from title
    const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    // Process body content
    let bodyHtml = '';
    let inList = false;

    bodyLines.forEach(line => {
        // Section headers (## Header)
        if (line.startsWith('## ')) {
            if (inList) {
                bodyHtml += '                    </ul>\n';
                inList = false;
            }
            const headerText = line.substring(3);
            bodyHtml += `\n                <h2 style="font-size: 1.75rem; color: var(--primary-color); margin-top: 2.5rem; margin-bottom: 1rem;">${headerText}</h2>\n`;
        }
        // List items (- Item)
        else if (line.startsWith('- ')) {
            const itemText = line.substring(2);
            if (!inList) {
                bodyHtml += '                    <ul style="padding-left: 1.5rem;">\n';
                inList = true;
            }
            bodyHtml += `                        <li style="margin-bottom: 0.5rem;">${itemText}</li>\n`;
        }
        // Regular paragraphs
        else {
            if (inList) {
                bodyHtml += '                    </ul>\n';
                inList = false;
            }
            bodyHtml += `                <p style="margin-bottom: 1.5rem;">${line}</p>\n`;
        }
    });

    if (inList) {
        bodyHtml += '                    </ul>\n';
    }

    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ChemBio AI Insights</title>
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
                <span style="color: var(--accent-color); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">${category}</span>
                <h1 style="font-size: 2.5rem; margin: 1rem 0; color: var(--primary-color);">${title}</h1>
                <p style="color: #64748b;">${date}</p>
            </div>

            <div class="article-body" style="font-size: 1.125rem; color: var(--text-color);">
${bodyHtml}
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
</html>`;

    // Write to posts directory
    const outputFile = path.join(__dirname, '../posts', `${slug}.html`);
    fs.writeFileSync(outputFile, html);

    console.log(`✓ Successfully created: posts/${slug}.html`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the generated HTML file`);
    console.log(`2. Run: npm run refresh-posts`);
    console.log(`3. Your article will appear on the site!`);

} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
