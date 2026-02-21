/* ===================================================
   VELOLIFE — main.js
   Interactions, Animations, and Logic
   =================================================== */

(function () {
    'use strict';

    /* ---- NAVBAR SCROLL ---- */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    /* ---- HAMBURGER MENU ---- */
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
        hamburger.querySelectorAll('span')[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
        hamburger.querySelectorAll('span')[1].style.opacity = isOpen ? '0' : '1';
        hamburger.querySelectorAll('span')[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
    });
    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
        });
    });

    /* ---- HERO IMAGE PARALLAX & LOAD ---- */
    const heroImg = document.getElementById('heroImg');
    if (heroImg) {
        heroImg.addEventListener('load', () => heroImg.classList.add('loaded'));
        if (heroImg.complete) heroImg.classList.add('loaded');

        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (y < window.innerHeight) {
                heroImg.style.transform = `scale(1) translateY(${y * 0.25}px)`;
            }
        }, { passive: true });
    }

    /* ---- REVEAL ON SCROLL ---- */
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger siblings within same parent
                const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal:not(.visible)'));
                const idx = siblings.indexOf(entry.target);
                const delay = Math.min(idx * 80, 400);
                setTimeout(() => entry.target.classList.add('visible'), delay);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => revealObserver.observe(el));

    /* ---- ANIMATED COUNTERS ---- */
    const statNums = document.querySelectorAll('.stat-num[data-target]');
    let countersStarted = false;

    function formatNum(n) {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M+';
        if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K+';
        return n.toLocaleString() + '+';
    }

    function animateCounters() {
        if (countersStarted) return;
        countersStarted = true;
        statNums.forEach(el => {
            const target = parseInt(el.dataset.target, 10);
            const duration = 2000;
            const step = 16;
            const steps = duration / step;
            let current = 0;
            const increment = target / steps;
            const timer = setInterval(() => {
                current = Math.min(current + increment, target);
                el.textContent = formatNum(Math.round(current));
                if (current >= target) clearInterval(timer);
            }, step);
        });
    }

    const heroStats = document.querySelector('.hero-stats-bar');
    if (heroStats) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) animateCounters();
        }, { threshold: 0.5 });
        statsObserver.observe(heroStats);
    }

    /* ---- SMOOTH ANCHOR SCROLL ---- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ---- NEWSLETTER FORM ---- */
    const nlForm = document.getElementById('nlForm');
    const nlSuccess = document.getElementById('nlSuccess');
    const nlSubmit = document.getElementById('nlSubmit');

    if (nlForm) {
        nlForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('nlEmail').value.trim();
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                shakeElement(nlSubmit);
                return;
            }
            // Simulate API call
            nlSubmit.disabled = true;
            nlSubmit.querySelector('span').textContent = 'Subscribing...';
            setTimeout(() => {
                nlForm.hidden = true;
                nlSuccess.hidden = false;
                nlSuccess.style.animation = 'fadeInUp 0.5s ease forwards';
            }, 1200);
        });
    }

    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight; // reflow
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
    }

    // Inject shake keyframe
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-8px)}
      40%{transform:translateX(8px)}
      60%{transform:translateX(-5px)}
      80%{transform:translateX(5px)}
    }
  `;
    document.head.appendChild(shakeStyle);

    /* ---- CURSOR GLOW TRAIL (desktop only) ---- */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const trail = document.createElement('div');
        trail.style.cssText = `
      position:fixed; top:0; left:0; width:300px; height:300px;
      border-radius:50%; pointer-events:none; z-index:9999;
      background:radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%);
      transform:translate(-50%,-50%);
      transition:transform 0.08s ease;
    `;
        document.body.appendChild(trail);
        document.addEventListener('mousemove', (e) => {
            trail.style.left = e.clientX + 'px';
            trail.style.top = e.clientY + 'px';
        }, { passive: true });
    }

    /* ---- ACTIVE NAV HIGHLIGHTS (Scroll Spy) ---- */
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a');
    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navAnchors.forEach(a => {
                    a.style.color = a.getAttribute('href') === '#' + entry.target.id
                        ? 'rgba(249,115,22,1)'
                        : '';
                });
            }
        });
    }, { rootMargin: '-40% 0px -40% 0px' });
    sections.forEach(s => spy.observe(s));

    /* ---- RIDE CARD TILT ---- */
    document.querySelectorAll('.ride-card, .pillar, .pick-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
            card.style.transform = `perspective(600px) rotateX(${-y}deg) rotateY(${x}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

})();
