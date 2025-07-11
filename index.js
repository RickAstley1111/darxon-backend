const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('./models/User')
const Employee = require('./models/Employee')

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = 'supersecret' // поменяй на свой

mongoose.connect('your_mongo_uri_here')
    .then(() => console.log("Mongo connected"))
    .catch((err) => console.log("Mongo error:", err))

// Middleware для проверки токена
const auth = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(401).json({ error: "No token" })

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded
        next()
    } catch {
        res.status(401).json({ error: "Invalid token" })
    }
}

// РЕГИСТРАЦИЯ
app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body
    const hashed = await bcrypt.hash(password, 10)

    try {
        const user = await User.create({ username, password: hashed })
        res.json({ message: "Registered", userId: user._id })
    } catch (e) {
        res.status(400).json({ error: "Username already exists" })
    }
})

// ЛОГИН
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(401).json({ error: "Invalid" })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: "Wrong password" })

    const token = jwt.sign({ id: user._id }, JWT_SECRET)
    res.json({ token })
})

// ВСЕ СОТРУДНИКИ (только текущего пользователя)
app.get('/employees', auth, async (req, res) => {
    const employees = await Employee.find({ userId: req.user.id })
    res.json(employees)
})

// ОДИН СОТРУДНИК
app.get('/employees/:id', auth, async (req, res) => {
    const emp = await Employee.findOne({ _id: req.params.id, userId: req.user.id })
    if (!emp) return res.status(404).json({ error: "Not found" })
    res.json(emp)
})

// СОЗДАНИЕ СОТРУДНИКА
app.post('/employees', auth, async (req, res) => {
    const newEmp = await Employee.create({ ...req.body, userId: req.user.id })
    res.json(newEmp)
})

// УДАЛЕНИЕ
app.delete('/employees/:id', auth, async (req, res) => {
    await Employee.deleteOne({ _id: req.params.id, userId: req.user.id })
    res.json({ message: "Deleted" })
})

// РЕДАКТИРОВАНИЕ
app.put('/employees/:id', auth, async (req, res) => {
    const updated = await Employee.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        req.body,
        { new: true }
    )
    res.json(updated)
})

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log("Server started on port", PORT))
