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

const fakeSubmit = (formId, feedbackId, successText) => {
  const form = document.getElementById(formId);
  const feedback = document.getElementById(feedbackId);
  if (!form || !feedback) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = formData.get('email') || form.querySelector('input[type="email"]').value;
    if (!email) {
      feedback.textContent = 'Please enter a valid email address.';
      return;
    }
    feedback.textContent = 'Saving your preferences...';
    setTimeout(() => {
      feedback.textContent = successText.replace('{email}', email);
      form.reset();
    }, 800);
  });
};

fakeSubmit('newsletterForm', 'newsletterFeedback', 'Thanks! Please check your inbox to confirm your subscription.');
fakeSubmit('ctaForm', 'ctaFeedback', 'Thanks! Please check your inbox to confirm your subscription.');

const contactForm = document.getElementById('contactForm');
const contactFeedback = document.getElementById('contactFeedback');
if (contactForm && contactFeedback) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    contactFeedback.textContent = 'Thanks! Your message was sent.';
    contactForm.reset();
  });
}

const articlesContainer = document.getElementById('articlesList');

const formatDate = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

if (articlesContainer) {
  fetch('posts/posts.json')
    .then(response => response.json())
    .then(data => {
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      articlesContainer.innerHTML = '';
      sorted.forEach(post => {
        const card = document.createElement('article');
        card.className = 'article-card';
        card.dataset.tags = `${post.sector || ''} ${(post.tags || []).join(' ')}`.trim();
        card.innerHTML = `
          <p class="article-card__meta">${formatDate(post.date)} · ${post.sector}</p>
          <h4>${post.title}</h4>
          <p>${post.summary}</p>
          <a href="posts/${post.slug}.html">Read article →</a>
        `;
        articlesContainer.appendChild(card);
      });
      sections = Array.from(document.querySelectorAll(cardsSelector));
    })
    .catch(() => {
      articlesContainer.innerHTML = '<p class="muted">Articles are coming soon.</p>';
    });
}
