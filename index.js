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

// 🚀 Генерация уникального ID
const generateId = async () => {
  const last = await Employee.find().sort({ id: -1 }).limit(1);
  return last[0]?.id + 1 || 1;
};

// 📥 Получить всех сотрудников
app.get('/employees', async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
});

// 🔍 Получить одного сотрудника
app.get('/employees/:id', async (req, res) => {
  const emp = await Employee.findOne({ id: Number(req.params.id) });
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
  res.json(emp);
});

// ➕ Добавить сотрудника
app.post('/employees', async (req, res) => {
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
});

// ✏️ Обновить сотрудника
app.put('/employees/:id', async (req, res) => {
  const emp = await Employee.findOne({ id: Number(req.params.id) });
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  const { name, role, status } = req.body;
  if (name !== undefined) emp.name = name;
  if (role !== undefined) emp.role = role;
  if (status !== undefined) emp.status = status;

  await emp.save();
  res.json(emp);
});

// ❌ Удалить сотрудника
app.delete('/employees/:id', async (req, res) => {
  const emp = await Employee.findOneAndDelete({ id: Number(req.params.id) });
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
  res.json({ message: 'Удалён' });
});

// 📋 Добавить задачу
app.post('/employees/:id/tasks', async (req, res) => {
  const emp = await Employee.findOne({ id: Number(req.params.id) });
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  emp.tasks.push({ text: req.body.task, done: false });
  await emp.save();
  res.json(emp.tasks);
});

// ✅ Изменить статус задачи
app.put('/employees/:id/tasks/:index', async (req, res) => {
  const emp = await Employee.findOne({ id: Number(req.params.id) });
  const index = Number(req.params.index);
  if (!emp || !emp.tasks[index])
    return res.status(404).json({ error: 'Задача или сотрудник не найдены' });

  emp.tasks[index].done = !!req.body.done;
  await emp.save();
  res.json(emp.tasks[index]);
});

// ❌ Удалить задачу
app.delete('/employees/:id/tasks/:index', async (req, res) => {
  const emp = await Employee.findOne({ id: Number(req.params.id) });
  const index = Number(req.params.index);
  if (!emp || !emp.tasks[index])
    return res.status(404).json({ error: 'Задача или сотрудник не найдены' });

  emp.tasks.splice(index, 1);
  await emp.save();
  res.json(emp.tasks);
});

// ✉️ Отправка сообщения
app.post('/employees/:id/message', async (req, res) => {
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
});

// 📥 Получить сообщения
app.get('/employees/:id/messages', async (req, res) => {
  const emp = await Employee.findOne({ id: Number(req.params.id) });
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
  res.json(emp.messages);
});

app.listen(port, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});
