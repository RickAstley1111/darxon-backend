const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Employee = require("./models/Employee");
const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Middleware: Check JWT
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Create initial boss account manually
app.post("/register-boss", async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash });
    const boss = await Employee.create({ name, role, status: "пришёл", userId: user._id });
    res.json({ message: "Boss registered", boss });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create employee (boss only)
app.post("/employees", authenticate, async (req, res) => {
  const { name, role, parentId, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash });
    const emp = await Employee.create({ name, role, parentId, status: "пришёл", userId: user._id });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all employees
app.get("/employees", async (req, res) => {
  const emps = await Employee.find();
  res.json(emps);
});

// Get employee by id
app.get("/employees/:id", async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  res.json(emp);
});

// Update employee
app.put("/employees/:id", authenticate, async (req, res) => {
  const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(emp);
});

// Delete employee
app.delete("/employees/:id", authenticate, async (req, res) => {
  const emp = await Employee.findByIdAndDelete(req.params.id);
  if (emp?.userId) await User.findByIdAndDelete(emp.userId);
  res.json({ message: "Deleted", emp });
});

// Change own email
app.put("/me/email", authenticate, async (req, res) => {
  const { email } = req.body;
  await User.findByIdAndUpdate(req.user.id, { email });
  res.json({ message: "Email updated" });
});

// Change own password
app.put("/me/password", authenticate, async (req, res) => {
  const { password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(req.user.id, { password: hash });
  res.json({ message: "Password updated" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
