// Script to handle navigation between sections
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation items
    const navItems = document.querySelectorAll('.nav-item');
    
    // Add click event listener to each navigation item
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Get the target section id from data-target attribute
            const targetSectionId = this.getAttribute('data-target');
            
            // Remove 'active' class from all nav items
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Add 'active' class to clicked nav item
            this.classList.add('active');
            
            // Hide all sections
            const sections = document.querySelectorAll('.app-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the target section
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // Initialize - make sure first tab is active by default
    const firstNavItem = document.querySelector('.nav-item');
    if (firstNavItem) {
        firstNavItem.click();
    }
});

// Function to handle mobile navigation toggle (if needed)
function toggleMobileMenu() {
    const navbarMenu = document.getElementById('navbar-menu');
    navbarMenu.classList.toggle('active');
}