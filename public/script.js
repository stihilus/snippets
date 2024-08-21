// Array to store snippets
let snippets = JSON.parse(localStorage.getItem('snippets')) || [];
let currentPage = 1;
const snippetsPerPage = 3;

let currentUser = null;

// Function to create a snippet
function createSnippet(code) {
    if (!currentUser) {
        alert('Please login to post snippets.');
        return;
    }

    const snippet = {
        id: Date.now(),
        code: code,
        username: currentUser.username
    };

    fetch('/api/snippets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(snippet),
    })
    .then(response => response.json())
    .then(data => {
        snippets.unshift(data);
        currentPage = 1;
        renderSnippets();
    })
    .catch(error => console.error('Error:', error));
}

// Function to render snippets
function renderSnippets() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    
    const startIndex = (currentPage - 1) * snippetsPerPage;
    const endIndex = startIndex + snippetsPerPage;
    const snippetsToRender = snippets.slice(startIndex, endIndex);
    
    snippetsToRender.forEach(snippet => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.id = `snippet-${snippet.id}`;

        const usernameElement = document.createElement('a');
        usernameElement.className = 'snippet-username';
        usernameElement.textContent = snippet.username;
        usernameElement.href = `/user/${snippet.username}`;
        gridItem.appendChild(usernameElement);

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        canvasContainer.id = `canvas-${snippet.id}`;
        gridItem.appendChild(canvasContainer);

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
        refreshButton.textContent = 'Refresh';
        refreshButton.addEventListener('click', () => refreshCanvas(snippet.id, snippet.code));
        buttonContainer.appendChild(refreshButton);

        snippetControls.appendChild(buttonContainer);

        gridItem.appendChild(snippetControls);

        feed.appendChild(gridItem);

        // Create p5 instance for this snippet
        new p5(createSketch(snippet.code), `canvas-${snippet.id}`);
    });

    renderPagination();
}

// Function to copy code to clipboard
function copyCode(code, button) {
    navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy Code';
        }, 2000); // Reset button text after 2 seconds
    }).catch(err => {
        console.error('Failed to copy code: ', err);
        button.textContent = 'Failed to copy';
        setTimeout(() => {
            button.textContent = 'Copy Code';
        }, 2000); // Reset button text after 2 seconds
    });
}

// Function to refresh a specific canvas
function refreshCanvas(snippetId, code) {
    const canvasContainer = document.getElementById(`canvas-${snippetId}`);
    canvasContainer.innerHTML = ''; // Clear the existing canvas
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
            // Create a canvas that fits the container
            const container = p.select('.canvas-container').elt;
            const canvasWidth = container.offsetWidth;
            const canvasHeight = container.offsetHeight;
            canvas = p.createCanvas(canvasWidth, canvasHeight);

            // Scale the canvas to fit container dimensions
            p.windowWidth = canvasWidth;
            p.windowHeight = canvasHeight;

            // Call user's setup function if it exists
            if (typeof userSetup === 'function') {
                userSetup.call(p);
            }

            // Ensure the canvas fits within the container
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

// New function to show the preview modal
function showPreviewModal(code) {
    const modal = document.getElementById('preview-modal');
    const modalContent = document.getElementById('modal-content');
    
    // Clear previous content
    modalContent.innerHTML = '';
    
    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    canvasContainer.id = 'modal-canvas-container';
    modalContent.appendChild(canvasContainer);
    
    // Show the modal
    modal.style.display = 'block';
    
    // Create p5 instance for preview after a short delay
    setTimeout(() => {
        new p5(createSketch(code), 'modal-canvas-container');
    }, 100);
}

// Event listener for post button
document.getElementById('post-button').addEventListener('click', () => {
    const codeInput = document.getElementById('code-input');
    if (codeInput.value.trim() !== '') {
        showPreviewModal(codeInput.value);
    }
});

// Event listener for modal close button
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('preview-modal').style.display = 'none';
});

// Event listener for modal post button
document.getElementById('modal-post-button').addEventListener('click', () => {
    const codeInput = document.getElementById('code-input');
    if (codeInput.value.trim() !== '') {
        createSnippet(codeInput.value);
        codeInput.value = '';
        document.getElementById('preview-modal').style.display = 'none';
    }
});

// Initial render
renderSnippets();

function getCharacterCountCategory(count) {
    if (count <= 256) return { category: 'tiny : ', tooltip: '0 - 256 characters' };
    if (count <= 512) return { category: 'short : ', tooltip: '256 - 512 characters' };
    if (count <= 1024) return { category: 'medium : ', tooltip: '512 - 1024 characters' };
    return { category: 'long : ', tooltip: '1024+ characters' };
}

// Add this function to update the input character count
function updateInputCharCount() {
    const codeInput = document.getElementById('code-input');
    const charCountElement = document.getElementById('input-char-count');
    const charCount = codeInput.value.length;
    const { category, tooltip } = getCharacterCountCategory(charCount);
    
    charCountElement.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} ${charCount}c`;
    charCountElement.className = `character-count ${category}`;
    charCountElement.title = tooltip;
}

// Add this event listener after the initial render
document.getElementById('code-input').addEventListener('input', updateInputCharCount);

// Call this function once to initialize the counter
updateInputCharCount();

// Add this function to handle input focus
function handleInputFocus() {
    const codeInput = document.getElementById('code-input');
    codeInput.classList.add('expanded');
}

// Add this function to handle input blur
function handleInputBlur() {
    const codeInput = document.getElementById('code-input');
    if (codeInput.value.trim() === '') {
        codeInput.classList.remove('expanded');
    }
}

// Add these event listeners after the initial render
document.getElementById('code-input').addEventListener('focus', handleInputFocus);
document.getElementById('code-input').addEventListener('blur', handleInputBlur);

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
function register(username, password) {
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Registration successful. Please login.');
            closeModal('register-modal');
        } else {
            alert('Registration failed. Username may already exist.');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle logout
function logout() {
    currentUser = null;
    updateUserStatus();
    fetchSnippets();
}

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

// Function to fetch snippets from the server
function fetchSnippets() {
    fetch('/api/snippets')
    .then(response => response.json())
    .then(data => {
        snippets = data;
        renderSnippets();
    })
    .catch(error => console.error('Error:', error));
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
    const password = document.getElementById('register-password').value;
    register(username, password);
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

// Initial fetch of snippets and user status update
fetchSnippets();
updateUserStatus();