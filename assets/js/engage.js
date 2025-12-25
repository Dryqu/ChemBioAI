// ============================================
// ENGAGE MODULE - Like, Share, Comments
// ============================================

// CONFIG - REPLACE WITH YOUR KEYS
const CONFIG = {
    // CLERK KEYS
    clerkPublishableKey: 'pk_test_YOUR_CLERK_KEY_HERE', // Get from https://dashboard.clerk.com

    // GISCUS KEYS (Get from https://giscus.app)
    giscusRepo: 'Dryqu/ChemBioAI',      // e.g. "username/repo"
    giscusRepoId: 'R_kgDOP4NyAw',            // e.g. "R_kgD..."
    giscusCategory: 'General',                 // Discussion category name
    giscusCategoryId: 'DIC_kwDOP4NyA84C0OGB',  // e.g. "DIC_kwD..."
};

// State
let user = null;
let clerk = null;
let likesData = {};

// ============================================
// 1. AUTHENTICATION (Clerk)
// ============================================
async function initAuth() {
    // Load Clerk script if not already present
    if (!window.Clerk) {
        const script = document.createElement('script');
        script.src = 'https://accounts.clerk.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise(resolve => {
            script.onload = resolve;
        });
    }

    // Initialize Clerk
    try {
        if (CONFIG.clerkPublishableKey === 'pk_test_Ymxlc3NlZC1iZWFnbGUtOTMuY2xlcmsuYWNjb3VudHMuZGV2JA') {
            console.warn('Engage Module: Clerk Publishable Key is missing. Auth will not work until configured.');
        }

        clerk = window.Clerk;
        await clerk.load({
            publishableKey: CONFIG.clerkPublishableKey,
        });

        user = clerk.user;
    } catch (e) {
        console.error('Engage Module: Failed to initialize Clerk. Check your Publishable Key.', e);
    }

    // Always load comments (Giscus handles auth internally)
    loadComments();

    // Enable like button
    enableLikeButton();
}

// ============================================
// 2. LIKE FUNCTIONALITY
// ============================================
function enableLikeButton() {
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');

    if (!likeBtn || !likeCount) return;

    const articleId = getArticleId();

    // Load likes from localStorage (in production, use API/Supabase)
    const storedLikes = JSON.parse(localStorage.getItem('articleLikes') || '{}');
    likesData = storedLikes;

    const currentLikes = likesData[articleId] || { count: 0, users: [] };
    likeCount.textContent = currentLikes.count;

    // Check if user already liked
    if (user && currentLikes.users.includes(user.id)) {
        likeBtn.classList.add('liked');
    }

    likeBtn.addEventListener('click', async () => {
        if (!clerk) {
            alert('Please configure the Clerk Publishable Key in assets/js/engage.js');
            return;
        }

        if (!user) {
            // Prompt sign-in
            try {
                await clerk.openSignIn();
            } catch (e) {
                console.error("Clerk sign-in error:", e);
            }
            return;
        }

        const isLiked = likeBtn.classList.contains('liked');

        if (isLiked) {
            // Unlike
            currentLikes.count = Math.max(0, currentLikes.count - 1);
            currentLikes.users = currentLikes.users.filter(id => id !== user.id);
            likeBtn.classList.remove('liked');
        } else {
            // Like
            currentLikes.count++;
            currentLikes.users.push(user.id);
            likeBtn.classList.add('liked');
        }

        likesData[articleId] = currentLikes;
        localStorage.setItem('articleLikes', JSON.stringify(likesData));
        likeCount.textContent = currentLikes.count;
    });
}

function getArticleId() {
    const path = window.location.pathname;
    return path.split('/').pop().replace('.html', '');
}

// ============================================
// 3. SHARE FUNCTIONALITY
// ============================================
function initShare() {
    const shareLinkedIn = document.getElementById('share-linkedin');
    const shareX = document.getElementById('share-x');
    const shareCopy = document.getElementById('share-copy');

    if (!shareLinkedIn || !shareX || !shareCopy) return;

    const url = window.location.href;
    const title = document.querySelector('h1')?.textContent || 'ChemBio AI Insights';

    shareLinkedIn.addEventListener('click', () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    });

    shareX.addEventListener('click', () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400');
    });

    shareCopy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(url);
            const originalHTML = shareCopy.innerHTML;
            shareCopy.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => {
                shareCopy.innerHTML = originalHTML;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });
}

// ============================================
// 4. COMMENTS (Giscus) - Always Visible
// ============================================
function loadComments() {
    const container = document.getElementById('comments-container');
    if (!container) return;

    if (CONFIG.giscusRepo === 'YourUsername/ChemBioAI') {
        container.innerHTML = '<p style="text-align:center; padding: 2rem; color: #64748b; border: 1px dashed #cbd5e1; border-radius: 0.5rem;">Comments are disabled until Giscus is configured in main.js</p>';
        return;
    }

    // Giscus handles its own authentication
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', CONFIG.giscusRepo);
    script.setAttribute('data-repo-id', CONFIG.giscusRepoId);
    script.setAttribute('data-category', CONFIG.giscusCategory);
    script.setAttribute('data-category-id', CONFIG.giscusCategoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    container.appendChild(script);
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initShare();
});
