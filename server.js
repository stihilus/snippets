require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');

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
    password: String
});

// Define Snippet model
const Snippet = mongoose.model('Snippet', {
    id: Number,
    code: String,
    username: String
});

// Register route
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.json({ success: false, message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
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
app.post('/api/snippets', async (req, res) => {
    try {
        const newSnippet = new Snippet(req.body);
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});