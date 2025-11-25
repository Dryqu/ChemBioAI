const FORM_EMAIL = 'chembioaiinsights@gmail.com';
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${FORM_EMAIL}`;
const currentPath = window.location.pathname;
const needsParent = currentPath.includes('/category/') || currentPath.includes('/posts/');
const BASE_PREFIX = needsParent ? '../' : '';

const POSTS_PATH = `${BASE_PREFIX}posts/posts.json`;
const ARTICLE_BASE = `${BASE_PREFIX}posts`;
const CATEGORY_BASE = `${BASE_PREFIX}category`;
const ALL_CATEGORIES = [
  'Pharma',
  'AgTech',
  'Science Labs',
  'Tools & Tips',
  'Global AI Trends',
  'Learning Resources',
  'Contribute',
];

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const cardsSelector = '.card, .article-card';
let sections = Array.from(document.querySelectorAll(cardsSelector));
const searchInput = document.getElementById('siteSearch');

const highlight = (text, term) => {
  if (!term) return text;
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

const resetHighlights = () => {
  sections.forEach(section => {
    const paragraphs = section.querySelectorAll('p, li, h3, h4');
    paragraphs.forEach(node => {
      node.innerHTML = node.textContent;
    });
  });
};

const filterSections = value => {
  const term = value.trim();
  resetHighlights();
  if (!term) {
    sections.forEach(card => card.classList.remove('card--hidden'));
    return;
  }

  sections.forEach(card => {
    const content = card.innerText.toLowerCase();
    const match = content.includes(term.toLowerCase());
    card.classList.toggle('card--hidden', !match);

    if (match) {
      const nodes = card.querySelectorAll('p, li, h3, h4');
      nodes.forEach(node => {
        node.innerHTML = highlight(node.textContent, term);
      });
    }
  });
};

if (searchInput) {
  searchInput.addEventListener('input', event => filterSections(event.target.value));
}

const submitToFormEndpoint = (formId, feedbackId, successText) => {
  const form = document.getElementById(formId);
  const feedback = document.getElementById(feedbackId);
  if (!form || !feedback) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(form);
    const emailField = form.querySelector('input[type="email"]');
    const email = formData.get('email') || (emailField ? emailField.value : '');
    if (emailField && !email) {
      feedback.textContent = 'Please enter a valid email address.';
      return;
    }
    feedback.textContent = 'Sending...';
    try {
      const response = await fetch(form.action || FORM_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Network error');
      feedback.textContent = successText.replace('{email}', email || '');
      form.reset();
    } catch (error) {
      feedback.textContent = 'Something went wrong. Please try again.';
    }
  });
};

submitToFormEndpoint('newsletterForm', 'newsletterFeedback', 'Thanks! Please check your inbox to confirm your subscription.');
submitToFormEndpoint('ctaForm', 'ctaFeedback', 'Thanks! Please check your inbox to confirm your subscription.');
submitToFormEndpoint('contactForm', 'contactFeedback', 'Thanks! Your message was sent.');

const articlesContainer = document.getElementById('articlesList');
const featuredContainer = document.getElementById('featuredArticle');
const categoryLinks = document.getElementById('categoryLinks');
const categoryPageContainer = document.getElementById('categoryArticles');
const categoryFeatured = document.getElementById('categoryFeatured');
const categoryEmpty = document.getElementById('categoryEmpty');
const categoryChips = document.getElementById('categoryChips');
const categoryTitle = document.getElementById('categoryTitle');
const categoryHeading = document.getElementById('categoryHeading');
const categoryDescription = document.getElementById('categoryDescription');
const bodyCategory = document.body?.dataset?.category || '';

const CATEGORY_DESCRIPTIONS = {
  Pharma: 'AI that accelerates drug discovery, development, and translational science.',
  AgTech: 'AI that strengthens crop protection chemistry and field biology.',
  'Science Labs': 'Automation, analysis, and experiment design for lab scientists.',
  'Tools & Tips': 'How-to guides, benchmarks, and playbooks for applied AI.',
  'Global AI Trends': 'Signals on policy, releases, and standards that shape science.',
  'Learning Resources': 'Courses, reading lists, and exercises to upskill science teams.',
  Contribute: 'Shared case studies, templates, and notes from the ChemBio AI community.',
};

const formatDate = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const renderArticleCard = post => {
  const card = document.createElement('article');
  card.className = 'article-card';
  card.dataset.tags = `${post.sector || ''} ${(post.tags || []).join(' ')}`.trim();
  const categoryHref = `${CATEGORY_BASE}/${encodeURIComponent(post.sector.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'))}.html`;
  card.innerHTML = `
    <p class="article-card__meta"><a href="${categoryHref}">${post.sector}</a> · ${formatDate(post.date)}</p>
    <h4>${post.title}</h4>
    <p>${post.summary}</p>
    <a href="${ARTICLE_BASE}/${post.slug}.html">Read article →</a>
  `;
  return card;
};

const renderFeatured = (container, post) => {
  if (!container) return;
  if (!post) {
    container.innerHTML = '';
    return;
  }
  const categoryHref = `${CATEGORY_BASE}/${encodeURIComponent(post.sector.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'))}.html`;
  container.innerHTML = `
    <p class="article-card__meta"><a href="${categoryHref}">${post.sector}</a> · ${formatDate(post.date)}</p>
    <h3>${post.title}</h3>
    <p>${post.summary}</p>
    <a href="${ARTICLE_BASE}/${post.slug}.html">Read the latest →</a>
  `;
};

const renderCategoryChips = (container, categories) => {
  if (!container) return;
  container.innerHTML = '';
  categories.forEach(category => {
    const link = document.createElement('a');
    link.className = 'category-chip';
    link.href = `${CATEGORY_BASE}/${encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'))}.html`;
    link.textContent = category;
    container.appendChild(link);
  });
};

const loadArticles = () => {
  fetch(POSTS_PATH)
    .then(response => response.json())
    .then(data => {
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      const categories = ALL_CATEGORIES;

      if (!sorted.length) {
        if (articlesContainer) {
          articlesContainer.innerHTML = '<p class="muted">Articles are coming soon.</p>';
        }
        if (featuredContainer) featuredContainer.innerHTML = '';
        if (categoryPageContainer) {
          categoryPageContainer.innerHTML = '<p class="muted">No articles found yet.</p>';
        }
        return;
      }

      if (categoryLinks) {
        renderCategoryChips(categoryLinks, categories);
      }

      if (categoryChips) {
        renderCategoryChips(categoryChips, categories);
      }

      if (articlesContainer) {
        articlesContainer.innerHTML = '';
        sorted.forEach((post, index) => {
          if (index === 0 && featuredContainer) {
            renderFeatured(featuredContainer, post);
          }
          const card = renderArticleCard(post);
          articlesContainer.appendChild(card);
        });
        sections = Array.from(document.querySelectorAll(cardsSelector));
      }

      const params = new URLSearchParams(window.location.search);
      const selectedCategory = bodyCategory || decodeURIComponent(params.get('category') || '') || categories[0];

      if (categoryPageContainer) {
        if (selectedCategory) {
          categoryTitle.textContent = `${selectedCategory} articles`;
          categoryHeading.textContent = `Latest in ${selectedCategory}`;
          categoryDescription.textContent = CATEGORY_DESCRIPTIONS[selectedCategory] || 'Browse recent articles in this focus area.';
        }
        const filtered = sorted.filter(post => post.sector === selectedCategory);
        if (filtered.length === 0) {
          categoryPageContainer.innerHTML = '';
          if (categoryEmpty) categoryEmpty.hidden = false;
          renderFeatured(categoryFeatured, null);
          return;
        }

        if (categoryEmpty) categoryEmpty.hidden = true;
        categoryPageContainer.innerHTML = '';
        filtered.forEach((post, index) => {
          if (index === 0 && categoryFeatured) {
            renderFeatured(categoryFeatured, post, 'posts');
          }
          categoryPageContainer.appendChild(renderArticleCard(post));
        });
        sections = Array.from(document.querySelectorAll(cardsSelector));
      }
    })
    .catch(() => {
      if (articlesContainer) {
        articlesContainer.innerHTML = '<p class="muted">Articles are coming soon.</p>';
      }
      if (categoryPageContainer) {
        categoryPageContainer.innerHTML = '<p class="muted">Unable to load articles right now.</p>';
      }
    });
};

loadArticles();
