const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Employee = require('./models/Employee');
const User = require('./models/User');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

mongoose.connect("your_mongo_connection_string")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Создание сотрудника и пользователя
app.post('/employees', async (req, res) => {
  try {
    const { name, role, parentId, email, password } = req.body;

    const employee = await Employee.create({
      name,
      role,
      parentId: parentId || null,
      status: "пришёл",
      tasks: []
    });

    await User.create({
      email,
      password,
      role,
      employeeId: employee._id
    });

    res.status(201).json(employee);
  } catch (err) {
    console.error("Ошибка при создании сотрудника:", err);
    res.status(500).json({ error: "Ошибка сервера при создании сотрудника" });
  }
});

// Получить всех сотрудников
app.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении сотрудников" });
  }
});

// Получить сотрудника по id
app.get('/employees/:id', async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении сотрудника" });
  }
});

// 🔐 Авторизация
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Пользователь не найден" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Неверный пароль" });

    res.json({ message: "Успешный вход", user });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при входе" });
  }
});

app.listen(PORT, () => console.log(`🚀 Сервер запущен на http://localhost:${PORT}`));
