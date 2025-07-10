const port = process.env.PORT || 3000;

// Добавление задачи сотруднику
app.post('/employees/:id/tasks', (req, res) => {
  const id = Number(req.params.id);
  const { task } = req.body;
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
  emp.tasks = emp.tasks || [];
  emp.tasks.push(task);
  res.json(emp.tasks);
});

// Удаление задачи
app.delete('/employees/:id/tasks/:index', (req, res) => {
  const id = Number(req.params.id);
  const index = Number(req.params.index);
  const emp = employees.find(e => e.id === id);
  if (!emp || !emp.tasks || index >= emp.tasks.length)
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

  // Проверка: Boss может всем, остальные только подчинённым
  const isBoss = fromEmp.parentId === null;
  const isParent = toEmp.parentId === fromEmp.id;

  if (!(isBoss || isParent)) {
    return res.status(403).json({ error: 'Нет прав на отправку сообщения' });
  }

  toEmp.messages = toEmp.messages || [];
  toEmp.messages.push({ from: fromId, text });
  res.json({ message: 'Сообщение отправлено' });
});

// Получение сообщений
app.get('/employees/:id/messages', (req, res) => {
  const id = Number(req.params.id);
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Сотрудник не найден' });
  res.json(emp.messages || []);
});
