// ===========================
// Particle System
// ===========================
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };
        this.resize();
        this.init();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 15000));
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                hue: Math.random() * 60 + 240, // purple to cyan range
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p, i) => {
            // Move
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            // Mouse interaction
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = (150 - dist) / 150;
                p.x -= dx * force * 0.02;
                p.y -= dy * force * 0.02;
                p.opacity = Math.min(0.8, p.opacity + force * 0.3);
            } else {
                p.opacity += (Math.random() * 0.5 + 0.1 - p.opacity) * 0.01;
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.opacity})`;
            this.ctx.fill();

            // Draw connections
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                if (d < 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `hsla(${(p.hue + p2.hue) / 2}, 60%, 60%, ${(1 - d / 120) * 0.15})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ===========================
// Cursor Glow
// ===========================
class CursorGlow {
    constructor() {
        this.glow = document.getElementById('cursorGlow');
        if (!this.glow) return;
        
        this.pos = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        
        window.addEventListener('mousemove', (e) => {
            this.target.x = e.clientX;
            this.target.y = e.clientY;
        });

        this.animate();
    }

    animate() {
        this.pos.x += (this.target.x - this.pos.x) * 0.08;
        this.pos.y += (this.target.y - this.pos.y) * 0.08;
        
        if (this.glow) {
            this.glow.style.left = this.pos.x + 'px';
            this.glow.style.top = this.pos.y + 'px';
        }

        requestAnimationFrame(() => this.animate());
    }
}

// ===========================
// Stats Counter Animation
// ===========================
class StatsCounter {
    constructor() {
        this.counters = document.querySelectorAll('.stat-number[data-target]');
        this.observed = false;
        this.observe();
    }

    observe() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.observed) {
                    this.observed = true;
                    this.animateAll();
                }
            });
        }, { threshold: 0.5 });

        const statsRow = document.getElementById('statsRow');
        if (statsRow) observer.observe(statsRow);
    }

    animateAll() {
        this.counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            this.animateCounter(counter, target);
        });
    }

    animateCounter(element, target) {
        const duration = 2000;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            
            if (target >= 1000) {
                element.textContent = (current / 1000).toFixed(1) + 'K';
            } else {
                element.textContent = current;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                if (target >= 1000) {
                    element.textContent = (target / 1000).toFixed(1) + 'K';
                } else {
                    element.textContent = target;
                }
            }
        };

        requestAnimationFrame(update);
    }
}

// ===========================
// Link Card Interactions
// ===========================
class LinkCards {
    constructor() {
        this.cards = document.querySelectorAll('.link-card[data-tilt]');
        this.bindEvents();
    }

    bindEvents() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.tilt(e, card));
            card.addEventListener('mouseleave', (e) => this.resetTilt(card));
            
            // Ripple effect on click
            card.addEventListener('click', (e) => this.ripple(e, card));
        });
    }

    tilt(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -3;
        const rotateY = ((x - centerX) / centerX) * 3;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px) scale(1.02)`;
    }

    resetTilt(card) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    }

    ripple(e, card) {
        const rect = card.getBoundingClientRect();
        const ripple = document.createElement('div');
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(124, 58, 237, 0.3), transparent 70%);
            left: ${e.clientX - rect.left - size / 2}px;
            top: ${e.clientY - rect.top - size / 2}px;
            transform: scale(0);
            animation: ripple-effect 0.6s ease-out forwards;
            pointer-events: none;
            z-index: 0;
        `;
        
        card.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
}

// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple-effect {
        to {
            transform: scale(2.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// ===========================
// Typing Effect for Bio
// ===========================
class TypingEffect {
    constructor() {
        const bio = document.getElementById('userBio');
        if (!bio) return;
        
        const text = bio.textContent;
        bio.textContent = '';
        bio.style.opacity = '1';
        bio.style.animation = 'none';
        
        setTimeout(() => {
            let i = 0;
            const type = () => {
                if (i < text.length) {
                    bio.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, 25 + Math.random() * 15);
                }
            };
            type();
        }, 800);
    }
}

// ===========================
// Scroll Reveal
// ===========================
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.link-card');
        this.observe();
    }

    observe() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

        this.elements.forEach(el => observer.observe(el));
    }
}

// ===========================
// Easter Egg - Konami Code
// ===========================
class KonamiCode {
    constructor() {
        this.sequence = [];
        this.code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        
        document.addEventListener('keydown', (e) => {
            this.sequence.push(e.key);
            this.sequence = this.sequence.slice(-10);
            
            if (JSON.stringify(this.sequence) === JSON.stringify(this.code)) {
                this.activate();
            }
        });
    }

    activate() {
        document.body.style.animation = 'rainbow-bg 3s linear infinite';
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rainbow-bg {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            document.body.style.animation = '';
            style.remove();
        }, 5000);
    }
}

// ===========================
// Avatar Click Effect
// ===========================
class AvatarEffect {
    constructor() {
        const avatar = document.getElementById('avatarWrapper');
        if (!avatar) return;
        
        avatar.addEventListener('click', () => {
            this.createSparkles(avatar);
        });
    }

    createSparkles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('div');
            const angle = (Math.PI * 2 / 12) * i;
            const distance = 60 + Math.random() * 40;
            const size = 4 + Math.random() * 6;
            
            sparkle.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${['#7c3aed', '#06b6d4', '#f43f5e', '#a855f7', '#22d3ee'][Math.floor(Math.random() * 5)]};
                left: ${centerX}px;
                top: ${centerY}px;
                pointer-events: none;
                z-index: 9999;
                transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                opacity: 1;
                box-shadow: 0 0 6px currentColor;
            `;
            
            document.body.appendChild(sparkle);
            
            requestAnimationFrame(() => {
                sparkle.style.left = centerX + Math.cos(angle) * distance + 'px';
                sparkle.style.top = centerY + Math.sin(angle) * distance + 'px';
                sparkle.style.opacity = '0';
                sparkle.style.transform = 'scale(0)';
            });
            
            setTimeout(() => sparkle.remove(), 800);
        }
    }
}

// ===========================
// Smooth Page Transition
// ===========================
class PageTransition {
    constructor() {
        // Add a subtle page load transition
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        window.addEventListener('load', () => {
            requestAnimationFrame(() => {
                document.body.style.opacity = '1';
            });
        });
    }
}

// ===========================
// Discord Status (Lanyard API)
// ===========================
class DiscordStatus {
    constructor() {
        this.DISCORD_USER_ID = '394469439606882305';
        this.API_URL = `https://api.lanyard.rest/v1/users/${this.DISCORD_USER_ID}`;
        this.UPDATE_INTERVAL = 30000; // 30 seconds

        this.statusIndicator = document.getElementById('discord-status-indicator');
        this.statusText = document.getElementById('discord-status-text');
        this.statusBadge = document.getElementById('statusBadge');

        if (!this.statusIndicator || !this.statusText) {
            console.warn('Discord status elements not found');
            return;
        }

        this.STATUS_MAP = {
            online: { text: 'Online', class: 'online' },
            dnd: { text: 'Không làm phiền', class: 'dnd' },
            idle: { text: 'AFK', class: 'idle' },
            offline: { text: 'Offline', class: 'offline' }
        };

        this.init();
    }

    updateStatusUI(status, isError = false) {
        if (isError) {
            this.statusText.textContent = 'Lỗi';
            this.statusText.classList.add('error');
            this.statusIndicator.className = 'status-indicator error';
            if (this.statusBadge) {
                this.statusBadge.className = 'status-badge';
            }
            return;
        }

        const statusInfo = this.STATUS_MAP[status] || this.STATUS_MAP.offline;
        this.statusText.textContent = statusInfo.text;
        this.statusText.classList.remove('error');
        this.statusIndicator.className = `status-indicator ${statusInfo.class}`;
        
        // Update badge style to match status
        if (this.statusBadge) {
            this.statusBadge.className = `status-badge ${statusInfo.class}`;
        }
    }

    async fetchDiscordStatus() {
        try {
            const response = await fetch(this.API_URL, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                const discordStatus = data.data.discord_status;
                this.updateStatusUI(discordStatus);
            } else {
                throw new Error('Invalid API response data');
            }
        } catch (error) {
            console.error('Failed to fetch Discord status:', error);
            this.updateStatusUI(null, true);
        }
    }

    init() {
        // Initial fetch
        this.fetchDiscordStatus();

        // Periodic updates
        setInterval(() => this.fetchDiscordStatus(), this.UPDATE_INTERVAL);

        // Update on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.fetchDiscordStatus();
            }
        });
    }
}

// ===========================
// Initialize Everything
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    new PageTransition();
    new ParticleSystem(document.getElementById('particles'));
    new CursorGlow();
    new StatsCounter();
    new LinkCards();
    new TypingEffect();
    new ScrollReveal();
    new KonamiCode();
    new AvatarEffect();
    new DiscordStatus();

    // Log a fun message
    console.log(
        '%c🍉 Biolink by Watermeloz',
        'background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; padding: 10px 20px; font-size: 16px; font-weight: bold; border-radius: 8px;'
    );
});
