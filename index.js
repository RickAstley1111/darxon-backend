const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Примерная база данных в памяти
let employees = [
  { id: 1, name: 'Boss', parentId: null, status: 'absent', tasks: [], messages: [] }
];

// Построить иерархию
function buildTree(parentId = null) {
  return employees
    .filter(emp => emp.parentId === parentId)
    .map(emp => ({
      ...emp,
      children: buildTree(emp.id)
    }));
}

// Получить всех сотрудников
app.get('/employees', (req, res) => {
  res.json(buildTree());
});

// Добавить сотрудника
app.post('/employees', (req, res) => {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });

  const newEmp = {
    id: Date.now(),
    name,
    parentId: parentId || null,
    status: 'absent',
    tasks: [],
    messages: []
  };

  employees.push(newEmp);
  res.status(201).json(newEmp);
});

// Изменить статус сотрудника
app.put('/employees/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!['present', 'absent'].includes(status)) {
    return res.status(400).json({ error: 'Статус должен быть: present или absent' });
  }

  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  emp.status = status;
  res.json({ message: 'Статус обновлён', employee: emp });
});

// Добавление задачи сотруднику
app.post('/employees/:id/tasks', (req, res) => {
  const id = Number(req.params.id);
  const { task } = req.body;
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
  emp.tasks.push(task);
  res.json(emp.tasks);
});

// Удаление задачи
app.delete('/employees/:id/tasks/:index', (req, res) => {
  const id = Number(req.params.id);
  const index = Number(req.params.index);
  const emp = employees.find(e => e.id === id);
  if (!emp || index >= emp.tasks.length)
    return res.status(404).json({ error: 'Задача или сотрудник не найдены' });
  emp.tasks.splice(index, 1);
  res.json(emp.tasks);
});

// Отправка сообщения сотруднику
app.post('/employees/:id/message', (req, res) => {
  const toId = Number(req.params.id);
  const { fromId, text } = req.body;

  const toEmp = employees.find(e => e.id === toId);
  const fromEmp = employees.find(e => e.id === fromId);

  if (!toEmp || !fromEmp) return res.status(404).json({ error: 'Сотрудник не найден' });

  // Только Boss или прямой руководитель
  const isBoss = fromEmp.parentId === null;
  const isParent = toEmp.parentId === fromEmp.id;

  if (!(isBoss || isParent)) {
    return res.status(403).json({ error: 'Нет прав на отправку сообщения' });
  }

  toEmp.messages.push({ from: fromId, text });
  res.json({ message: 'Сообщение отправлено' });
});

// Получение сообщений
app.get('/employees/:id/messages', (req, res) => {
  const id = Number(req.params.id);
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
  res.json(emp.messages);
});

// Запуск сервера
app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
});
