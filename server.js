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
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(logger);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests, try again later"
});
app.use(limiter);

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// ================= DB CONNECT =================
const MONGO_URI = "mongodb+srv://admin:admin123@cluster0.hr47sc6.mongodb.net/orizonDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourgmail@gmail.com",
    pass: "your_app_password"
  }
});

// ================= SCHEMAS =================

// CONTACT
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model("Contact", ContactSchema);

// NEWSLETTER
const NewsletterSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  subscribedAt: { type: Date, default: Date.now }
});
const Newsletter = mongoose.model("Newsletter", NewsletterSchema);

// ARTICLE
const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
});
const Article = mongoose.model("Article", ArticleSchema);

// USER
const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model("User", UserSchema);

// ================= NEW: CLIENT SCHEMA =================
const ClientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  companyName: String,
  contactPerson: String,
  email: String,
  phone: String,
  projectType: String,
  budget: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Client = mongoose.model("Client", ClientSchema);

// ================= VALIDATION =================
const contactSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  message: Joi.string().min(5).required()
});

// ================= CONTACT =================
app.post("/contact", async (req, res) => {
  try {
    let { name, email, message } = req.body;

    name = mongoSanitize(xss(name));
    email = mongoSanitize(xss(email));
    message = mongoSanitize(xss(message));

    const { error } = contactSchema.validate({ name, email, message });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const newContact = new Contact({ name, email, message });
    await newContact.save();

    try {
      await transporter.sendMail({
        from: `"Orizon Architects" <yourgmail@gmail.com>`,
        to: "yourgmail@gmail.com",
        subject: "New Inquiry",
        html: `<p>${name} - ${email} - ${message}</p>`
      });
    } catch (e) {
      console.log("Email skipped");
    }

    res.json({ message: "Saved ✅" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================= NEWSLETTER =================
app.post("/subscribe", async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });

    email = email.trim().toLowerCase();

    const exists = await Newsletter.findOne({ email });
    if (exists) return res.status(400).json({ error: "Already subscribed" });

    const newSub = new Newsletter({ email });
    await newSub.save();

    res.json({ message: "Subscribed ✅" });

  } catch (err) {
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
    res.status(500).json({ error: "Error adding article" });
  }
});

app.get("/articles", async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.json(articles);
});

// ================= NEW: ADD CLIENT =================
app.post("/add-client", async (req, res) => {
  try {
    const {
      clientName,
      companyName,
      contactPerson,
      email,
      phone,
      projectType,
      budget,
      notes
    } = req.body;

    if (!clientName) {
      return res.status(400).json({ error: "Client name is required" });
    }

    const newClient = new Client({
      clientName,
      companyName,
      contactPerson,
      email,
      phone,
      projectType,
      budget,
      notes
    });

    await newClient.save();

    res.json({ message: "Client saved successfully ✅" });

  } catch (err) {
    console.error("Client Error:", err);
    res.status(500).json({ error: "Failed to save client" });
  }
});

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || password.length < 6) {
      return res.status(400).json({ error: "Password must be 6+ characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword
    });

    await user.save();

    res.json({ message: "Admin registered ✅" });

  } catch (err) {
    res.status(500).json({ error: "Error registering" });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    res.json({ message: "Login successful ✅" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});