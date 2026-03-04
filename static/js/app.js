/**
 * Aesthetic Job Board - Core Application Logic
 * Implements smooth DOM injections, hover tracking, and Modal Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    const jobsContainer = document.getElementById('jobs-container');
    const searchInput = document.querySelector('.search-input');
    const filterChips = document.querySelectorAll('.filter-chip');
    
    // loader elements
    const loaderOverlay = document.getElementById('loader-overlay');

    if (loaderOverlay) {
        window.addEventListener('load', () => {
            setTimeout(() => loaderOverlay.classList.add('hidden'), 800);
        });
        setTimeout(() => loaderOverlay.classList.add('hidden'), 2500);
    }

    // Apply Form Modal Elements
    const modal = document.getElementById('job-modal');
    const modalClose = document.getElementById('modal-close');
    const viewDetails = document.getElementById('modal-view-details');
    const viewApply = document.getElementById('modal-view-apply');
    const btnStartApply = document.getElementById('btn-start-apply');
    const btnBackDetails = document.getElementById('btn-back-details');
    const applyForm = document.getElementById('apply-form');
    const btnSubmitApply = document.getElementById('btn-submit-apply');
    const applySuccessMsg = document.getElementById('apply-success-msg');
    const btnCloseSuccess = document.getElementById('btn-close-success');
    
    // Login Modal Elements
    const loginBtns = document.querySelectorAll('.login-btn');
    const loginModal = document.getElementById('login-modal');
    const loginModalClose = document.getElementById('login-modal-close');
    const loginForm = document.getElementById('login-form');
    const loginViewForm = document.getElementById('login-view-form');
    const loginViewSuccess = document.getElementById('login-view-success');
    const authUserName = document.getElementById('auth-user-name');
    const btnSubmitLogin = document.getElementById('btn-submit-login');
    
    // Global State
    let allJobs = [];
    let currentJob = null;
    let isAuthenticated = localStorage.getItem('auth_user') ? true : false;

    // Initialize UI Auth State on Load
    updateAuthUI();

    // Setup interactive background mouse tracking
    if(jobsContainer) setupMouseTracking();

    // Fetch jobs from backend if on jobs page
    if(jobsContainer) fetchJobs();

    // Search functionality
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterJobs(searchTerm, getActiveFilter());
        });
    }

    // Filter functionality
    if(filterChips) {
        filterChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                filterChips.forEach(c => c.classList.remove('active'));
                const clickedChip = e.target;
                clickedChip.classList.add('active');
                if(searchInput) filterJobs(searchInput.value.toLowerCase(), clickedChip.innerText);
            });
        });
    }

    // Application Modal Global Listeners
    if(modalClose) modalClose.addEventListener('click', closeModal);
    if(btnStartApply) btnStartApply.addEventListener('click', () => switchModalView('apply'));
    if(btnBackDetails) btnBackDetails.addEventListener('click', () => switchModalView('details'));
    if(btnCloseSuccess) btnCloseSuccess.addEventListener('click', closeModal);
    
    if(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Login Modal Global Listeners
    if (loginBtns.length > 0) {
        loginBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (isAuthenticated) {
                    // Handle Sign Out
                    isAuthenticated = false;
                    localStorage.removeItem('auth_user');
                    updateAuthUI();
                } else {
                    openLoginModal();
                }
            });
        });
    }
    
    if (loginModalClose) loginModalClose.addEventListener('click', closeLoginModal);
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeLoginModal();
        });
    }

    // Handle Apply Form Submission
    if(applyForm) {
        applyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // UI Loading state
            btnSubmitApply.disabled = true;
            btnSubmitApply.querySelector('span').style.display = 'none';
            btnSubmitApply.querySelector('.spinner-small').style.display = 'inline-block';

            const payload = {
                job_id: document.getElementById('apply-job-id').value,
                name: document.getElementById('apply-name').value,
                email: document.getElementById('apply-email').value,
                portfolio: document.getElementById('apply-portfolio').value,
                cover_letter: document.getElementById('apply-cover').value
            };

            try {
                // Artificial delay for aesthetic A-curve loader
                await new Promise(r => setTimeout(r, 1000));
                
                const response = await fetch('/api/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    showSuccessMessage('apply');
                } else {
                    alert('Error: ' + data.message);
                    resetSubmitButton('apply');
                }

            } catch (error) {
                console.error("Submission error", error);
                alert("Failed to submit application. Please try again.");
                resetSubmitButton('apply');
            }
        });
    }

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            btnSubmitLogin.disabled = true;
            btnSubmitLogin.querySelector('span').style.display = 'none';
            btnSubmitLogin.querySelector('.spinner-small').style.display = 'inline-block';

            const payload = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            };

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    isAuthenticated = true;
                    localStorage.setItem('auth_user', data.user.name);
                    
                    // Show success state in modal
                    if (authUserName) authUserName.innerText = data.user.name;
                    showSuccessMessage('login');
                    
                    // Update main UI buttons, close modal automatically after delay
                    setTimeout(() => {
                        updateAuthUI();
                        closeLoginModal();
                    }, 1500);
                } else {
                    alert('Error: ' + data.message);
                    resetSubmitButton('login');
                }

            } catch (error) {
                console.error("Login error", error);
                alert("Failed to sign in. Please try again.");
                resetSubmitButton('login');
            }
        });
    }

    // =========================================
    // Core Functions
    // =========================================

    async function fetchJobs() {
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const response = await fetch('/api/jobs');
            if (!response.ok) throw new Error('Network response was not ok');
            allJobs = await response.json();
            renderJobs(allJobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            jobsContainer.innerHTML = `<div class="loading-state" style="color: #ef4444;"><p>Failed to load opportunities.</p></div>`;
        }
    }

    function renderJobs(jobs) {
        jobsContainer.innerHTML = '';
        if (jobs.length === 0) {
            jobsContainer.innerHTML = `<div class="loading-state"><p>No opportunities found.</p></div>`;
            return;
        }

        jobs.forEach((job, index) => {
            const card = document.createElement('div');
            card.className = 'job-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            const tagsHtml = job.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            
            card.innerHTML = `
                <div class="job-card-content">
                    <div class="job-header">
                        <div>
                            <h3 class="job-title">${job.title}</h3>
                            <p class="job-company">${job.company}</p>
                        </div>
                        <span class="job-salary">${job.salary}</span>
                    </div>
                    <div class="job-meta">
                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align: middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${job.location}</span>
                    </div>
                    <div class="job-tags">${tagsHtml}</div>
                </div>
            `;

            // Mouse tracking for hover effect glow - Throttled
            let cardTicking = false;
            card.addEventListener('mousemove', e => {
                if (!cardTicking) {
                    window.requestAnimationFrame(() => {
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        card.style.setProperty('--mouse-x', `${x}px`);
                        card.style.setProperty('--mouse-y', `${y}px`);
                        cardTicking = false;
                    });
                    cardTicking = true;
                }
            });

            // Open Modal on Card Click
            card.addEventListener('click', () => openModal(job));

            jobsContainer.appendChild(card);
            requestAnimationFrame(() => setTimeout(() => card.classList.add('visible'), index * 100));
        });
    }

    function filterJobs(searchTerm, filterType) {
        let filtered = allJobs;
        if (searchTerm) {
            filtered = filtered.filter(job => 
                job.title.toLowerCase().includes(searchTerm) || 
                job.company.toLowerCase().includes(searchTerm) ||
                job.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        if (filterType !== 'All Roles') {
            if (filterType === 'Remote') {
                 filtered = filtered.filter(job => job.location.toLowerCase().includes('remote'));
            } else {
                 filtered = filtered.filter(job => 
                    job.title.toLowerCase().includes(filterType.toLowerCase()) ||
                    job.tags.some(tag => tag.toLowerCase().includes(filterType.toLowerCase()))
                 );
            }
        }
        renderJobs(filtered);
    }

    function getActiveFilter() {
        const activeChip = Array.from(filterChips).find(chip => chip.classList.contains('active'));
        return activeChip ? activeChip.innerText : 'All Roles';
    }

    // =========================================
    // Modal & Application Logic
    // =========================================

    function openModal(job) {
        currentJob = job;
        
        // Populate Details View
        document.getElementById('modal-job-title').innerText = job.title;
        document.getElementById('modal-job-company').innerText = job.company;
        document.getElementById('modal-job-location').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align: middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${job.location}`;
        document.getElementById('modal-job-salary').innerText = job.salary;
        document.getElementById('modal-job-tags').innerHTML = job.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        document.getElementById('modal-job-description').innerText = job.description || "No description provided.";
        
        const reqList = document.getElementById('modal-job-requirements');
        reqList.innerHTML = '';
        if (job.requirements && job.requirements.length > 0) {
            job.requirements.forEach(req => {
                let li = document.createElement('li');
                li.innerText = req;
                reqList.appendChild(li);
            });
        }

        // Initialize Form view
        document.getElementById('apply-job-id').value = job.id;
        document.getElementById('apply-job-title-display').innerText = `${job.title} at ${job.company}`;
        
        // Reset sub-views
        switchModalView('details');
        applyForm.reset();
        applyForm.style.display = 'flex';
        applySuccessMsg.style.display = 'none';
        resetSubmitButton();

        // Show Modal Overlay
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent bg scroll
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // restore scroll
        currentJob = null;
    }

    function switchModalView(viewName) {
        if (viewName === 'details') {
            viewDetails.classList.add('active');
            viewApply.classList.remove('active');
        } else if (viewName === 'apply') {
            viewDetails.classList.remove('active');
            viewApply.classList.add('active');
        }
    }

    function resetSubmitButton(type) {
        if (type === 'apply') {
            btnSubmitApply.disabled = false;
            btnSubmitApply.querySelector('span').style.display = 'inline';
            btnSubmitApply.querySelector('.spinner-small').style.display = 'none';
        } else if (type === 'login') {
            btnSubmitLogin.disabled = false;
            btnSubmitLogin.querySelector('span').style.display = 'inline';
            btnSubmitLogin.querySelector('.spinner-small').style.display = 'none';
        }
    }

    function showSuccessMessage(type) {
        if (type === 'apply') {
            applyForm.style.display = 'none';
            applySuccessMsg.style.display = 'block';
        } else if (type === 'login') {
            loginViewForm.classList.remove('active');
            loginViewSuccess.classList.add('active');
        }
    }

    // no fun facts or scroll reveal per request

    // =========================================
    // Authentication Logic & UI
    // =========================================
    
    function updateAuthUI() {
        // Toggle all login buttons to say "Sign Out" if logged in
        if (loginBtns.length > 0) {
            loginBtns.forEach(btn => {
                if (isAuthenticated) {
                    btn.innerText = "Sign Out";
                    btn.style.background = "transparent";
                    btn.style.border = "1px solid var(--card-border)";
                    btn.style.color = "var(--text-secondary)";
                } else {
                    btn.innerText = "Sign In";
                    btn.style.background = "var(--btn-primary)";
                    btn.style.border = "none";
                    btn.style.color = "var(--btn-primary-text)";
                }
            });
        }
    }
    
    function openLoginModal() {
        if(!loginModal) return;
        
        // Reset state
        loginForm.reset();
        loginViewForm.classList.add('active');
        loginViewSuccess.classList.remove('active');
        resetSubmitButton('login');
        
        // Show
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeLoginModal() {
        if(!loginModal) return;
        loginModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // =========================================
    // Aesthetic Interactions
    // =========================================
    function setupMouseTracking() {
        const blobs = document.querySelectorAll('.blob');
        let ticking = false;
        
        document.addEventListener('mousemove', (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const mouseX = e.clientX / window.innerWidth - 0.5;
                    const mouseY = e.clientY / window.innerHeight - 0.5;
                    blobs.forEach((blob, index) => {
                        const speed = (index + 1) * 20;
                        blob.style.transform = `translate3d(${mouseX * speed}px, ${mouseY * speed}px, 0)`;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
});

// Initialize only the custom cursor and trail (no 3D scene)
document.addEventListener('DOMContentLoaded', () => {
    const cursorEl = document.getElementById('custom-cursor');
    const trailContainer = document.getElementById('cursor-trail');
    if (cursorEl) initCustomCursor(cursorEl, trailContainer);
});

function initCustomCursor(cursorEl, trailContainer) {
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let pos = { x: mouse.x, y: mouse.y };

    // Smooth follow
    function raf() {
        pos.x += (mouse.x - pos.x) * 0.18;
        pos.y += (mouse.y - pos.y) * 0.18;
        cursorEl.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        requestAnimationFrame(raf);
    }
    raf();

    // create trail particles
    const particles = [];
    function spawnParticle(x, y) {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = '8px';
        el.style.height = '8px';
        el.style.borderRadius = '50%';
        el.style.pointerEvents = 'none';
        el.style.background = 'rgba(168,85,247,0.18)';
        el.style.transform = 'translate3d(-50%,-50%,0) scale(1)';
        el.style.transition = 'opacity 520ms linear, transform 520ms cubic-bezier(.2,.8,.2,1)';
        trailContainer.appendChild(el);
        particles.push(el);

        requestAnimationFrame(() => {
            el.style.opacity = '0';
            el.style.transform = 'translate3d(-50%,-50%,0) scale(2)';
        });

        setTimeout(() => {
            el.remove();
        }, 600);
    }

    // mouse handlers
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        spawnParticle(e.clientX, e.clientY);
    }, { passive: true });

    // interactive element hover effect
    const interactive = Array.from(document.querySelectorAll('a, button, .job-card'));
    interactive.forEach(el => {
        el.addEventListener('mouseenter', () => cursorEl.classList.add('custom-cursor--active'));
        el.addEventListener('mouseleave', () => cursorEl.classList.remove('custom-cursor--active'));
    });
}
