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
const ExcelJS = require("exceljs");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors({
  origin: ["https://orizons.in", "https://www.orizons.in"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("DB ERROR:", err));

// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ================= SCHEMAS =================

const Contact = mongoose.model("Contact", new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
}));

const Newsletter = mongoose.model("Newsletter", new mongoose.Schema({
  email: String,
  createdAt: { type: Date, default: Date.now }
}));

const Article = mongoose.model("Article", new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
}));

const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String
}));

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
    let { name, email, message } = req.body;

    name = mongoSanitize(xss(name));
    email = mongoSanitize(xss(email));
    message = mongoSanitize(xss(message));

    const newContact = new Contact({ name, email, message });
    await newContact.save();

    res.json({ message: "Message sent successfully ✅" });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= NEWSLETTER =================
app.post("/subscribe", async (req, res) => {
  try {
    let { email } = req.body;

    email = email.trim().toLowerCase();

    const exists = await Newsletter.findOne({ email });

    if (exists) {
      return res.json({ message: "Already subscribed ✅" });
    }

    await Newsletter.create({ email });

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

    await Article.create({ title, content, image });

    res.json({ message: "Article added ✅" });

  } catch (err) {
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
    const data = req.body;

    if (!data.clientName) {
      return res.status(400).json({ error: "Client name required" });
    }

    await Client.create(data);

    res.json({ message: "Client saved successfully ✅" });

  } catch (err) {
    console.error("CLIENT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= ADMIN LOGIN =================
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "Invalid username" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    res.json({ message: "Login successful ✅" });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= EXPORT NEWSLETTER =================
app.get("/export/newsletter", async (req, res) => {
  const data = await Newsletter.find();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Newsletter");

  sheet.columns = [
    { header: "Email", key: "email" },
    { header: "Date", key: "createdAt" }
  ];

  data.forEach(item => sheet.addRow(item));

  res.setHeader("Content-Disposition", "attachment; filename=newsletter.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

// ================= EXPORT CONTACT =================
app.get("/export/contact", async (req, res) => {
  const data = await Contact.find();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Contacts");

  sheet.columns = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Message", key: "message" }
  ];

  data.forEach(item => sheet.addRow(item));

  res.setHeader("Content-Disposition", "attachment; filename=contacts.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

// ================= EXPORT CLIENT =================
app.get("/export/client", async (req, res) => {
  const data = await Client.find();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Clients");

  sheet.columns = [
    { header: "Client Name", key: "clientName" },
    { header: "Company", key: "companyName" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" }
  ];

  data.forEach(item => sheet.addRow(item));

  res.setHeader("Content-Disposition", "attachment; filename=clients.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});