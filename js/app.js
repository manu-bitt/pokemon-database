// Main app functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const typeNavLinks = document.querySelectorAll('.type-nav a');
    const mainNavLinks = document.querySelectorAll('.main-nav a');
    const sections = document.querySelectorAll('main > section');
    const modal = document.getElementById('detail-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const modalContent = document.getElementById('modal-content-container');

    // Main navigation functionality
    mainNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href').substring(1);
            
            // Show the correct section
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    // Type navigation functionality
    typeNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Make sure the pokemon section is active
            sections.forEach(section => {
                if (section.id === 'pokemon-section') {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
            
            // Update active link
            typeNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Filter Pokemon by selected type
            const selectedType = link.getAttribute('data-type');
            window.pokemonFunctions.filterByType(selectedType);
        });
    });

    // Modal functionality
    function openModal(content) {
        modalContent.innerHTML = content;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Enable scrolling
    }

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Expose utility functions to other scripts
    window.appUtils = {
        openModal,
        closeModal
    };
}); 