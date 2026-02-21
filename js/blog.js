/* ===================================================
   BLOG.JS — Blog-specific interactions for 4wCycle
   =================================================== */

(function () {
    'use strict';

    /* ---- CATEGORY FILTER (blog.html) ---- */
    const filterTabs = document.getElementById('filterTabs');
    const postsGrid = document.getElementById('postsGrid');
    const noResults = document.getElementById('noResults');

    if (filterTabs && postsGrid) {
        filterTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-tab');
            if (!btn) return;
            filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    }

    /* ---- SEARCH (blog.html) ---- */
    const searchInput = document.getElementById('blogSearch');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 250);
        });
    }

    function applyFilters() {
        if (!postsGrid) return;
        const activeCat = (document.querySelector('.filter-tab.active') || { dataset: { cat: 'all' } }).dataset.cat;
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const cards = postsGrid.querySelectorAll('.post-card, .featured-post');
        let visibleCount = 0;

        cards.forEach(card => {
            const cardCat = (card.dataset.cat || '').toLowerCase();
            const cardText = card.textContent.toLowerCase();
            const catMatch = activeCat === 'all' || cardCat === activeCat;
            const textMatch = !query || cardText.includes(query);
            const show = catMatch && textMatch;
            card.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        if (noResults) noResults.hidden = visibleCount > 0;
    }

    /* ---- LOAD MORE (mock) ---- */
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadMoreBtn.textContent = 'Loading…';
            loadMoreBtn.disabled = true;
            setTimeout(() => {
                loadMoreBtn.textContent = 'All stories loaded';
            }, 1000);
        });
    }

    /* ---- READING PROGRESS BAR (article.html) ---- */
    const progressBar = document.getElementById('readingProgress');
    const articleBody = document.getElementById('articleBody');

    if (progressBar && articleBody) {
        window.addEventListener('scroll', () => {
            const rect = articleBody.getBoundingClientRect();
            const total = articleBody.offsetHeight;
            const scrolled = Math.max(0, -rect.top);
            const pct = Math.min(100, (scrolled / (total - window.innerHeight)) * 100);
            progressBar.style.width = pct + '%';
        }, { passive: true });
    }

    /* ---- SHARE BUTTON (article.html) ---- */
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const data = {
                title: document.title,
                text: document.querySelector('meta[name="description"]')?.content || '',
                url: window.location.href,
            };
            if (navigator.share) {
                try { await navigator.share(data); } catch (_) { }
            } else {
                // fallback: copy to clipboard
                navigator.clipboard.writeText(window.location.href).then(() => {
                    const original = shareBtn.innerHTML;
                    shareBtn.innerHTML = '✓ Link copied!';
                    setTimeout(() => { shareBtn.innerHTML = original; }, 2000);
                });
            }
        });
    }

    /* ---- BLOG NEWSLETTER FORMS ---- */
    ['blogNlForm', 'sidebarNlForm'].forEach(id => {
        const form = document.getElementById(id);
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            if (btn) {
                btn.textContent = '✓ Subscribed!';
                btn.disabled = true;
                btn.style.background = 'var(--clr-green)';
            }
        });
    });

    /* ---- TABLE OF CONTENTS SCROLL SPY (article.html) ---- */
    const tocLinks = document.querySelectorAll('.toc-link');
    const h2s = document.querySelectorAll('.article-body h2');

    if (tocLinks.length && h2s.length) {
        const tocObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = Array.from(h2s).indexOf(entry.target);
                    tocLinks.forEach((l, i) => l.classList.toggle('toc-active', i === idx));
                }
            });
        }, { rootMargin: '-30% 0px -60% 0px' });
        h2s.forEach(h => tocObserver.observe(h));
    }

})();
