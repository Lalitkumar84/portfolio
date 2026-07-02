/**
 * Lalit Kumar's Portfolio - Script Engine
 * Includes: Preloader, Canvas Particles, Custom Cursor, Theme Switcher,
 * Typewriter, Active Nav Observer, Card Tilts, and Form Validation.
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. PRELOADER & SCROLL INITIALIZER
       ========================================================================== */
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('preloader-progress');
    let progress = 0;

    // Simulate loading progress
    const progressInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            // Fade out preloader
            setTimeout(() => {
                preloader.classList.add('fade-out');
                // Trigger reveal animations for viewport-ready elements
                triggerInitialReveals();
            }, 300);
        }
        progressBar.style.width = `${progress}%`;
    }, 50);

    // Ensure preloader finishes if window loads fully before simulation
    window.addEventListener('load', () => {
        progress = 100;
        progressBar.style.width = '100%';
    });


    /* ==========================================================================
       2. CUSTOM CURSOR
       ========================================================================== */
    const cursorDot = document.getElementById('cursor-dot');
    const cursorOutline = document.getElementById('cursor-outline');
    
    let mouseX = 0, mouseY = 0; // Actual mouse positions
    let outlineX = 0, outlineY = 0; // Delayed outline positions

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant update for the center dot
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    });

    // Custom lag interpolation for outer outline
    function animateOutline() {
        // Linear interpolation (lerp) formula: current + (target - current) * factor
        outlineX += (mouseX - outlineX) * 0.15;
        outlineY += (mouseY - outlineY) * 0.15;

        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;

        requestAnimationFrame(animateOutline);
    }
    animateOutline();

    // Toggle custom hover class on interactive tags
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, .theme-toggle, .mobile-toggle, [data-tilt]');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });


    /* ==========================================================================
       3. INTERACTIVE CANVAS PARTICLE SYSTEM (HERO BACKGROUND)
       ========================================================================== */
    const canvas = document.getElementById('hero-particles');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animationFrameId;
    
    // Mouse coords for particle attraction/repulsion
    let particleMouse = {
        x: null,
        y: null,
        radius: 120
    };

    function resizeCanvas() {
        const heroSection = document.getElementById('home');
        canvas.width = heroSection.offsetWidth;
        canvas.height = heroSection.offsetHeight;
        initParticles();
    }

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 2 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 15;
            
            // Random direction speeds
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
        }

        draw() {
            // Get current accent color dynamically from computed styles
            const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
            ctx.fillStyle = themeColor;
            ctx.shadowBlur = 4;
            ctx.shadowColor = themeColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            
            // Reset shadows for optimization
            ctx.shadowBlur = 0;
        }

        update() {
            // Base movement
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off canvas boundaries
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

            // Mouse proximity interactions
            if (particleMouse.x !== null && particleMouse.y !== null) {
                let dx = particleMouse.x - this.x;
                let dy = particleMouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < particleMouse.radius) {
                    const force = (particleMouse.radius - distance) / particleMouse.radius;
                    // Move slightly away from cursor (repulsion)
                    const directionX = dx / distance;
                    const directionY = dy / distance;
                    
                    this.x -= directionX * force * 3;
                    this.y -= directionY * force * 3;
                }
            }
        }
    }

    function initParticles() {
        particles = [];
        // Scale quantity with canvas screen space area
        const numberOfParticles = Math.min(Math.floor((canvas.width * canvas.height) / 11000), 120);
        for (let i = 0; i < numberOfParticles; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            particles.push(new Particle(x, y));
        }
    }

    function connectParticles() {
        let opacityValue = 1;
        const maxDist = 120;
        const themeColorRaw = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDist) {
                    opacityValue = 1 - (distance / maxDist);
                    ctx.strokeStyle = themeColorRaw.startsWith('#') 
                        ? hexToRgba(themeColorRaw, opacityValue * 0.15)
                        : `rgba(0, 242, 254, ${opacityValue * 0.15})`; // fallback
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Helper utility to convert hex variables into rgba for canvas stroke
    function hexToRgba(hex, alpha) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
        }
        return `rgba(0, 242, 254, ${alpha})`; // fallback
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connectParticles();
        animationFrameId = requestAnimationFrame(animateParticles);
    }

    // Listeners for particles interactive scope
    const heroSec = document.getElementById('home');
    heroSec.addEventListener('mousemove', (e) => {
        const bounds = heroSec.getBoundingClientRect();
        particleMouse.x = e.clientX - bounds.left;
        particleMouse.y = e.clientY - bounds.top;
    });

    heroSec.addEventListener('mouseleave', () => {
        particleMouse.x = null;
        particleMouse.y = null;
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animateParticles();


    /* ==========================================================================
       4. LIGHT/DARK THEME TOGGLE & PERSISTENCE
       ========================================================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const storedTheme = localStorage.getItem('theme');
    
    // Default setting logic
    if (storedTheme) {
        document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
        // Default to dark mode
        document.documentElement.removeAttribute('data-theme');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            showToast('Switched to Dark Theme 🌙');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            showToast('Switched to Light Theme ☀️');
        }
    });


    /* ==========================================================================
       5. TYPEWRITER EFFECT
       ========================================================================== */
    const typewriterElement = document.getElementById('typewriter');
    const roles = ["Front-End Developer", "Java Programmer", "Problem Solver"];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typewriterDelay = 150;

    function handleTypewriter() {
        const currentText = roles[roleIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typewriterDelay = 75; // delete faster
        } else {
            typewriterElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typewriterDelay = 150; // normal writing speed
        }

        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typewriterDelay = 2000; // Pause at end of text word
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typewriterDelay = 500; // Pause before typing next word
        }

        setTimeout(handleTypewriter, typewriterDelay);
    }
    
    // Start typewriter logic
    if (typewriterElement) {
        setTimeout(handleTypewriter, 1000);
    }


    /* ==========================================================================
       6. STICKY NAVBAR NAVIGATION & MOBILE MENU
       ========================================================================== */
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Sticky scroll detector
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile navigation switch toggle
    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when navlink is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });


    /* ==========================================================================
       7. INTERSECTION OBSERVER - SCROLL REVEALS & ACTIVE LINKS
       ========================================================================== */
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const sections = document.querySelectorAll('section');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                
                // Once an element triggers, unobserve if desired (or keep for repeat effects)
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Fallback trigger for items already in view initially
    function triggerInitialReveals() {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('reveal-active');
            }
        });
    }

    // Active Section highlight observer
    const activeSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.35, // Adjust threshold to trigger accurately on screen scroll
        rootMargin: '-20% 0px -40% 0px'
    });

    sections.forEach(section => activeSectionObserver.observe(section));


    /* ==========================================================================
       8. 3D TILT EFFECT FOR INTERACTIVE CARDS
       ========================================================================== */
    const tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            // Get mouse position relative to card boundaries (0 to width/height)
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Map to range of -0.5 to 0.5
            const xPercent = (mouseX / width) - 0.5;
            const yPercent = (mouseY / height) - 0.5;
            
            // Set variables for CSS custom radial-glow position tracker
            card.style.setProperty('--mouse-x', `${(mouseX / width) * 100}%`);
            card.style.setProperty('--mouse-y', `${(mouseY / height) * 100}%`);

            // Apply 3D perspective rotation tilt offsets
            const maxTilt = 10; // degrees
            const tiltX = (yPercent * maxTilt).toFixed(2);
            const tiltY = -(xPercent * maxTilt).toFixed(2);

            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            // Reset to defaults
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        });
    });


    /* ==========================================================================
       9. CONTACT FORM VALIDATION & ACTIONS
       ========================================================================== */
    const contactForm = document.getElementById('contact-form');
    const nameInput = document.getElementById('form-name');
    const emailInput = document.getElementById('form-email');
    const messageInput = document.getElementById('form-message');
    const submitBtn = document.getElementById('submit-btn');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;

        // Name validate
        if (nameInput.value.trim() === '') {
            showError(nameInput, 'Name is required');
            isValid = false;
        } else {
            clearError(nameInput);
        }

        // Email validate
        if (emailInput.value.trim() === '') {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            showError(emailInput, 'Please enter a valid email address');
            isValid = false;
        } else {
            clearError(emailInput);
        }

        // Message validate
        if (messageInput.value.trim() === '') {
            showError(messageInput, 'Message cannot be empty');
            isValid = false;
        } else {
            clearError(messageInput);
        }

        if (isValid) {
            // Visual submit loading feedback
            const originalContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Sending...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

            // Mocking API delay submission
            setTimeout(() => {
                showToast('Thank you! Message sent successfully. 🚀');
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }, 1500);
        }
    });

    // Helper functions for inputs
    function showError(inputElement, msg) {
        const formGroup = inputElement.closest('.form-group');
        const errorSpan = formGroup.querySelector('.error-msg');
        errorSpan.textContent = msg;
        formGroup.classList.add('invalid');
    }

    // Input monitoring to clear warnings immediately on writing
    function clearError(inputElement) {
        const formGroup = inputElement.closest('.form-group');
        formGroup.classList.remove('invalid');
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    [nameInput, emailInput, messageInput].forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                clearError(input);
            }
        });
    });


    /* ==========================================================================
       10. TOAST NOTIFICATIONS HELPER
       ========================================================================== */
    const toastContainer = document.getElementById('toast-container');

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        toast.innerHTML = `
            <i class="fa-solid fa-circle-check toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast card after display timer finish
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

});
