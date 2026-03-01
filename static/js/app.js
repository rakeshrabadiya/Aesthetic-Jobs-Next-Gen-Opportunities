/**
 * Aesthetic Job Board - Core Application Logic
 * Implements smooth DOM injections, hover tracking, and Modal Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    const jobsContainer = document.getElementById('jobs-container');
    const searchInput = document.querySelector('.search-input');
    const filterChips = document.querySelectorAll('.filter-chip');
    
    // Modal Elements
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
    
    let allJobs = [];
    let currentJob = null;

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

    // Modal Global Listeners
    if(modalClose) modalClose.addEventListener('click', closeModal);
    if(btnStartApply) btnStartApply.addEventListener('click', () => switchModalView('apply'));
    if(btnBackDetails) btnBackDetails.addEventListener('click', () => switchModalView('details'));
    if(btnCloseSuccess) btnCloseSuccess.addEventListener('click', closeModal);
    
    if(modal) {
        // Close modal if clicking overlay background
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
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
                    showSuccessMessage();
                } else {
                    alert('Error: ' + data.message);
                    resetSubmitButton();
                }

            } catch (error) {
                console.error("Submission error", error);
                alert("Failed to submit application. Please try again.");
                resetSubmitButton();
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

            // Mouse tracking for hover effect glow
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
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

    function resetSubmitButton() {
        btnSubmitApply.disabled = false;
        btnSubmitApply.querySelector('span').style.display = 'inline';
        btnSubmitApply.querySelector('.spinner-small').style.display = 'none';
    }

    function showSuccessMessage() {
        applyForm.style.display = 'none';
        applySuccessMsg.style.display = 'block';
    }

    // =========================================
    // Aesthetic Interactions
    // =========================================
    function setupMouseTracking() {
        const blobs = document.querySelectorAll('.blob');
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;
            blobs.forEach((blob, index) => {
                const speed = (index + 1) * 20;
                blob.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
            });
        });
    }
});
