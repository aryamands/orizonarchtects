require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss");
const mongoSanitize = require("mongo-sanitize");
const Joi = require("joi");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const logger = require("./logger");

const app = express();

// ================= MIDDLEWARE =================

// ✅ FIXED CORS (CRITICAL)
app.use(cors({
  origin: ["https://orizons.in", "https://www.orizons.in"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// ✅ HANDLE PREFLIGHT (CRITICAL)
app.options("*", cors());

app.use(express.json());
app.use(helmet());
app.use(logger);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use(limiter);

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// ================= DB CONNECT =================
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("DB ERROR:", err));

// ================= EMAIL SETUP (SAFE DISABLED) =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ================= SCHEMAS =================

// CONTACT
const Contact = mongoose.model("Contact", new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
}));

// NEWSLETTER
const Newsletter = mongoose.model("Newsletter", new mongoose.Schema({
  email: String,
  createdAt: { type: Date, default: Date.now }
}));

// ARTICLE
const Article = mongoose.model("Article", new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
}));

// USER
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String
}));

// CLIENT
const Client = mongoose.model("Client", new mongoose.Schema({
  clientName: String,
  companyName: String,
  contactPerson: String,
  email: String,
  phone: String,
  projectType: String,
  budget: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
}));

// ================= CONTACT =================
app.post("/contact", async (req, res) => {
  try {
    console.log("CONTACT:", req.body);

    let { name, email, message } = req.body;

    name = mongoSanitize(xss(name));
    email = mongoSanitize(xss(email));
    message = mongoSanitize(xss(message));

    const newContact = new Contact({ name, email, message });
    await newContact.save();

    console.log("Email skipped");

    res.json({ message: "Message sent successfully ✅" });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= NEWSLETTER =================
app.post("/subscribe", async (req, res) => {
  try {
    console.log("SUBSCRIBE:", req.body);

    let { email } = req.body;

    email = email.trim().toLowerCase();

    const exists = await Newsletter.findOne({ email });

    if (exists) {
      return res.json({ message: "Already subscribed ✅" });
    }

    const newSub = new Newsletter({ email });
    await newSub.save();

    res.json({ message: "Subscribed successfully ✅" });

  } catch (err) {
    console.error("SUBSCRIBE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= ARTICLES =================
app.post("/add-article", async (req, res) => {
  try {
    const { title, content, image } = req.body;

    const newArticle = new Article({ title, content, image });
    await newArticle.save();

    res.json({ message: "Article added ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding article" });
  }
});

app.get("/articles", async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.json(articles);
});

// ================= CLIENT =================
app.post("/add-client", async (req, res) => {
  try {
    console.log("🔥 CLIENT ROUTE HIT");
    console.log("BODY:", req.body);

    const data = req.body;

    if (!data.clientName) {
      return res.status(400).json({ error: "Client name required" });
    }

    const newClient = new Client(data);
    await newClient.save();

    console.log("✅ CLIENT SAVED");

    res.json({ message: "Client saved successfully ✅" });

  } catch (err) {
    console.error("💥 CLIENT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= AUTH =================
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || password.length < 6) {
      return res.status(400).json({ error: "Password must be 6+ characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.json({ message: "Admin registered ✅" });

  } catch (err) {
    res.status(500).json({ error: "Error registering" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect password" });

    res.json({ message: "Login successful ✅" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});