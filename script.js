import { userService } from './services/userService';
import { productService } from './services/productService';
import { rentalService } from './services/rentalService';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const searchInput = document.querySelector('.search-container input');
const productGrid = document.querySelector('.product-grid');
const trendingContainer = document.querySelector('.trending-container');

// Auth state observer
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user);

        try {
            // Update profile information
            const userName = document.querySelector('.user-info h1');
            const userEmail = document.querySelector('.user-info p');
            const userAvatar = document.querySelector('.avatar');
            const editProfileAvatar = document.getElementById('editProfileAvatar');

            // Set user name
            if (user.displayName) {
                userName.textContent = user.displayName;
                console.log('Setting user name:', user.displayName);
            } else {
                userName.textContent = 'User';
                console.log('No display name found, using default');
            }

            // Set user email
            if (user.email) {
                userEmail.textContent = user.email;
                console.log('Setting user email:', user.email);
            }

            // Set user avatar
            if (user.photoURL) {
                userAvatar.src = user.photoURL;
                editProfileAvatar.src = user.photoURL;
                console.log('Setting user photo:', user.photoURL);
            } else {
                const defaultAvatar = '—Pngtree—avatar icon profile icon member_5247852.png';
                userAvatar.src = defaultAvatar;
                editProfileAvatar.src = defaultAvatar;
                console.log('No photo URL found, using default avatar');
            }

            // Get additional user data from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('User data from Firestore:', userData);

                // Update phone number if available
                if (userData.phone) {
                    userEmail.textContent = `${userData.phone} • ${user.email}`;
                }

                // Update user stats
                const userStats = document.querySelector('.user-stats');
                if (userStats) {
                    const stats = userData.stats || {};
                    userStats.innerHTML = `
                        <div class="stat-item">
                            <i class="fas fa-box"></i> ${stats.rentals || 0} Rentals
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-star"></i> ${stats.rating || '0.0'} Rating
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-award"></i> ${stats.membership || 'Basic'} Member
                        </div>
                    `;
                }
            }

            // Add logout functionality
            const logoutButton = document.querySelector('.btn-outline[style*="color: var(--danger-color)"]');
            if (logoutButton) {
                logoutButton.addEventListener('click', async () => {
                    try {
                        await firebase.auth().signOut();
                        window.location.href = 'ui/index.html';
                    } catch (error) {
                        console.error('Error signing out:', error);
                    }
                });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    } else {
        // User is not signed in, redirect to login
        console.log('No user signed in, redirecting to login');
        window.location.href = 'ui/index.html';
    }
});

// Update UI for signed out user
function updateUIForSignedOutUser() {
    const loginButton = document.querySelector('.login-button');
    if (loginButton) {
        loginButton.textContent = 'Login';
        loginButton.onclick = showLoginModal;
    }
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    try {
        await userService.signIn(email, password);
        hideLoginModal();
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message);
    }
});

// Handle signup form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupForm.querySelector('input[type="email"]').value;
    const password = signupForm.querySelector('input[type="password"]').value;
    const fullName = signupForm.querySelector('input[type="text"]').value;

    try {
        await userService.signUp(email, password, fullName);
        hideLoginModal();
    } catch (error) {
        console.error('Signup error:', error);
        alert(error.message);
    }
});

// Handle forgot password form submission
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotPasswordForm.querySelector('input[type="email"]').value;

    try {
        await userService.resetPassword(email);
        alert('Password reset link has been sent to your email!');
        closeForgotPasswordModal();
    } catch (error) {
        console.error('Password reset error:', error);
        alert(error.message);
    }
});

// Handle Google sign in
document.querySelectorAll('.google-auth').forEach(button => {
    button.addEventListener('click', async () => {
        try {
            await userService.signInWithGoogle();
            hideLoginModal();
        } catch (error) {
            console.error('Google sign-in error:', error);
            alert(error.message);
        }
    });
});

// Load trending products
async function loadTrendingProducts() {
    try {
        const products = await productService.getTrendingProducts();
        displayTrendingProducts(products);
    } catch (error) {
        console.error('Error loading trending products:', error);
    }
}

// Display trending products
function displayTrendingProducts(products) {
    const trendingGrid = document.querySelector('.trending-grid');
    trendingGrid.innerHTML = products.map(product => `
    <div class="trending-card">
      <div class="trending-image">
        <img src="${product.imageUrl}" alt="${product.name}">
        <div class="trending-badge">Trending</div>
      </div>
      <div class="trending-info">
        <h3>${product.name}</h3>
        <div class="trending-stats">
          <span class="orders">${product.rentalCount}+ Orders</span>
          <span class="rating">⭐ ${product.rating || 4.5}</span>
        </div>
        <p class="trending-desc">${product.description}</p>
      </div>
    </div>
  `).join('');
}

// Load user's rentals
async function loadUserRentals(userId) {
    try {
        const rentals = await rentalService.getUserRentals(userId);
        // Update UI with user's rentals
        // This will depend on where you want to display the rentals
    } catch (error) {
        console.error('Error loading user rentals:', error);
    }
}

// Handle search
searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query.length >= 2) {
        try {
            const results = await productService.searchProducts(query);
            // Update UI with search results
            // This will depend on where you want to display the search results
        } catch (error) {
            console.error('Search error:', error);
        }
    }
});

// Initialize the app
async function initApp() {
    // Load trending products
    await loadTrendingProducts();

    // Add event listeners for product cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', async () => {
            const productId = card.dataset.productId;
            if (productId) {
                try {
                    const product = await productService.getProductById(productId);
                    showProductDetails(product);
                } catch (error) {
                    console.error('Error loading product details:', error);
                }
            }
        });
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Function to play click sound
function playClickSound() {
    const sound = document.getElementById('clickSound');
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.error('Error playing click sound:', error);
        });
    }
}

// Initialize skeleton loading
function initializeSkeletonLoading() {
    const skeleton = document.querySelector('.skeleton');
    if (skeleton) {
        skeleton.style.display = 'block';
        setTimeout(() => {
            skeleton.style.display = 'none';
        }, 2000); // Show skeleton for 2 seconds
    }
}

// Add click effects to all interactive elements
document.querySelectorAll('button, a, .clickable, .card, .bottom-nav img, .rent-now, .coins button, .dark-toggle, .switch, .slider').forEach(el => {
    el.addEventListener('click', (e) => {
        e.stopPropagation();
        const ripple = document.createElement('span');
        ripple.style.left = e.clientX - e.target.getBoundingClientRect().left + 'px';
        ripple.style.top = e.clientY - e.target.getBoundingClientRect().top + 'px';
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);

        // Prevent default action for links if needed
        if (el.tagName === 'A') {
            e.preventDefault();
        }

        playClickSound();

        // Visual effects
        el.classList.add('click-animate');
        setTimeout(() => el.classList.remove('click-animate'), 200);

        // Add specific effects for certain elements
        if (el.classList.contains('card') || el.classList.contains('bottom-nav')) {
            el.classList.add('pop-effect');
            setTimeout(() => el.classList.remove('pop-effect'), 300);

            // Trigger shine effect
            const shine = document.createElement('div');
            shine.classList.add('shine-overlay');
            el.appendChild(shine);
            setTimeout(() => shine.remove(), 500);
        }
    });
});

// Add click handler for dark mode toggle specifically
document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    playClickSound();
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Dark Mode Toggle
const toggle = document.getElementById('darkModeToggle');
toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    // Save preference to localStorage (optional)
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Set default mode
window.addEventListener('load', () => {
    document.body.classList.add('light-mode');
});

// Set initial mode (optional)
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    element.classList.remove('shine');
    void element.offsetWidth;
    element.classList.add('shine');
}

function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play().catch(err => {
        console.error('Error playing the click sound:', err);
    });
}

// Banner rotation
const bannerWrapper = document.querySelector(".banner-wrapper");
const banners = document.querySelectorAll(".banner-slide");
const totalBanners = banners.length;
let currentBanner = 0;

const backgrounds = [
    "banner-bg1.jpg",
    "banner-bg2.jpg",
    "banner-bg3.jpg",
    "banner-bg4.jpg"
];

// Banner rotation interval
setInterval(() => {
    currentBanner = (currentBanner + 1) % totalBanners;
    bannerWrapper.style.transform = `translateX(-${currentBanner * 100}%)`;
    document.body.style.backgroundImage = `url(${backgrounds[currentBanner]})`;
}, 4000);

// Add click effects to all clickable elements
document.querySelectorAll('.clickable, button, a, img').forEach(el => {
    el.addEventListener('click', () => {
        playClickSound();
        el.classList.add('click-animate');
        setTimeout(() => el.classList.remove('click-animate'), 200);
    });
});

// ...existing code...
const toggle = document.getElementById('darkModeToggle');
toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    // Save preference to localStorage (optional)
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Set initial mode (optional)
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');

    toggle.checked = true;
}
// ...existing code...
<script>
// Add this to your existing scripts
document.querySelectorAll('.card').forEach(card => {
    const quickView = document.createElement('div');
    quickView.className = 'quick-view';
    quickView.textContent = 'Quick View';
    card.appendChild(quickView);
    
    quickView.addEventListener('click', (e) => {
        e.stopPropagation();
        const modal = document.getElementById('quickViewModal');
        const img = card.querySelector('img').src;
        const title = card.querySelector('p strong').textContent;
        const price = card.querySelector('.price').textContent;
        const specs = card.querySelector('.specs').innerHTML;
        
        document.getElementById('modalImage').src = img;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalPrice').textContent = price;
        document.getElementById('modalSpecs').innerHTML = specs;
        
        modal.style.display = 'block';
    });
});

// Close modal
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('quickViewModal').style.display = 'none';
});
</script>

<script>
// Check for dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.style.background = 'linear-gradient(135deg, #1a1a1a, #2d3436)';
    document.querySelectorAll('.card').forEach(card => {
        card.style.background = '#2d3436';
        card.style.color = '#fff';
    });
}
</script>

<audio id="clickSound" src="mouse-click.mp3" preload="auto"></audio>
<script>
const clickSound = document.getElementById('clickSound');
document.querySelectorAll('.btn, .back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(err => console.error('Error playing sound:', err));
        }
    });
});
</script>

// Support button click handler
document.getElementById('supportLogo').addEventListener('click', () => {
    // Play click sound
    const clickSound = document.getElementById('clickSound');
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(err => console.error('Error playing sound:', err));
    }

    // Open chat in new window
    const chatWindow = window.open('chat.html', 'PackarooSupport',
        'width=400,height=600,resizable=yes,scrollbars=yes,status=yes');
});

// Support button click handler
document.getElementById('supportLogo').addEventListener('click', () => {
    const clickSound = document.getElementById('clickSound');
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(err => console.error('Error playing sound:', err));
    }

    // Open chat in new window
    window.open('chat.html', 'PackarooSupport',
        'width=400,height=600,resizable=yes,scrollbars=yes,status=yes');
});

<script>
    const swiper = new Swiper(".mySwiper", {
        effect: "fade",
    loop: true,
    autoplay: {
        delay: 3000,
    disableOnInteraction: false,
        },
    fadeEffect: {
        crossFade: true
        },
    pagination: {
        el: ".swiper-pagination",
    clickable: true
        },
    navigation: {
        nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
        }
    });
</script>

// Banner Slider
const swiper = new Swiper(".mySwiper", {
    effect: "fade",
    loop: true,
    autoplay: {
        delay: 3000,      // Single click effect handler
        function addClickEffects(elements) {
    elements.forEach(el => {
        el.addEventListener('click', (e) => {
            playClickSound();
            addRippleEffect(e, el);
            addVisualEffects(el);
        });
    });
}

      // Initialize click effects
      addClickEffects(document.querySelectorAll('.clickable, button, a, img'));
disableOnInteraction: false,
  },
fadeEffect: {
    <script>
  // Support button click handler
        document.getElementById('.support-float  const swiper = new Swiper(".mySwiper", {
            effect: "fade",
        loop: true,
        autoplay: {
            delay: 3000,
        disableOnInteraction: false,
      },
        fadeEffect: {
            crossFade: true
      },
        pagination: {
            el: ".swiper-pagination",
        clickable: true
      },
        navigation: {
            nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      }
  });').addEventListener('click', () => {
      // Play click sound
      const clickSound = document.getElementById('clickSound');      // Single support button click handler
      document.querySelector('.support-float').addEventListener('click', () => {
            playClickSound();
        window.open('chat.html', 'PackarooSupport',
        'width=400,height=600,resizable=yes,scrollbars=yes,status=yes,location=no');
      });

        // Single dark mode toggle handler
        const darkModeToggle = document.getElementById('darkModeToggle');
      darkModeToggle.addEventListener('change', () => {
            playClickSound();
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
      });
        if (clickSound) {
            clickSound.currentTime = 0;
          clickSound.play().catch(err => console.error('Error playing sound:', err));
      }

        // Open chat.html in a new window
        const chatWindow = window.open('chat.html', 'PackarooSupport',
        'width=400,height=600,resizable=yes,scrollbars=yes,status=yes,location=no');
  });
    </script>
    crossFade: true
},
pagination: {
    el: ".swiper-pagination",
        clickable: true
},
navigation: {
    nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
  }
});

< !DOCTYPE html >
    <html lang="en">
        <head>
            <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Packaroo</title>
                    <link rel="stylesheet" href="styles.css">
                        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
                            <link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.min.css">
                            </head>
                            <body>
                                <!-- Splash Screen -->
                                <div id="splash-screen">
                                    <img src="Photoroom-20250429_234355.png" alt="Packaroo Logo">
                                </div>

                                <!-- Search Bar -->
                                <div class="search-container">
                                    <input type="text" placeholder="Search...">
                                        <button class="clickable"><img src="magnifying-glass.png" alt="Search"></button>
                                </div>

                                <!-- Header -->
                                <header>
                                    <div class="logo">
                                        <img src="Photoroom-20250429_234355.png" alt="Packaroo Logo">
                                    </div>
                                    <div class="dark-toggle">
                                        <div class="toggle-icons">
                                            <img class="moon-icon" src="half-moon.png" alt="Dark Mode">
                                                <img class="sun-icon" src="sun.png" alt="Light Mode">
                                                </div>
                                                <label class="switch">
                                                    <input id="darkModeToggle" type="checkbox">
                                                        <span class="slider"></span>
                                                </label>
                                        </div>
                                </header>

                                <!-- Banner Section -->
                                <section class="banner-container swiper mySwiper">
                                    <!-- Banner slides here -->
                                </section>

                                <!-- Product Grid -->
                                <section class="products">
                                    <h3>Best Deals on Tech & Fashion</h3>
                                    <div class="product-grid">
                                        <!-- Product cards here -->
                                    </div>
                                </section>

                                <!-- Navigation -->
                                <nav>
                                    <a href="#" class="clickable">drones</a>
                                    <a href="#" class="clickable">cameras</a>
                                    <a href="#" class="clickable">accessories</a>
                                    <a href="#" class="clickable">tools</a>
                                    <a href="#" class="clickable">clothes</a>
                                </nav>

                                <!-- Bottom Navigation -->
                                <footer class="bottom-nav">
                                    <!-- Navigation icons here -->
                                </footer>

                                <!-- Support Button -->
                                <div id="supportLogo" class="support-float clickable">
                                    <img src="a-modern-3d-customer-support-icon-featur__UF6edupQw-AcGctMzo8TA_xQhADY0jSK-YQhJxqbYy1w.png" alt="Support">
                                </div>

                                <!-- Social Icons -->
                                <div class="support-icons">
                                    <a href="https://wa.me/917004347593" target="_blank" class="support-icon whatsapp-icon">
                                        <img src="https://img.icons8.com/fluency/48/000000/whatsapp.png" alt="WhatsApp">
                                    </a>
                                    <a href="https://www.instagram.com/packa.roo" target="_blank" class="support-icon instagram-icon">
                                        <img src="https://img.icons8.com/fluency/48/000000/instagram-new.png" alt="Instagram">
                                    </a>
                                </div>

                                <!-- Scripts -->
                                <audio id="clickSound" src="mouse-click.mp3" preload="auto"></audio>
                                <script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>
                                <script src="particles.js"></script>
                                <script src="script.js"></script>
                            </body>
                        </html>