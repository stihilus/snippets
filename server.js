require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const multer = require('multer');
const fs = require('fs');

app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB successfully');
});

// Define User model
const User = mongoose.model('User', {
    username: String,
    email: String,
    password: String
});

// Define Snippet model
const Snippet = mongoose.model('Snippet', {
    id: Number,
    code: String,
    username: String,
    title: String,
    likes: { type: Number, default: 0 },
    likedBy: [String],
    imagePath: String
});

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
});

const upload = multer({ storage: storage });

// Register route
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.json({ success: false, message: 'Username or email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid password' });
        }
        res.json({ success: true, username: user.username });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create snippet route
app.post('/api/snippets', upload.single('image'), async (req, res) => {
    try {
        const newSnippet = new Snippet({
            ...JSON.parse(req.body.snippet),
            title: JSON.parse(req.body.snippet).title || 'Untitled',
            imagePath: req.file ? `/uploads/${req.file.filename}` : null
        });
        await newSnippet.save();
        res.json(newSnippet);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get snippets route
app.get('/api/snippets', async (req, res) => {
    try {
        const snippets = await Snippet.find().sort({ id: -1 });
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get snippets for a specific user
app.get('/api/snippets/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const snippets = await Snippet.find({ username }).sort({ id: -1 });
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Like snippet route
app.post('/api/snippets/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.body;
        const snippet = await Snippet.findOne({ id: parseInt(id) });
        if (!snippet) {
            return res.status(404).json({ success: false, message: 'Snippet not found' });
        }
        if (snippet.likedBy.includes(username)) {
            return res.status(400).json({ success: false, message: 'User already liked this snippet' });
        }
        snippet.likes += 1;
        snippet.likedBy.push(username);
        await snippet.save();
        res.json({ success: true, likes: snippet.likes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Unlike snippet route
app.post('/api/snippets/:id/unlike', async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.body;
        const snippet = await Snippet.findOne({ id: parseInt(id) });
        if (!snippet) {
            return res.status(404).json({ success: false, message: 'Snippet not found' });
        }
        if (!snippet.likedBy.includes(username)) {
            return res.status(400).json({ success: false, message: 'User has not liked this snippet' });
        }
        snippet.likes -= 1;
        snippet.likedBy = snippet.likedBy.filter(user => user !== username);
        await snippet.save();
        res.json({ success: true, likes: snippet.likes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete snippet route
app.delete('/api/snippets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.body;

        const snippet = await Snippet.findOne({ id: parseInt(id) });
        if (!snippet) {
            return res.status(404).json({ success: false, message: 'Snippet not found' });
        }

        // Check if the user is the owner of the snippet
        if (snippet.username !== username) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this snippet' });
        }

        await Snippet.deleteOne({ id: parseInt(id) });
        res.json({ success: true, message: 'Snippet deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve user pages
app.get('/user/:username', (req, res) => {
    console.log(`Serving user page for: ${req.params.username}`);
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

// Add this before the last app.get('*', ...) route
app.use((req, res, next) => {
    console.log(`Received request for: ${req.url}`);
    next();
});

// This should be the last route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add a route to serve the uploaded images
app.use('/uploads', express.static('public/uploads'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});