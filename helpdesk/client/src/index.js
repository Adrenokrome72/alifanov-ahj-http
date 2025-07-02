import './style.css';

const API_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : 'http://localhost:3000';

// DOM элементы
const ticketsContainer = document.getElementById('tickets');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const form = document.getElementById('ticket-form');
const nameInput = document.getElementById('name');
const descriptionInput = document.getElementById('description');
const statusInput = document.getElementById('status');
const cancelBtn = document.getElementById('cancel-btn');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

let currentTicketId = null;

// Функция для отображения статуса загрузки
function showLoading() {
  ticketsContainer.innerHTML = '<div class="loading">Загрузка данных...</div>';
}

// Функция для отображения ошибки
function showError(message) {
  ticketsContainer.innerHTML = `<div class="error">${message}</div>`;
}

// Загрузка тикетов с сервера
async function loadTickets() {
  showLoading();
  
  try {
    const response = await fetch(`${API_URL}/allTickets`);
    
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    
    const tickets = await response.json();
    renderTickets(tickets);
  } catch (error) {
    showError(`Не удалось загрузить тикеты: ${error.message}`);
    console.error('Ошибка при загрузке тикетов:', error);
  }
}

// Отрисовка тикетов с новым дизайном статуса
function renderTickets(tickets) {
  ticketsContainer.innerHTML = '';
  
  if (!tickets || tickets.length === 0) {
    ticketsContainer.innerHTML = '<div class="empty">Нет активных тикетов</div>';
    return;
  }

  tickets.forEach(ticket => {
    const ticketEl = document.createElement('div');
    ticketEl.className = 'ticket';
    ticketEl.dataset.id = ticket.id;
    
    // Простые подсказки через атрибут data-tooltip
    const statusIcon = ticket.status 
      ? '<div class="status-icon done" data-tooltip="Задача выполнена"></div>'
      : '<div class="status-icon in-progress" data-tooltip="Задача в работе"></div>';
    
    ticketEl.innerHTML = `
      <div class="ticket-main">
        <div class="ticket-status">
          ${statusIcon}
        </div>
        <div class="ticket-name">${ticket.name}</div>
        <div class="ticket-date">${formatDate(ticket.created)}</div>
        <div class="ticket-actions">
          <button class="edit-btn" title="Редактировать">✎</button>
          <button class="delete-btn" title="Удалить">×</button>
        </div>
      </div>
      <div class="ticket-description hidden"></div>
    `;
    
    ticketsContainer.appendChild(ticketEl);
    
    // Обработчики событий
    const ticketMain = ticketEl.querySelector('.ticket-main');
    const editBtn = ticketEl.querySelector('.edit-btn');
    const deleteBtn = ticketEl.querySelector('.delete-btn');
    
    ticketMain.addEventListener('click', (e) => {
      if (!e.target.closest('.ticket-actions') && !e.target.closest('.ticket-status')) {
        toggleDescription(ticket.id);
      }
    });
    
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(ticket.id);
    });
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(ticket.id);
    });
  });
}

// Форматирование даты
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Переключение отображения описания
async function toggleDescription(id) {
  const ticketEl = document.querySelector(`.ticket[data-id="${id}"]`);
  if (!ticketEl) return;
  
  const descriptionEl = ticketEl.querySelector('.ticket-description');
  
  if (descriptionEl.classList.contains('hidden')) {
    try {
      const response = await fetch(`${API_URL}/ticketById?id=${id}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
      
      const ticket = await response.json();
      descriptionEl.textContent = ticket.description || 'Нет описания';
    } catch (error) {
      descriptionEl.textContent = `Ошибка загрузки: ${error.message}`;
      console.error('Ошибка при загрузке описания:', error);
    }
  }
  
  descriptionEl.classList.toggle('hidden');
}

// Создание нового тикета
async function createTicket(data) {
  try {
    const response = await fetch(`${API_URL}/createTicket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при создании тикета:', error);
    throw error;
  }
}

// Обновление тикета
async function updateTicket(id, data) {
  try {
    const response = await fetch(`${API_URL}/updateTicket`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...data })
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при обновлении тикета:', error);
    throw error;
  }
}

// Удаление тикета
async function deleteTicket(id) {
  try {
    const response = await fetch(`${API_URL}/deleteTicket?id=${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при удалении тикета:', error);
    throw error;
  }
}

// Открытие модального окна
function openModal(title, ticket = null) {
  modalTitle.textContent = title;
  nameInput.value = ticket ? ticket.name : '';
  descriptionInput.value = ticket ? ticket.description || '' : '';
  statusInput.checked = ticket ? ticket.status : false;
  currentTicketId = ticket ? ticket.id : null;
  modal.classList.add('visible');
  modal.classList.remove('hidden');
}

// Открытие окна редактирования
async function openEditModal(id) {
  try {
    const response = await fetch(`${API_URL}/ticketById?id=${id}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    
    const ticket = await response.json();
    openModal('Редактировать тикет', ticket);
  } catch (error) {
    alert('Не удалось загрузить данные тикета');
    console.error('Ошибка при загрузке тикета:', error);
  }
}

// Открытие окна удаления
function openDeleteModal(id) {
  currentTicketId = id;
  deleteModal.classList.add('visible');
  deleteModal.classList.remove('hidden');
}

// Обработчик формы
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const ticketData = {
    name: nameInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusInput.checked
  };
  
  if (!ticketData.name) {
    alert('Название тикета обязательно для заполнения');
    return;
  }
  
  try {
    if (currentTicketId) {
      await updateTicket(currentTicketId, ticketData);
    } else {
      await createTicket(ticketData);
    }
    
    modal.classList.add('hidden');
    modal.classList.remove('visible');
    await loadTickets();
    form.reset();
  } catch (error) {
    alert('Не удалось сохранить тикет');
    console.error('Ошибка при сохранении тикета:', error);
  }
});

// Подтверждение удаления
confirmDeleteBtn.addEventListener('click', async () => {
  try {
    await deleteTicket(currentTicketId);
    deleteModal.classList.add('hidden');
    deleteModal.classList.remove('visible');
    await loadTickets();
  } catch (error) {
    alert('Не удалось удалить тикет');
    console.error('Ошибка при удалении тикета:', error);
  }
});

// Закрытие модальных окон
cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  modal.classList.remove('visible');
  form.reset();
});

cancelDeleteBtn.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
  deleteModal.classList.remove('visible');
});

// Открытие формы добавления
addBtn.addEventListener('click', () => {
  openModal('Добавить тикет');
});

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  loadTickets();
});