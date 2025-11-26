document.addEventListener('DOMContentLoaded', () => {
    // Load posts
    fetch('/posts/posts.json')
        .then(response => response.json())
        .then(posts => {
            // Sort posts: Newest first
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Determine where we are
            const path = window.location.pathname;

            if (path === '/' || path.endsWith('index.html')) {
                renderLatestPosts(posts);
            } else if (path.includes('/category/')) {
                const category = document.body.dataset.category;
                renderCategoryPosts(posts, category);
            }
        })
        .catch(error => console.error('Error loading posts:', error));

    // Form Handling
    setupForms();
});

function renderLatestPosts(posts) {
    const container = document.getElementById('latest-posts');
    if (!container) return;

    // Get one article per category
    const categories = ['Pharma', 'AgTech', 'Science Labs', 'Tools & Tips', 'Global AI Trends', 'Learning Resources'];
    const latestByCategory = [];
    
    categories.forEach(category => {
        const categoryPost = posts.find(post => post.category === category);
        if (categoryPost) {
            latestByCategory.push(categoryPost);
        }
    });

    if (latestByCategory.length === 0) {
        container.innerHTML = '<p>No articles available yet.</p>';
        return;
    }

    container.innerHTML = latestByCategory.map(post => createPostCard(post)).join('');
}

function renderCategoryPosts(posts, category) {
    const container = document.getElementById('category-posts');
    if (!container) return;

    const filteredPosts = posts.filter(post => post.category === category);

    if (filteredPosts.length === 0) {
        container.innerHTML = '<p>No articles found in this category yet.</p>';
        return;
    }

    container.innerHTML = filteredPosts.map(post => createPostCard(post)).join('');
}

function createPostCard(post) {
    return `
        <article class="article-card">
            <div class="article-content">
                <div class="article-meta">
                    <span class="article-category">${post.category}</span>
                    <span class="article-date">${formatDate(post.date)}</span>
                </div>
                <h3 class="article-title">
                    <a href="${post.contentUrl}">${post.title}</a>
                </h3>
                <p class="article-excerpt">${post.excerpt}</p>
                <a href="${post.contentUrl}" class="read-more">Read Article &rarr;</a>
            </div>
        </article>
    `;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function setupForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = form.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Add subject based on form ID
            if (form.id === 'subscribe-form') {
                data._subject = 'New Subscriber: ChemBio AI Insights';
            } else {
                data._subject = 'New Contact Message: ChemBio AI Insights';
            }

            fetch('https://formsubmit.co/ajax/chembioaiinsights@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(data => {
                    form.reset();
                    btn.textContent = originalText;
                    btn.disabled = false;

                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.textContent = 'Thank you! Your submission has been received.';

                    // Remove existing success message if any
                    const existing = form.nextElementSibling;
                    if (existing && existing.classList.contains('success-message')) {
                        existing.remove();
                    }

                    form.after(successMsg);

                    // Auto-hide after 5 seconds
                    setTimeout(() => successMsg.remove(), 5000);
                })
                .catch(error => {
                    console.error('Error:', error);
                    btn.textContent = originalText;
                    btn.disabled = false;
                    alert('Something went wrong. Please try again later.');
                });
        });
    });
}
