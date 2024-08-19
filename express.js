const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./path/to/your/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Register a new user
app.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username
    });
    await db.collection('users').doc(userRecord.uid).set({
      username,
      email
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    // In a real-world scenario, you'd verify the password here
    // For this example, we're just checking if the user exists
    res.status(200).json({ 
      uid: userRecord.uid, 
      username: userRecord.displayName 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new snippet
app.post('/snippets', async (req, res) => {
  const { uid, code } = req.body;
  try {
    const snippetRef = await db.collection('snippets').add({
      uid,
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: snippetRef.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all snippets
app.get('/snippets', async (req, res) => {
  try {
    const snippetsSnapshot = await db.collection('snippets')
      .orderBy('createdAt', 'desc')
      .get();
    const snippets = [];
    for (const doc of snippetsSnapshot.docs) {
      const snippet = doc.data();
      const userDoc = await db.collection('users').doc(snippet.uid).get();
      snippets.push({
        id: doc.id,
        code: snippet.code,
        username: userDoc.data().username
      });
    }
    res.status(200).json(snippets);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));