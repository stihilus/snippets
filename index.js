const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB (replace with your MongoDB connection string)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

// Define MongoDB models
const User = mongoose.model("User", {
  username: String,
  password: String,
});

const Snippet = mongoose.model("Snippet", {
  username: String,
  code: String,
  timestamp: Date,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // = 14 days. Default
      autoRemove: "native", // Default
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

// Add this middleware to log session data
app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID);
  console.log("Session Data:", req.session);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/user/:username", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/check-auth", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, username: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get("/tutorial", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "tutorial.html"));
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = { id: user._id, username: user.username };
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Error saving session" });
        }
        console.log("Session after login:", req.session);
        res.json({ success: true, username: user.username });
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/api/check-auth", (req, res) => {
  console.log("Check-auth session:", req.session);
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      res.status(500).json({ success: false, message: "Error logging out" });
    } else {
      res.json({ success: true });
    }
  });
});

app.get("/snippets", async (req, res) => {
  try {
    const snippets = await Snippet.find().sort({ timestamp: 1 });
    res.json(snippets);
  } catch (error) {
    console.error("Error retrieving snippets:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/snippets", async (req, res) => {
  try {
    const { code, username } = req.body;
    const user = req.session.user || username;
    console.log("Received snippet post request:", { code, user });
    if (!user) {
      console.log("User not authenticated");
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const snippet = new Snippet({
      username: user,
      code,
      timestamp: new Date(),
    });
    await snippet.save();
    console.log("Snippet saved successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error posting snippet:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.get("/user/:username", async (req, res) => {
  const { username } = req.params;
  const snippets = await Snippet.find({ username }).sort({ timestamp: 1 });
  res.json(snippets);
});

app.get("/api/snippets", async (req, res) => {
  try {
    const snippets = await Snippet.find().sort({ timestamp: 1 });
    res.json(snippets);
  } catch (error) {
    console.error("Error retrieving snippets:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/api/user/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const snippets = await Snippet.find({ username }).sort({ timestamp: 1 });
    res.json(snippets);
  } catch (error) {
    console.error("Error retrieving user snippets:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
