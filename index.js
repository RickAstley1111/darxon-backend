const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let employees = [
  {
    id: 1,
    name: 'Boss',
    role: 'admin',
    status: 'absent',
    tasks: [],
    messages: [],
    children: []
  }
];

// 🔍 Поиск сотрудника по ID (в любом уровне)
function findEmployeeById(list, id) {
  for (const emp of list) {
    if (emp.id === id) return emp;
    if (emp.children?.length) {
      const found = findEmployeeById(emp.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Добавить сотрудника
app.post('/employees', (req, res) => {
  const { name, role, parentId } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });

  const newEmp = {
    id: Date.now(),
    name,
    role: role || 'employee',
    status: 'absent',
    tasks: [],
    messages: [],
    children: []
  };

  if (!parentId) {
    employees.push(newEmp);
  } else {
    const parent = findEmployeeById(employees, parentId);
    if (!parent) return res.status(404).json({ error: 'Родитель не найден' });
    parent.children.push(newEmp);
  }

  res.status(201).json(newEmp);
});

// Получить дерево сотрудников
app.get('/employees', (req, res) => {
  res.json(employees);
});

// Обновить сотрудника
app.put('/employees/:id', (req, res) => {
  const { name, status, role } = req.body;
  const emp = findEmployeeById(employees, Number(req.params.id));
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  if (name !== undefined) emp.name = name;
  if (status !== undefined) emp.status = status;
  if (role !== undefined) emp.role = role;

  res.json({ message: 'Сотрудник обновлён', employee: emp });
});

// Добавить задачу
app.post('/employees/:id/tasks', (req, res) => {
  const { task } = req.body;
  const emp = findEmployeeById(employees, Number(req.params.id));
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  emp.tasks.push({ text: task, done: false });
  res.json(emp.tasks);
});

// Изменить статус задачи
app.put('/employees/:id/tasks/:index', (req, res) => {
  const { done } = req.body;
  const emp = findEmployeeById(employees, Number(req.params.id));
  if (!emp || !emp.tasks[req.params.index])
    return res.status(404).json({ error: 'Сотрудник или задача не найдены' });

  emp.tasks[req.params.index].done = !!done;
  res.json(emp.tasks[req.params.index]);
});

// Удалить задачу
app.delete('/employees/:id/tasks/:index', (req, res) => {
  const emp = findEmployeeById(employees, Number(req.params.id));
  if (!emp || !emp.tasks[req.params.index])
    return res.status(404).json({ error: 'Сотрудник или задача не найдены' });

  emp.tasks.splice(req.params.index, 1);
  res.json(emp.tasks);
});

// Отправить сообщение
app.post('/employees/:id/message', (req, res) => {
  const toEmp = findEmployeeById(employees, Number(req.params.id));
  const fromEmp = findEmployeeById(employees, req.body.fromId);
  if (!toEmp || !fromEmp) return res.status(404).json({ error: 'Сотрудник не найден' });

  const canSend =
    fromEmp.id === 1 || // Boss
    isChildOf(toEmp, fromEmp.id); // Родитель

  if (!canSend) return res.status(403).json({ error: 'Нет прав на отправку' });

  toEmp.messages.push({ from: fromEmp.id, text: req.body.text });
  res.json({ message: 'Сообщение отправлено' });
});

// Получить сообщения
app.get('/employees/:id/messages', (req, res) => {
  const emp = findEmployeeById(employees, Number(req.params.id));
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });

  res.json(emp.messages);
});

// Проверка на подчинённость
function isChildOf(target, parentId) {
  if (target.id === parentId) return false;
  const parent = findEmployeeById(employees, parentId);
  return parent?.children?.some(child => {
    return child.id === target.id || isChildOf(child, target.id);
  });
}

// Запуск сервера
app.listen(port, () => {
  console.log(`✅ Сервер работает на http://localhost:${port}`);
});
