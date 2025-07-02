const Koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

// Инициализация тикетов (все задачи в работе)
let tickets = [
  {
    id: 1,
    name: 'Проблема с принтером',
    description: 'Не печатает документы',
    status: false, // Все задачи изначально в работе
    created: Date.now()
  },
  {
    id: 2,
    name: 'Обновить ПО',
    description: 'Требуется обновление Windows',
    status: false, // Все задачи изначально в работе
    created: Date.now() - 86400000
  }
];

// Методы API
router.get('/allTickets', (ctx) => {
  // Возвращаем только краткую информацию
  ctx.body = tickets.map(({ id, name, status, created }) => ({
    id, name, status, created
  }));
});

router.get('/ticketById', (ctx) => {
  const id = parseInt(ctx.query.id);
  if (isNaN(id)) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid ticket ID' };
    return;
  }

  const ticket = tickets.find(t => t.id === id);
  if (!ticket) {
    ctx.status = 404;
    ctx.body = { error: 'Ticket not found' };
    return;
  }

  ctx.body = ticket;
});

router.post('/createTicket', (ctx) => {
  const { name, description, status } = ctx.request.body;
  
  if (!name) {
    ctx.status = 400;
    ctx.body = { error: 'Name is required' };
    return;
  }
  
  const id = tickets.length > 0 
    ? Math.max(...tickets.map(t => t.id)) + 1 
    : 1;
  
  const newTicket = {
    id,
    name,
    description: description || '',
    status: Boolean(status),
    created: Date.now()
  };
  
  tickets.push(newTicket);
  ctx.body = newTicket;
});

router.put('/updateTicket', (ctx) => {
  const { id, name, description, status } = ctx.request.body;
  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid ticket ID' };
    return;
  }

  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Ticket not found' };
    return;
  }

  tickets[ticketIndex] = {
    ...tickets[ticketIndex],
    name: name || tickets[ticketIndex].name,
    description: description || tickets[ticketIndex].description,
    status: Boolean(status)
  };

  ctx.body = tickets[ticketIndex];
});

router.delete('/deleteTicket', (ctx) => {
  const id = parseInt(ctx.query.id);
  if (isNaN(id)) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid ticket ID' };
    return;
  }

  const ticketIndex = tickets.findIndex(t => t.id === id);
  if (ticketIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Ticket not found' };
    return;
  }

  tickets.splice(ticketIndex, 1);
  ctx.body = { success: true };
});

// Middleware
app.use(cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type']
}));
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});