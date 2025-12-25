// ============================================
// ENGAGE MODULE - Like, Share, Comments (Custom)
// ============================================

const CONFIG = {
    // CLERK KEYS
    clerkPublishableKey: 'pk_test_Ymxlc3NlZC1iZWFnbGUtOTMuY2xlcmsuYWNjb3VudHMuZGV2JA',

    // SUPABASE KEYS
    supabaseUrl: 'https://opeibcpemzavmiurxpmp.supabase.co',
    supabaseAnonKey: 'sb_publishable_ccvfei7qIPw_UPPNg1TUAA_I8FczTqp'
};

// State
let user = null;
let clerk = null;
let supabase = null;
let likesData = {};

// ============================================
// 1. INIT
// ============================================
async function init() {
    // 1. Load Supabase
    if (!window.supabase) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.onload = () => {
            supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
            loadComments(); // Load comments once Supabase is ready
        };
        document.head.appendChild(script);
    }

    // 2. Load Clerk
    if (!window.Clerk) {
        const script = document.createElement('script');
        script.src = 'https://accounts.clerk.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise(resolve => {
            script.onload = resolve;
        });
    }

    try {
        clerk = window.Clerk;
        await clerk.load({
            publishableKey: CONFIG.clerkPublishableKey,
        });

        user = clerk.user;
        updateUIState();
        enableLikeButton();
        initShare();

    } catch (e) {
        console.error('Engage Module: Failed to initialize/load.', e);
    }
}

// ============================================
// 2. UI HELPERS
// ============================================
function updateUIState() {
    const authPrompt = document.getElementById('auth-prompt'); // Legacy, might replace
    const inputArea = document.getElementById('comment-input-area');

    // We render the input area dynamically now
    renderCommentInput();
}

function getArticleId() {
    const path = window.location.pathname;
    return path.split('/').pop().replace('.html', '');
}

// ============================================
// 3. COMMENTS (Supabase)
// ============================================
async function loadComments() {
    const container = document.getElementById('comments-container');
    if (!container || !supabase) return;

    // Fetch comments for this article
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', getArticleId())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<p>Error loading comments.</p>';
        return;
    }

    // Render Container Structure
    container.innerHTML = `
        <div id="comment-input-container"></div>
        <div id="comment-list" style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 2rem;"></div>
    `;

    renderCommentInput();
    renderCommentList(data || []);
}

function renderCommentInput() {
    const container = document.getElementById('comment-input-container');
    if (!container) return;

    if (user) {
        // Logged In View
        container.innerHTML = `
            <div style="background: white; border: 2px solid var(--border-color); border-radius: 0.5rem; padding: 1rem;">
                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                    <img src="${user.imageUrl}" style="width:32px; height:32px; border-radius:50%;">
                    <span style="font-weight:600; font-size:0.9rem;">${user.fullName || user.username}</span>
                </div>
                <textarea id="comment-textarea" placeholder="Share your thoughts..." 
                    style="width: 100%; min-height: 80px; border: 1px solid var(--border-color); border-radius:0.25rem; padding:0.5rem; outline: none; font-family: inherit; font-size: 1rem; resize: vertical;"></textarea>
                <div style="display: flex; justify-content: flex-end; margin-top: 0.75rem;">
                    <button id="post-comment-btn" class="btn" style="width: auto; padding: 0.5rem 1.5rem;">Post Comment</button>
                </div>
            </div>
        `;

        document.getElementById('post-comment-btn').addEventListener('click', postComment);

    } else {
        // Logged Out View (Optimistic UI - click to sign in)
        container.innerHTML = `
            <div style="background: white; border: 2px solid var(--border-color); border-radius: 0.5rem; padding: 1rem; cursor: pointer;" onclick="window.Clerk.openSignIn()">
                <textarea disabled placeholder="Sign in to share your thoughts..." 
                    style="width: 100%; min-height: 60px; border: none; outline: none; font-family: inherit; font-size: 1rem; resize: none; background: transparent; cursor: pointer;"></textarea>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
                    <span style="color: #94a3b8; font-size: 0.875rem;">💡 Email, Google, or GitHub</span>
                    <button class="btn" style="width: auto; padding: 0.5rem 1.5rem;">Sign In</button>
                </div>
            </div>
        `;
    }
}

function renderCommentList(comments) {
    const list = document.getElementById('comment-list');
    if (!list) return;

    if (comments.length === 0) {
        list.innerHTML = '<p style="color: #94a3b8; text-align: center;">No comments yet. Be the first!</p>';
        return;
    }

    list.innerHTML = comments.map(c => `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                <img src="${c.user_avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" 
                     style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; object-fit: cover;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                        <strong style="color: var(--primary-color); font-size: 0.95rem;">${escapeHtml(c.user_name)}</strong>
                        <span style="color: #94a3b8; font-size: 0.8rem;">${new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style="color: var(--text-color); line-height: 1.6; font-size: 0.95rem; white-space: pre-wrap;">${escapeHtml(c.content)}</p>
                </div>
            </div>
        </div>
    `).join('');
}

async function postComment() {
    const textarea = document.getElementById('comment-textarea');
    const content = textarea.value.trim();
    if (!content) return;

    const btn = document.getElementById('post-comment-btn');
    btn.textContent = 'Posting...';
    btn.disabled = true;

    const { error } = await supabase
        .from('comments')
        .insert({
            article_id: getArticleId(),
            user_id: user.id,
            user_name: user.fullName || user.username || 'Anonymous',
            user_avatar: user.imageUrl,
            content: content
        });

    if (error) {
        alert('Failed to post comment: ' + error.message);
        btn.textContent = 'Post Comment';
        btn.disabled = false;
    } else {
        textarea.value = '';
        btn.textContent = 'Post Comment';
        btn.disabled = false;
        loadComments(); // Refresh list
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================
// 4. LIKE & SHARE (Existing)
// ============================================
function enableLikeButton() {
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    if (!likeBtn || !likeCount) return;

    const articleId = getArticleId();
    const storedLikes = JSON.parse(localStorage.getItem('articleLikes') || '{}');
    likesData = storedLikes;
    const currentLikes = likesData[articleId] || { count: 0, users: [] };
    likeCount.textContent = currentLikes.count;

    if (user && currentLikes.users.includes(user.id)) likeBtn.classList.add('liked');

    likeBtn.addEventListener('click', async () => {
        if (!user) {
            clerk.openSignIn();
            return;
        }

        const isLiked = likeBtn.classList.contains('liked');
        if (isLiked) {
            currentLikes.count = Math.max(0, currentLikes.count - 1);
            currentLikes.users = currentLikes.users.filter(id => id !== user.id);
            likeBtn.classList.remove('liked');
        } else {
            currentLikes.count++;
            currentLikes.users.push(user.id);
            likeBtn.classList.add('liked');
        }
        likesData[articleId] = currentLikes;
        localStorage.setItem('articleLikes', JSON.stringify(likesData));
        likeCount.textContent = currentLikes.count;
    });
}

function initShare() {
    const shareLinkedIn = document.getElementById('share-linkedin');
    const shareX = document.getElementById('share-x');
    const shareCopy = document.getElementById('share-copy');
    if (!shareLinkedIn) return;

    const url = window.location.href;
    const title = document.querySelector('h1')?.textContent || 'ChemBio AI Insights';

    shareLinkedIn.addEventListener('click', () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400'));
    shareX.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400'));
    shareCopy.addEventListener('click', async () => {
        await navigator.clipboard.writeText(url);
        const originalHTML = shareCopy.innerHTML;
        shareCopy.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => shareCopy.innerHTML = originalHTML, 2000);
    });
}

document.addEventListener('DOMContentLoaded', init);
