// Initialize Firebase (replace with your config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
  
  // Global variables
  let currentUser = null;
  let snippets = [];
  let currentPage = 1;
  const snippetsPerPage = 3;
  
  // Function to register a new user
  async function registerUser(email, password, username) {
    try {
      const response = await fetch('https://your-render-app.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username })
      });
      if (!response.ok) throw new Error('Registration failed');
      alert('Registration successful! Please log in.');
    } catch (error) {
      console.error('Error registering user:', error);
      alert(error.message);
    }
  }
  
  // Function to log in a user
  async function loginUser(email, password) {
    try {
      const response = await fetch('https://your-render-app.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) throw new Error('Login failed');
      const userData = await response.json();
      currentUser = { uid: userData.uid, username: userData.username };
      updateUI();
      fetchSnippets();
    } catch (error) {
      console.error('Error logging in:', error);
      alert(error.message);
    }
  }
  
  // Function to log out a user
  function logoutUser() {
    currentUser = null;
    updateUI();
    fetchSnippets();
  }
  
  // Function to create a snippet
  async function createSnippet(code) {
    if (!currentUser) {
      alert('Please log in to post a snippet');
      return;
    }
    try {
      const response = await fetch('https://your-render-app.onrender.com/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid, code })
      });
      if (!response.ok) throw new Error('Failed to create snippet');
      fetchSnippets();
    } catch (error) {
      console.error('Error creating snippet:', error);
      alert(error.message);
    }
  }
  
  // Function to fetch snippets
  async function fetchSnippets() {
    try {
      const response = await fetch('https://your-render-app.onrender.com/snippets');
      if (!response.ok) throw new Error('Failed to fetch snippets');
      snippets = await response.json();
      renderSnippets();
    } catch (error) {
      console.error('Error fetching snippets:', error);
      alert(error.message);
    }
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
  
      const usernameElement = document.createElement('div');
      usernameElement.className = 'snippet-username';
      usernameElement.textContent = snippet.username;
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
  
      const charCount = snippet.code.length;
      const { category, tooltip } = getCharacterCountCategory(charCount);
      const charCountElement = document.createElement('div');
      charCountElement.className = `character-count ${category}`;
      charCountElement.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} ${charCount}c`;
      charCountElement.title = tooltip;
      snippetControls.appendChild(charCountElement);
  
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';
  
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.textContent = 'Copy Code';
      copyButton.addEventListener('click', () => copyCode(snippet.code, copyButton));
      buttonContainer.appendChild(copyButton);
  
      const refreshButton = document.createElement('button');
      refreshButton.className = 'refresh-button';
      refreshButton.textContent = 'Refresh';
      refreshButton.addEventListener('click', () => refreshCanvas(snippet.id, snippet.code));
      buttonContainer.appendChild(refreshButton);
  
      snippetControls.appendChild(buttonContainer);
  
      gridItem.appendChild(snippetControls);
  
      feed.appendChild(gridItem);
  
      new p5(createSketch(snippet.code), `canvas-${snippet.id}`);
    });
  
    renderPagination();
  }
  
  // Function to update UI based on user state
  function updateUI() {
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    const usernameSpan = document.getElementById('username');
    const postButton = document.getElementById('post-button');
  
    if (currentUser) {
      loginSection.style.display = 'none';
      userSection.style.display = 'block';
      usernameSpan.textContent = currentUser.username;
      postButton.disabled = false;
    } else {
      loginSection.style.display = 'block';
      userSection.style.display = 'none';
      postButton.disabled = true;
    }
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
  
  // Function to show the preview modal
  function showPreviewModal(code) {
    const modal = document.getElementById('preview-modal');
    const modalContent = document.getElementById('modal-content');
    
    modalContent.innerHTML = '';
    
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    canvasContainer.id = 'modal-canvas-container';
    modalContent.appendChild(canvasContainer);
    
    modal.style.display = 'block';
    
    setTimeout(() => {
      new p5(createSketch(code), 'modal-canvas-container');
    }, 100);
  }
  
  // Function to get character count category
  function getCharacterCountCategory(count) {
    if (count <= 256) return { category: 'tiny', tooltip: '0 - 256 characters' };
    if (count <= 512) return { category: 'short', tooltip: '256 - 512 characters' };
    if (count <= 1024) return { category: 'medium', tooltip: '512 - 1024 characters' };
    return { category: 'long', tooltip: '1024+ characters' };
  }
  
  // Function to update input character count
  function updateInputCharCount() {
    const codeInput = document.getElementById('code-input');
    const charCountElement = document.getElementById('input-char-count');
    const charCount = codeInput.value.length;
    const { category, tooltip } = getCharacterCountCategory(charCount);
    
    charCountElement.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} ${charCount}c`;
    charCountElement.className = `character-count ${category}`;
    charCountElement.title = tooltip;
  }
  
  // Function to handle input focus
  function handleInputFocus() {
    const codeInput = document.getElementById('code-input');
    codeInput.classList.add('expanded');
  }
  
  // Function to handle input blur
  function handleInputBlur() {
    const codeInput = document.getElementById('code-input');
    if (codeInput.value.trim() === '') {
      codeInput.classList.remove('expanded');
    }
  }
  
  // Event listeners
  document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const username = document.getElementById('register-username').value;
    registerUser(email, password, username);
  });
  
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    loginUser(email, password);
  });
  
  document.getElementById('logout-button').addEventListener('click', logoutUser);
  
  document.getElementById('post-button').addEventListener('click', () => {
    const codeInput = document.getElementById('code-input');
    if (codeInput.value.trim() !== '') {
      showPreviewModal(codeInput.value);
    }
  });
  
  document.getElementById('modal-post-button').addEventListener('click', () => {
    const codeInput = document.getElementById('code-input');
    if (codeInput.value.trim() !== '') {
      createSnippet(codeInput.value);
      codeInput.value = '';
      document.getElementById('preview-modal').style.display = 'none';
    }
  });
  
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('preview-modal').style.display = 'none';
  });
  
  document.getElementById('code-input').addEventListener('input', updateInputCharCount);
  document.getElementById('code-input').addEventListener('focus', handleInputFocus);
  document.getElementById('code-input').addEventListener('blur', handleInputBlur);
  
  // Initial setup
  updateUI();
  fetchSnippets();
  updateInputCharCount();