const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB подключен'))
  .catch(err => console.error('❌ Ошибка MongoDB:', err));

const TaskSchema = new mongoose.Schema({
  text: String,
  done: { type: Boolean, default: false }
});

const MessageSchema = new mongoose.Schema({
  from: Number,
  text: String
});

const EmployeeSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: String,
  role: String,
  status: String,
  parentId: Number,
  tasks: [TaskSchema],
  messages: [MessageSchema]
});

const Employee = mongoose.model('Employee', EmployeeSchema);

// Генерация ID
const generateId = async () => {
  const last = await Employee.find().sort({ id: -1 }).limit(1);
  return last[0]?.id + 1 || 1;
};

// 🔹 Получить всех сотрудников
app.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error('Ошибка /employees:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Получить одного по id
app.get('/employees/:id', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: Number(req.params.id) });
    if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
    res.json(emp);
  } catch (err) {
    console.error('Ошибка /employees/:id:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Добавить сотрудника
app.post('/employees', async (req, res) => {
  try {
    const { name, role = 'employee', parentId = null } = req.body;
    const newEmp = new Employee({
      id: await generateId(),
      name,
      role,
      status: 'absent',
      parentId,
      tasks: [],
      messages: []
    });
    await newEmp.save();
    res.status(201).json(newEmp);
  } catch (err) {
    console.error('Ошибка при добавлении:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Обновить сотрудника
app.put('/employees/:id', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: Number(req.params.id) });
    if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

    const { name, role, status } = req.body;
    if (name !== undefined) emp.name = name;
    if (role !== undefined) emp.role = role;
    if (status !== undefined) emp.status = status;

    await emp.save();
    res.json(emp);
  } catch (err) {
    console.error('Ошибка при обновлении:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Удалить сотрудника
app.delete('/employees/:id', async (req, res) => {
  try {
    const emp = await Employee.findOneAndDelete({ id: Number(req.params.id) });
    if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
    res.json({ message: 'Удалён' });
  } catch (err) {
    console.error('Ошибка при удалении:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Добавить задачу
app.post('/employees/:id/tasks', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: Number(req.params.id) });
    if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

    emp.tasks.push({ text: req.body.task, done: false });
    await emp.save();
    res.json(emp.tasks);
  } catch (err) {
    console.error('Ошибка при добавлении задачи:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Изменить статус задачи
app.put('/employees/:id/tasks/:index', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: Number(req.params.id) });
    const index = Number(req.params.index);
    if (!emp || !emp.tasks[index])
      return res.status(404).json({ error: 'Задача или сотрудник не найдены' });

    emp.tasks[index].done = !!req.body.done;
    await emp.save();
    res.json(emp.tasks[index]);
  } catch (err) {
    console.error('Ошибка при обновлении задачи:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Удалить задачу
app.delete('/employees/:id/tasks/:index', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: Number(req.params.id) });
    const index = Number(req.params.index);
    if (!emp || !emp.tasks[index])
      return res.status(404).json({ error: 'Задача или сотрудник не найдены' });

    emp.tasks.splice(index, 1);
    await emp.save();
    res.json(emp.tasks);
  } catch (err) {
    console.error('Ошибка при удалении задачи:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Отправка сообщения
app.post('/employees/:id/message', async (req, res) => {
  try {
    const toId = Number(req.params.id);
    const { fromId, text } = req.body;

    const toEmp = await Employee.findOne({ id: toId });
    const fromEmp = await Employee.findOne({ id: fromId });

    if (!toEmp || !fromEmp) return res.status(404).json({ error: 'Сотрудник не найден' });

    const isBoss = fromEmp.parentId === null;
    const isParent = toEmp.parentId === fromEmp.id;

    if (!(isBoss || isParent)) {
      return res.status(403).json({ error: 'Нет прав на отправку' });
    }

    toEmp.messages.push({ from: fromId, text });
    await toEmp.save();
    res.json({ message: 'Сообщение отправлено' });
  } catch (err) {
    console.error('Ошибка при отправке сообщения:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🔹 Получить сообщения
app.get('/employees/:id/messages', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: Number(req.params.id) });
    if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
    res.json(emp.messages);
  } catch (err) {
    console.error('Ошибка при получении сообщений:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});
