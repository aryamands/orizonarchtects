require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String
}));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ DB Connected");

    const username = "admin";
    const password = "admin123"; // change if you want

    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await User.findOne({ username });

    if (existing) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    await User.create({
      username,
      password: hashedPassword
    });

    console.log("🔥 Admin created successfully");
    process.exit();
  })
  .catch(err => {
    console.error("❌ ERROR:", err.message);
  });