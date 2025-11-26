# ChemBio AI Insights

A modern, static website featuring AI-driven insights for pharmaceuticals, agtech, and science labs. Built with clean HTML, CSS, and JavaScript.

## 🌐 Live Website

Visit the site at: [ChemBio AI Insights](https://dryqu.github.io/ChemBioAI/)

## ✨ Features

- **Responsive Design**: Clean, modern interface optimized for all devices
- **Dynamic Article Loading**: Articles automatically loaded from JSON
- **Typewriter Animation**: Eye-catching hero section with looping animation
- **Category Organization**: 6 topic categories for easy navigation
  - 💊 Pharma
  - 🌾 AgTech
  - 🧪 Science Labs
  - 🛠️ Tools & Tips
  - 🌍 Global AI Trends
  - 📘 Learning Resources
- **Contact Forms**: Subscribe and contact forms with FormSubmit integration

## 📁 Project Structure

```
ChemBioAI-Insights/
├── index.html              # Main homepage
├── assets/
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   └── js/
│       └── main.js        # JavaScript for articles and forms
├── posts/
│   ├── posts.json         # Article metadata
│   └── *.html            # Individual article pages
├── category/              # Category landing pages
└── scripts/              # Build scripts
```

## 🚀 Getting Started

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Dryqu/ChemBioAI.git
   cd ChemBioAI
   ```

2. Start a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server
   ```

3. Open your browser to `http://localhost:8000`

## 📝 Publishing New Articles

See [HOW-TO-PUBLISH-WITH-AI.md](HOW-TO-PUBLISH-WITH-AI.md) for detailed instructions on publishing new articles using AI assistance.

### Quick Publish

1. Create a `.txt` file with your article content
2. Use the AI publishing workflow (see `QUICK-PUBLISH-PROMPT.txt`)
3. The script will generate the HTML and update `posts.json`

## 🛠️ Development

### Adding a New Article Manually

1. Create an HTML file in the `posts/` directory
2. Add the article metadata to `posts/posts.json`:
   ```json
   {
     "id": 7,
     "title": "Your Article Title",
     "slug": "your-article-slug",
     "date": "Month DD, YYYY",
     "category": "Category Name",
     "excerpt": "Brief description...",
     "contentUrl": "/posts/your-article-slug.html"
   }
   ```

### Updating Styles

- Main styles: `assets/css/style.css`
- Color scheme uses CSS variables defined in `:root`
- Responsive breakpoints at 768px and 480px

## 📧 Contact

Email: [chembioaiinsights@gmail.com](mailto:chembioaiinsights@gmail.com)

## 📄 License

All rights reserved © 2025 ChemBio AI Insights

---

Built with ❤️ for the AI chemistry community
