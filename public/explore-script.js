let snippets = [];
let currentPage = 1;
const snippetsPerPage = 40; // Increased from 20 to 40 (5 rows of 8 images)
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Function to update user status display
function updateUserStatus() {
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');
    const usernameDisplay = document.getElementById('username-display');

    if (currentUser) {
        loginButton.style.display = 'none';
        registerButton.style.display = 'none';
        logoutButton.style.display = 'inline-block';
        usernameDisplay.textContent = `Welcome, ${currentUser.username}!`;
    } else {
        loginButton.style.display = 'inline-block';
        registerButton.style.display = 'inline-block';
        logoutButton.style.display = 'none';
        usernameDisplay.textContent = '';
    }
}

// Function to fetch snippets
function fetchSnippets() {
    fetch('/api/snippets')
        .then(response => response.json())
        .then(data => {
            snippets = data;
            renderSnippets();
            renderPagination();
        })
        .catch(error => console.error('Error:', error));
}

// Function to render snippets in a grid
function renderSnippets() {
    const exploreGrid = document.getElementById('explore-grid');
    exploreGrid.innerHTML = '';
    
    const startIndex = (currentPage - 1) * snippetsPerPage;
    const endIndex = startIndex + snippetsPerPage;
    const snippetsToRender = snippets.slice(startIndex, endIndex);
    
    snippetsToRender.forEach(snippet => {
        const gridItem = document.createElement('div');
        gridItem.className = 'explore-grid-item';

        const snippetLink = document.createElement('a');
        snippetLink.href = `/snippet/${snippet.id}`;
        
        if (snippet.imagePath) {
            const img = document.createElement('img');
            img.src = snippet.imagePath;
            img.alt = snippet.title;
            img.className = 'explore-snippet-image';
            snippetLink.appendChild(img);
        }

        gridItem.appendChild(snippetLink);
        exploreGrid.appendChild(gridItem);
    });
}

// Function to render pagination
function renderPagination() {
    const totalPages = Math.ceil(snippets.length / snippetsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.onclick = () => {
            currentPage--;
            renderSnippets();
            renderPagination();
            window.scrollTo(0, 0);
        };
        pagination.appendChild(prevButton);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.onclick = () => {
            currentPage++;
            renderSnippets();
            renderPagination();
            window.scrollTo(0, 0);
        };
        pagination.appendChild(nextButton);
    }
}

// Add these styles to your style.css file
const styles = `
.explore-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 10px;
    padding: 20px;
    max-width: 100%;
    margin: 0 auto;
}

.explore-grid-item {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    background: #1a1a1a;
    transition: transform 0.2s;
    width: 100%;
}

.explore-grid-item:hover {
    transform: scale(1.02);
}

.explore-snippet-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

h1 {
    text-align: center;
    margin: 2rem 0;
    color: #EB5A29;
}

@media (max-width: 1600px) {
    .explore-grid {
        grid-template-columns: repeat(6, 1fr);
    }
}

@media (max-width: 1200px) {
    .explore-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        padding: 15px;
    }
}

@media (max-width: 480px) {
    .explore-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding: 8px;
    }
}
`;

// Authentication related functions
function login(username, password) {
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = { username: data.username };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserStatus();
            closeModal('login-modal');
        } else {
            alert('Login failed. Please check your credentials.');
        }
    })
    .catch(error => console.error('Error:', error));
}

function register(username, email, password) {
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Registration successful. Please login.');
            closeModal('register-modal');
        } else {
            alert('Registration failed. Username or email may already exist.');
        }
    })
    .catch(error => console.error('Error:', error));
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserStatus();
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Event listeners
document.getElementById('login-button').addEventListener('click', () => openModal('login-modal'));
document.getElementById('register-button').addEventListener('click', () => openModal('register-modal'));
document.getElementById('logout-button').addEventListener('click', logout);

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    login(username, password);
});

document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    register(username, email, password);
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
};

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.onclick = function() {
        this.parentElement.parentElement.style.display = 'none';
    };
});

// Initialize
fetchSnippets();
updateUserStatus();

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);