document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle logic
    const mobileBtn = document.querySelector('nav button');
    const navBar = document.querySelector('nav');

    // Smooth transition effect on navbar on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            navBar.classList.add('shadow-lg', 'bg-opacity-95');
            navBar.classList.remove('shadow-md', 'bg-opacity-100');
        } else {
            navBar.classList.add('shadow-md', 'bg-opacity-100');
            navBar.classList.remove('shadow-lg', 'bg-opacity-95');
        }
    });

    // Logging initialization
    console.log("TexBid Premium Interface Initialized.");
});
