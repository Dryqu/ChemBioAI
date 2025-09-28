const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
    mobileNav.classList.toggle('open');
  });

  mobileNav.addEventListener('click', (event) => {
    if (event.target.classList.contains('nav-link')) {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const searchInput = document.querySelector('#application-search');
const featureCards = document.querySelectorAll('.feature-card');
const feedback = document.querySelector('.search-feedback');

if (searchInput && featureCards.length) {
  const filterCards = () => {
    const query = searchInput.value.trim().toLowerCase();
    let matches = 0;

    featureCards.forEach((card) => {
      const keywords = card.dataset.keywords ?? '';
      const text = `${card.textContent} ${keywords}`.toLowerCase();
      const isMatch = query === '' || text.includes(query);
      card.hidden = !isMatch;
      if (isMatch) {
        matches += 1;
      }
    });

    if (!feedback) {
      return;
    }

    if (query === '') {
      feedback.textContent = '';
      return;
    }

    if (matches === 0) {
      feedback.textContent = `No results found for "${searchInput.value.trim()}".`;
      return;
    }

    const plural = matches === 1 ? 'result' : 'results';
    feedback.textContent = `Showing ${matches} ${plural} for "${searchInput.value.trim()}".`;
  };

  searchInput.addEventListener('input', filterCards);

  searchInput.form?.addEventListener('submit', (event) => {
    event.preventDefault();
    filterCards();
  });

  searchInput.form?.addEventListener('reset', () => {
    requestAnimationFrame(filterCards);
  });
}

const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailField = newsletterForm.querySelector('input[type="email"]');
    if (!emailField) {
      return;
    }
    const email = emailField.value.trim();
    if (!email) {
      emailField.focus();
      return;
    }

    newsletterForm.reset();
    newsletterForm.querySelector('.newsletter-confirmation')?.remove();
    const confirmation = document.createElement('p');
    confirmation.className = 'newsletter-confirmation';
    confirmation.textContent = 'Thanks for subscribing! Please check your inbox to confirm your email.';
    newsletterForm.appendChild(confirmation);
    setTimeout(() => {
      confirmation.remove();
    }, 6000);
  });
}
