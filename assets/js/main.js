const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

const sections = Array.from(document.querySelectorAll('.card'));
const searchInput = document.getElementById('siteSearch');

const highlight = (text, term) => {
  if (!term) return text;
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

const resetHighlights = () => {
  sections.forEach(section => {
    const paragraphs = section.querySelectorAll('p, li, h3');
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
      const nodes = card.querySelectorAll('p, li, h3');
      nodes.forEach(node => {
        node.innerHTML = highlight(node.textContent, term);
      });
    }
  });
};

searchInput.addEventListener('input', event => filterSections(event.target.value));

const fakeSubmit = (formId, feedbackId, successText) => {
  const form = document.getElementById(formId);
  const feedback = document.getElementById(feedbackId);
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

fakeSubmit('newsletterForm', 'newsletterFeedback', 'Thanks {email}! Check your inbox for a confirmation email.');
fakeSubmit('ctaForm', 'ctaFeedback', 'Welcome aboard, {email}. Expect fresh insights soon.');

const contactForm = document.getElementById('contactForm');
const contactFeedback = document.getElementById('contactFeedback');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const name = formData.get('name');
  contactFeedback.textContent = `Thanks ${name}! I will respond shortly.`;
  contactForm.reset();
});
