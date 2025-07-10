const express = require('express');
const cors = require('cors'); // Добавляем CORS

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());              // Включаем CORS
app.use(express.json());

// Памятное хранилище сотрудников
let employees = [
  {
    id: 1,
    name: 'Boss',
    parentId: null,
    status: 'absent',
    role: 'admin',
    tasks: [],
    messages: []
  }
];

// 📄 Получить всех сотрудников (плоским списком)
app.get('/employees', (req, res) => {
  res.json(employees);
});

// ➕ Добавить нового сотрудника
app.post('/employees', (req, res) => {
  const { name, parentId, role } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });

  const newEmp = {
    id: Date.now(),
    name,
    parentId: parentId || null,
    status: 'absent',
    role: role || 'employee',
    tasks: [],
    messages: []
  };

  employees.push(newEmp);
  res.status(201).json(newEmp);
});

// 🖊 Обновить данные сотрудника
app.put('/employees/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, parentId, status, role } = req.body;

  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  if (name !== undefined) emp.name = name;
  if (parentId !== undefined) emp.parentId = parentId;
  if (status !== undefined && ['present', 'absent'].includes(status)) emp.status = status;
  if (role !== undefined) emp.role = role;

  res.json({ message: 'Сотрудник обновлён', employee: emp });
});

// ✅ Добавить задачу
app.post('/employees/:id/tasks', (req, res) => {
  const id = Number(req.params.id);
  const { task } = req.body;

  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  emp.tasks.push({ text: task, done: false });
  res.json(emp.tasks);
});

// 🔁 Изменить статус задачи
app.put('/employees/:id/tasks/:index', (req, res) => {
  const id = Number(req.params.id);
  const index = Number(req.params.index);
  const { done } = req.body;

  const emp = employees.find(e => e.id === id);
  if (!emp || !emp.tasks[index]) {
    return res.status(404).json({ error: 'Сотрудник или задача не найдены' });
  }

  emp.tasks[index].done = !!done;
  res.json(emp.tasks[index]);
});

// 🗑 Удалить задачу
app.delete('/employees/:id/tasks/:index', (req, res) => {
  const id = Number(req.params.id);
  const index = Number(req.params.index);

  const emp = employees.find(e => e.id === id);
  if (!emp || index >= emp.tasks.length)
    return res.status(404).json({ error: 'Сотрудник или задача не найдены' });

  emp.tasks.splice(index, 1);
  res.json(emp.tasks);
});

// 📩 Отправить сообщение сотруднику
app.post('/employees/:id/message', (req, res) => {
  const toId = Number(req.params.id);
  const { fromId, text } = req.body;

  const toEmp = employees.find(e => e.id === toId);
  const fromEmp = employees.find(e => e.id === fromId);

  if (!toEmp || !fromEmp) return res.status(404).json({ error: 'Сотрудник не найден' });

  const isBoss = fromEmp.parentId === null;
  const isParent = toEmp.parentId === fromEmp.id;

  if (!(isBoss || isParent)) {
    return res.status(403).json({ error: 'Нет прав на отправку сообщения' });
  }

  toEmp.messages.push({ from: fromId, text });
  res.json({ message: 'Сообщение отправлено' });
});

// 📨 Получить сообщения
app.get('/employees/:id/messages', (req, res) => {
  const id = Number(req.params.id);
  const emp = employees.find(e => e.id === id);

  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  res.json(emp.messages);
});

// 🚀 Запуск сервера
app.listen(port, () => {
  console.log(`✅ Сервер работает на http://localhost:${port}`);
});
