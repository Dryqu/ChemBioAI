document.addEventListener('DOMContentLoaded', () => {
    // Load posts
    fetch('/posts/posts.json')
        .then(response => response.json())
        .then(posts => {
            // Sort posts: Newest first
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Store posts globally for search
            allPosts = posts;

            // Determine where we are
            const path = window.location.pathname;

            if (path === '/' || path.endsWith('index.html')) {
                renderLatestPosts(posts);
            } else if (path.includes('/category/')) {
                const category = document.body.dataset.category;
                renderCategoryPosts(posts, category);
            } else if (path.includes('search.html')) {
                // Render search results after posts are loaded
                renderSearchResults();
            }
        })
        .catch(error => console.error('Error loading posts:', error));

    // Form Handling
    setupForms();

    // Search functionality
    setupSearch();
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
                <p class="article-excerpt">${post.summary || post.excerpt}</p>
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

// Search functionality
let allPosts = [];

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const mobileSearchBar = document.getElementById('mobile-search-bar');

    // Handle Enter key for desktop search
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Handle Enter key for mobile search
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = mobileSearchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Toggle mobile search bar
    if (mobileSearchToggle && mobileSearchBar) {
        mobileSearchToggle.addEventListener('click', () => {
            mobileSearchBar.classList.toggle('active');
            if (mobileSearchBar.classList.contains('active')) {
                mobileSearchInput.focus();
            }
        });

        // Close mobile search when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileSearchBar.contains(e.target) && !mobileSearchToggle.contains(e.target)) {
                mobileSearchBar.classList.remove('active');
            }
        });
    }
}

function renderSearchResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const container = document.getElementById('search-results');
    const titleElement = document.getElementById('search-title');
    const queryElement = document.getElementById('search-query');

    if (!container || !query) {
        if (container) {
            container.innerHTML = '<p>No search query provided.</p>';
        }
        return;
    }

    // Update search input with the query
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = query;
    }

    // Display the search query
    if (queryElement) {
        queryElement.textContent = `Searching for: "${query}"`;
    }

    // Search through posts (handle both 'excerpt' and 'summary' fields)
    const filtered = allPosts.filter(post => {
        const searchText = (
            post.title.toLowerCase() + ' ' +
            (post.excerpt || post.summary || '').toLowerCase() + ' ' +
            post.category.toLowerCase()
        );
        return searchText.includes(query.toLowerCase());
    });

    // Update title with count
    if (titleElement) {
        const count = filtered.length;
        const articleWord = count === 1 ? 'article' : 'articles';
        titleElement.textContent = `Search Results (${count} ${articleWord} found)`;
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p>No articles found matching your search. Try different keywords.</p>';
    } else {
        container.innerHTML = filtered.map(post => createPostCard(post)).join('');
    }
}
