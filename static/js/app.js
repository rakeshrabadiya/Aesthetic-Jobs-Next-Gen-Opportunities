/**
 * Aesthetic Job Board - Core Application Logic
 * Implements smooth DOM injections, hover tracking, and Modal Interactions
 */

const STORAGE_KEYS = {
    authUser: 'auth_user',
    applications: 'aj_applications'
};

const DEFAULT_JOBS = [
    { id: 1, title: "Senior Frontend Engineer", company: "Nexus Corp", location: "Remote", salary: "$130k - $160k", tags: ["React", "TypeScript", "UI/UX"], description: "We are looking for an experienced Frontend Engineer to lead the development of our next-gen aesthetic web platforms. You will work closely with design teams to implement pixel-perfect, highly animated user interfaces.", requirements: ["5+ years React/Next.js", "Strong grasp of CSS animations and motion", "Experience with WebGL is a plus"] },
    { id: 2, title: "Backend Systems Architect", company: "Aether Data", location: "New York, NY", salary: "$150k - $180k", tags: ["Python", "Golang", "Distributed Systems"], description: "Aether Data is seeking a Backend Architect to design scalable distributed systems that handle millions of requests per second with ultra-low latency.", requirements: ["8+ years backend engineering", "Deep knowledge of microservices and Kubernetes", "Expertise in Python or Go"] },
    { id: 3, title: "UI/UX Designer", company: "Zenith Studios", location: "San Francisco, CA", salary: "$110k - $140k", tags: ["Figma", "Interaction Design", "Prototyping"], description: "Join Zenith Studios to craft beautiful, intuitive, and mesmerizing digital experiences. We focus heavily on micro-interactions and dark-mode aesthetic mastery.", requirements: ["Portfolio demonstrating strong dark aesthetic", "Expertise in Figma constraints and variables", "Understanding of frontend feasibility"] },
    { id: 4, title: "Full Stack Developer", company: "Quantum Innovations", location: "London, UK", salary: "£80k - £110k", tags: ["Vue.js", "Node.js", "PostgreSQL"], description: "Build end-to-end features for our quantum computing visualization platform. You will handle everything from database schema design to frontend state management.", requirements: ["Proficiency in Vue 3", "Strong Node.js/Express skills", "Database optimization experience"] },
    { id: 5, title: "Machine Learning Engineer", company: "Synapse AI", location: "Toronto, CA", salary: "$140k - $170k", tags: ["PyTorch", "TensorFlow", "NLP"], description: "Help us build the next generation of Large Language Models. You will be responsible for training, fine-tuning, and deploying models to production.", requirements: ["Ph.D. or MS in Computer Science/AI", "Experience with Transformer architectures", "Strong Python and C++"] },
    { id: 6, title: "DevOps Engineer", company: "CloudScape", location: "Remote", salary: "$120k - $150k", tags: ["AWS", "Terraform", "CI/CD"], description: "Ensure our infrastructure is robust, scalable, and secure. You'll automate our deployment pipelines and manage our multi-region AWS environments.", requirements: ["AWS Certified Solutions Architect", "Strong Terraform knowledge", "Experience with GitHub Actions"] },
    { id: 7, title: "Product Manager", company: "Visionary Labs", location: "Austin, TX", salary: "$135k - $165k", tags: ["Agile", "Strategy", "User Research"], description: "Drive the vision and roadmap for our flagship SaaS product. Bridge the gap between engineering, design, and our enterprise clients.", requirements: ["4+ years Product Management", "Experience in B2B SaaS", "Data-driven decision making"] },
    { id: 8, title: "Animatior & Motion Designer", company: "Fluid Dynamics", location: "Berlin, DE", salary: "€70k - €95k", tags: ["After Effects", "Lottie", "CSS"], description: "Bring our applications to life. We need someone obsessed with easing curves, timing, and making digital interfaces feel organic and alive.", requirements: ["Mastery of After Effects", "Experience converting animations to code (Lottie/Rive)", "An obsessive eye for detail"] }
];

function getStoredData(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function setStoredData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

document.addEventListener('DOMContentLoaded', () => {
    const jobsContainer = document.getElementById('jobs-container');
    const searchInput = document.querySelector('.search-input');
    const filterChips = document.querySelectorAll('.filter-chip');
    
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
    let isAuthenticated = localStorage.getItem(STORAGE_KEYS.authUser) ? true : false;

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
                    localStorage.removeItem(STORAGE_KEYS.authUser);
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
                
                const applications = getStoredData(STORAGE_KEYS.applications);
                applications.push({
                    ...payload,
                    created_at: new Date().toISOString()
                });
                setStoredData(STORAGE_KEYS.applications, applications);
                showSuccessMessage('apply');

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
                await new Promise(r => setTimeout(r, 700));
                const displayName = payload.email.split('@')[0].trim();
                if (!displayName) {
                    alert('Error: Invalid email address');
                    resetSubmitButton('login');
                    return;
                }
                isAuthenticated = true;
                localStorage.setItem(STORAGE_KEYS.authUser, displayName.charAt(0).toUpperCase() + displayName.slice(1));
                
                // Show success state in modal
                if (authUserName) authUserName.innerText = localStorage.getItem(STORAGE_KEYS.authUser);
                showSuccessMessage('login');
                
                // Update main UI buttons, close modal automatically after delay
                setTimeout(() => {
                    updateAuthUI();
                    closeLoginModal();
                }, 1500);

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
            allJobs = [...DEFAULT_JOBS];
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
