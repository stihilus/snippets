let snippets = [];
let currentPage = 1;
const snippetsPerPage = 3;

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

// Function to handle login
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
            fetchSnippets();
        } else {
            alert('Login failed. Please check your credentials.');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle registration
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

// Function to handle logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserStatus();
    fetchSnippets();
}

// Function to open a modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Function to close a modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Event listeners for login and register buttons
document.getElementById('login-button').addEventListener('click', () => openModal('login-modal'));
document.getElementById('register-button').addEventListener('click', () => openModal('register-modal'));
document.getElementById('logout-button').addEventListener('click', logout);

// Event listeners for login and register forms
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

// Close modal when clicking on the close button or outside the modal
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.onclick = function() {
        this.closest('.modal').style.display = 'none';
    };
});

// Initial user status update
updateUserStatus();

// Function to get username from URL
function getUsernameFromURL() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

// Function to fetch snippets for the user
function fetchUserSnippets() {
    const username = getUsernameFromURL();
    fetch(`/api/snippets/${username}`)
        .then(response => response.json())
        .then(data => {
            snippets = data;
            renderSnippets();
        })
        .catch(error => console.error('Error:', error));
}

// Function to render snippets
function renderSnippets() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    
    // Add title at the top of the feed
    const username = getUsernameFromURL();
    const titleElement = document.createElement('h2');
    titleElement.textContent = `Snippets by ${username}`;
    titleElement.className = 'user-feed-title';
    feed.appendChild(titleElement);
    
    const startIndex = (currentPage - 1) * snippetsPerPage;
    const endIndex = startIndex + snippetsPerPage;
    const snippetsToRender = snippets.slice(startIndex, endIndex);
    
    snippetsToRender.forEach(snippet => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.id = `snippet-${snippet.id}`;

        // Add username and title at the top
        const usernameElement = document.createElement('a');
        usernameElement.className = 'snippet-username';
        usernameElement.textContent = `${snippet.username} - ${snippet.title}`;
        usernameElement.href = `/user/${snippet.username}`;
        gridItem.appendChild(usernameElement);

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        canvasContainer.id = `canvas-${snippet.id}`;
        gridItem.appendChild(canvasContainer);

        // Display image instead of canvas initially
        if (snippet.imagePath) {
            const img = document.createElement('img');
            img.src = snippet.imagePath;
            img.alt = snippet.title;
            img.className = 'snippet-image';
            img.addEventListener('click', () => showCanvas(snippet.id, snippet.code, canvasContainer));
            canvasContainer.appendChild(img);
        }

        const codeElement = document.createElement('pre');
        codeElement.textContent = snippet.code;
        gridItem.appendChild(codeElement);

        const snippetControls = document.createElement('div');
        snippetControls.className = 'snippet-controls';

        // Add character count
        const charCount = snippet.code.length;
        const { category, tooltip } = getCharacterCountCategory(charCount);
        const charCountElement = document.createElement('div');
        charCountElement.className = `character-count ${category}`;
        charCountElement.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} ${charCount}c`;
        charCountElement.title = tooltip;
        snippetControls.appendChild(charCountElement);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Copy Code';
        copyButton.addEventListener('click', () => copyCode(snippet.code, copyButton));
        buttonContainer.appendChild(copyButton);

        // Add refresh button
        const refreshButton = document.createElement('button');
        refreshButton.className = 'refresh-button';
        refreshButton.textContent = 'Run';
        refreshButton.addEventListener('click', () => refreshCanvas(snippet.id, snippet.code));
        buttonContainer.appendChild(refreshButton);

        // Add like button
        const likeButton = document.createElement('button');
        likeButton.className = 'like-button';
        likeButton.classList.toggle('liked', snippet.likedBy.includes(currentUser?.username));
        updateLikeButton(likeButton, snippet.likes);
        likeButton.addEventListener('click', () => handleLike(snippet.id, likeButton));
        buttonContainer.appendChild(likeButton);

        snippetControls.appendChild(buttonContainer);

        gridItem.appendChild(snippetControls);

        feed.appendChild(gridItem);
    });

    renderPagination();
}

// Function to show the canvas
function showCanvas(snippetId, code, container) {
    container.innerHTML = ''; // Clear the container
    new p5(createSketch(code), container); // Load the canvas
}

// Function to create a p5.js sketch from user code
function createSketch(userCode) {
    return function(p) {
        let canvas;

        // Compile user code
        let userSetup, userDraw;
        try {
            const sketchCode = new Function('p', `
                with (p) {
                    ${userCode}
                }
                return { setup, draw };
            `);
            const userFunctions = sketchCode(p);
            userSetup = userFunctions.setup;
            userDraw = userFunctions.draw;
        } catch (error) {
            console.error('Error compiling user code:', error);
        }

        // Setup function
        p.setup = function() {
            const container = p.select('.canvas-container').elt;
            const canvasWidth = container.offsetWidth;
            const canvasHeight = container.offsetHeight;
            canvas = p.createCanvas(canvasWidth, canvasHeight);

            p.windowWidth = canvasWidth;
            p.windowHeight = canvasHeight;

            if (typeof userSetup === 'function') {
                userSetup.call(p);
            }

            canvas.style('width', '100%');
            canvas.style('height', '100%');
        };

        // Draw function
        p.draw = function() {
            try {
                if (typeof userDraw === 'function') {
                    userDraw.call(p);
                }
            } catch (error) {
                console.error('Error in draw function:', error);
                p.background(255, 0, 0);
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Error in sketch', p.width/2, p.height/2);
            }
        };

        // Handle window resizing
        p.windowResized = function() {
            const container = p.select('.canvas-container').elt;
            const canvasWidth = container.offsetWidth;
            const canvasHeight = container.offsetHeight;
            p.resizeCanvas(canvasWidth, canvasHeight);
            p.windowWidth = canvasWidth;
            p.windowHeight = canvasHeight;
        };
    };
}

// Function to copy code to clipboard
function copyCode(code, button) {
    navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy Code';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code: ', err);
        button.textContent = 'Failed to copy';
        setTimeout(() => {
            button.textContent = 'Copy Code';
        }, 2000);
    });
}

// Function to refresh a specific canvas
function refreshCanvas(snippetId, code) {
    const canvasContainer = document.getElementById(`canvas-${snippetId}`);
    canvasContainer.innerHTML = '';
    new p5(createSketch(code), `canvas-${snippetId}`);
}

// Function to render pagination controls
function renderPagination() {
    const totalPages = Math.ceil(snippets.length / snippetsPerPage);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = `
        <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>
        <span>${currentPage} of ${totalPages}</span>
        <button id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>
    `;

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderSnippets();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderSnippets();
        }
    });
}

function getCharacterCountCategory(count) {
    if (count <= 256) return { category: 'tiny', tooltip: '0 - 256 characters' };
    if (count <= 512) return { category: 'short', tooltip: '256 - 512 characters' };
    if (count <= 1024) return { category: 'medium', tooltip: '512 - 1024 characters' };
    return { category: 'long', tooltip: '1024+ characters' };
}

// Function to handle likes
function handleLike(snippetId, likeButton) {
    if (!currentUser) {
        alert('Please login to like snippets.');
        return;
    }

    const isLiked = likeButton.classList.contains('liked');
    const endpoint = isLiked ? `/api/snippets/${snippetId}/unlike` : `/api/snippets/${snippetId}/like`;

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: currentUser.username }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            likeButton.classList.toggle('liked');
            updateLikeButton(likeButton, data.likes);
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to update the like button appearance
function updateLikeButton(button, likes) {
    const iconSrc = button.classList.contains('liked') ? '/assets/fullHeart.svg' : '/assets/emptyHeart.svg';
    button.innerHTML = likes > 0 ? `${likes} <img src="${iconSrc}" alt="Like">` : `<img src="${iconSrc}" alt="Like">`;
}

// Initial fetch of snippets
fetchUserSnippets();

// Check login status on page load
document.addEventListener('DOMContentLoaded', () => {
    updateUserStatus();
    fetchUserSnippets();
});