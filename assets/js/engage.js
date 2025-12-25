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
    console.log('Engage Module: Initializing...');

    // 1. Render Scaffolding immediately
    renderScaffolding();

    // 2. Initialize Buttons & Share features IMMEDIATELY (Don't wait for network)
    updateUIState();
    enableLikeButton();
    initShare();

    // 3. Load Supabase & Clerk in parallel
    try {
        await Promise.all([loadSupabase(), loadClerk()]);
        console.log('Engage Module: Scripts loaded.');

        // 4. Initialize Logic that requires scripts
        updateUIState(); // Re-run to update with User state
        fetchComments();

    } catch (e) {
        console.error('Engage Module: Critical Init Error', e);
        const container = document.getElementById('comments-container');
        if (container) {
            container.innerHTML =
                `<div style="padding:1rem; border:1px solid red; color:red; border-radius:8px;">
                    <strong>Error loading comments:</strong> ${e.message}<br>
                    <small>Like & Share should still work locally.</small>
                 </div>`;
        }
    }
}

function renderScaffolding() {
    const container = document.getElementById('comments-container');
    if (!container) return;

    // Render placeholders
    container.innerHTML = `
        <div id="comment-input-container">
            <div style="background: #f8fafc; border: 1px dashed var(--border-color); border-radius: 0.5rem; padding: 1.5rem; text-align: center; color: #64748b;">
                Loading community features...
            </div>
        </div>
        <div id="comment-list" style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 2rem;">
            <!-- Comments will appear here -->
        </div>
    `;
}

// Use Dynamic Import to avoid global variable issues
async function loadSupabase() {
    if (window.supabase) {
        supabase = window.supabase; // If already init
        return;
    }

    try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    } catch (err) {
        throw new Error('Supabase ESM Load Failed: ' + err.message);
    }
}

function loadClerk() {
    return new Promise((resolve, reject) => {
        if (window.Clerk) {
            clerk = window.Clerk;
            checkUser();
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.clerk.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
        script.async = true;
        script.onload = async () => {
            try {
                clerk = window.Clerk;
                await clerk.load({ publishableKey: CONFIG.clerkPublishableKey });
                checkUser();
                resolve();
            } catch (err) {
                reject(new Error('Clerk Load Failed: ' + err.message));
            }
        };
        script.onerror = () => reject(new Error('Failed to load Clerk script.'));
        document.head.appendChild(script);
    });
}

function checkUser() {
    user = clerk.user;
    // Add listener for sign-out/sign-in
    clerk.addListener((payload) => {
        user = payload.user;
        updateUIState();
    });
}

// ============================================
// 2. UI HELPERS
// ============================================
function updateUIState() {
    renderCommentInput();
}

function getArticleId() {
    const path = window.location.pathname;
    return path.split('/').pop().replace('.html', '');
}

// ============================================
// 3. COMMENTS (Supabase)
// ============================================
async function fetchComments() {
    if (!supabase) return;

    const list = document.getElementById('comment-list');

    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', getArticleId())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Data Fetch Error:', error);
        list.innerHTML = `<p style="color:red">Failed to load comments. (Check Supabase RLS policies?)</p>`;
        return;
    }

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
                    <button class="btn" onclick="clerk.signOut()" style="background:none; border:none; color:#64748b; font-size:0.8rem; cursor:pointer; text-decoration:underline;">Sign Out</button>
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
        // Logged Out View
        container.innerHTML = `
            <div style="background: white; border: 2px solid var(--border-color); border-radius: 0.5rem; padding: 1rem; cursor: pointer;" onclick="clerk.openSignIn()">
                <textarea disabled placeholder="Sign in with Email to comment..." 
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

    try {
        const { error } = await supabase
            .from('comments')
            .insert({
                article_id: getArticleId(),
                user_id: user.id,
                user_name: user.fullName || user.username || 'Anonymous',
                user_avatar: user.imageUrl,
                content: content
            });

        if (error) throw error;

        textarea.value = '';
        fetchComments(); // Refresh list

    } catch (e) {
        alert('Failed to post comment: ' + e.message);
    } finally {
        btn.textContent = 'Post Comment';
        btn.disabled = false;
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
            try { await clerk.openSignIn(); } catch (e) { console.error(e); }
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
