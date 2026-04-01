// ------------------- Работа с заметками (localStorage) -------------------
const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const notesList = document.getElementById('notes-list');

// Загрузка заметок из localStorage и отображение
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-message">✏️ Здесь пока пусто. Добавьте первую заметку!</div>';
        return;
    }
    // Отображаем в обратном порядке (новые сверху)
    const reversed = [...notes].reverse();
    notesList.innerHTML = reversed.map((note, index) => {
        // Оригинальный индекс в массиве notes (чтобы удалять по правильному индексу)
        const originalIndex = notes.length - 1 - index;
        return `
            <li class="note-item" data-index="${originalIndex}">
                <span class="note-text">${escapeHtml(note)}</span>
                <button class="delete-btn" data-index="${originalIndex}">🗑️</button>
            </li>
        `;
    }).join('');

    // Добавляем обработчики удаления для каждой кнопки
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            deleteNote(idx);
        });
    });
}

// Добавление новой заметки
function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes(); // обновляем список
}

// Удаление заметки по индексу
function deleteNote(index) {
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (index >= 0 && index < notes.length) {
        notes.splice(index, 1);
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
    }
}

// Экранирование HTML для защиты от XSS (сохраняет эмодзи)
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Обработка отправки формы
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addNote(text);
        input.value = '';
        input.focus();
    }
});

// Первоначальная загрузка
loadNotes();

// ------------------- Индикатор онлайн/офлайн -------------------
const networkStatus = document.getElementById('network-status');

function updateNetworkStatus() {
    console.log('updateNetworkStatus вызван, navigator.onLine =', navigator.onLine);
    if (navigator.onLine) {
        networkStatus.textContent = '🟢 Онлайн';
        networkStatus.classList.remove('offline');
    } else {
        networkStatus.textContent = '🔴 Офлайн (работает из кэша)';
        networkStatus.classList.add('offline');
    }
}

// Слушаем изменения сети
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// Устанавливаем начальное состояние
updateNetworkStatus();

// ------------------- Регистрация Service Worker -------------------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker зарегистрирован, scope:', registration.scope);
        } catch (err) {
            console.error('❌ Ошибка регистрации Service Worker:', err);
        }
    });
}