// ---------- Глобальные переменные ----------
let socket;
let currentPage = 'home';

// DOM элементы
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const contentDiv = document.getElementById('app-content');
const enablePushBtn = document.getElementById('enable-push');
const disablePushBtn = document.getElementById('disable-push');
const networkStatusDiv = document.getElementById('network-status');

// ---------- Индикатор онлайн/офлайн ----------
function updateNetworkStatus() {
    if (navigator.onLine) {
        networkStatusDiv.textContent = '🟢 Онлайн';
        networkStatusDiv.classList.remove('offline');
    } else {
        networkStatusDiv.textContent = '🔴 Офлайн (работает из кэша)';
        networkStatusDiv.classList.add('offline');
    }
}
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

// ---------- Навигация (App Shell) ----------
async function loadContent(page) {
    try {
        const response = await fetch(`/content/${page}.html`);
        const html = await response.text();
        contentDiv.innerHTML = html;
        if (page === 'home') {
            initNotes();          // инициализируем формы и список заметок
        }
        currentPage = page;
    } catch (err) {
        contentDiv.innerHTML = '<p style="color:red; text-align:center;">Ошибка загрузки страницы</p>';
        console.error(err);
    }
}

function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
});
aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
});

// Загружаем главную страницу по умолчанию
loadContent('home');

// ---------- Работа с заметками (localStorage) ----------
let notes = []; // массив объектов { id, text, reminder? }

function loadNotesFromStorage() {
    const stored = localStorage.getItem('notes');
    notes = stored ? JSON.parse(stored) : [];
}

function saveNotesToStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function renderNotesList() {
    const list = document.getElementById('notes-list');
    if (!list) return;
    if (notes.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#888;">📭 Нет заметок. Добавьте первую!</div>';
        return;
    }
    // Сортируем по дате добавления (новые сверху)
    const sorted = [...notes].reverse();
    list.innerHTML = sorted.map(note => {
        let reminderHtml = '';
        if (note.reminder) {
            const date = new Date(note.reminder);
            reminderHtml = `<br><small>⏰ Напоминание: ${date.toLocaleString()}</small>`;
        }
        return `
            <li class="note-item" style="background:#f9f9f9; border-radius:16px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${escapeHtml(note.text)}</strong>${reminderHtml}
                </div>
                <button class="delete-note" data-id="${note.id}" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">🗑️</button>
            </li>
        `;
    }).join('');

    // Добавляем обработчики удаления
    document.querySelectorAll('.delete-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            deleteNoteById(id);
        });
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function addNote(text, reminderTimestamp = null) {
    const newNote = {
        id: Date.now(),
        text: text,
        reminder: reminderTimestamp || null
    };
    notes.push(newNote);
    saveNotesToStorage();
    renderNotesList();

    // Отправляем событие через WebSocket
    if (socket && socket.connected) {
        if (reminderTimestamp) {
            socket.emit('newReminder', {
                id: newNote.id,
                text: text,
                reminderTime: reminderTimestamp
            });
        } else {
            socket.emit('newTask', { id: newNote.id, text: text });
        }
    }
}

function deleteNoteById(id) {
    notes = notes.filter(n => n.id !== id);
    saveNotesToStorage();
    renderNotesList();
}

// Инициализация главной страницы (формы и список)
function initNotes() {
    loadNotesFromStorage();
    renderNotesList();

    // Обычная форма
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    if (noteForm) {
        noteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = noteInput.value.trim();
            if (text) {
                addNote(text);
                noteInput.value = '';
            }
        });
    }

    // Форма с напоминанием
    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');
    if (reminderForm) {
        reminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = reminderText.value.trim();
            const timeStr = reminderTime.value;
            if (text && timeStr) {
                const timestamp = new Date(timeStr).getTime();
                if (isNaN(timestamp)) {
                    alert('Некорректная дата');
                    return;
                }
                addNote(text, timestamp);
                reminderText.value = '';
                reminderTime.value = '';
            } else {
                alert('Заполните текст и дату/время');
            }
        });
    }
}

// ---------- WebSocket (Socket.IO) ----------
function initSocket() {
    socket = io('https://localhost:3001', { transports: ['websocket'], secure: true });
    socket.on('connect', () => console.log('WebSocket подключён'));
    socket.on('taskAdded', (task) => {
        console.log('Новая задача от другого клиента:', task);
        // Показываем всплывающее уведомление в интерфейсе
        const toast = document.createElement('div');
        toast.textContent = `✨ Новая заметка: ${task.text}`;
        toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#4285f4; color:white; padding:12px 20px; border-radius:40px; z-index:1000; box-shadow:0 4px 12px rgba(0,0,0,0.2);';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        // Обновляем список заметок (если на главной)
        if (currentPage === 'home') {
            loadNotesFromStorage();
            renderNotesList();
        }
    });
}

// ---------- Push-уведомления (подписка) ----------
function urlBase64ToUint8Array(base64String) {
    // Добавляем padding, если его не хватает
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Push-уведомления не поддерживаются');
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BAHWFuxwI8pDuM7YuRSRygcfvFhPmwsXaJdjgSJKSuIL3wL9JrLjSJhHyndIixfyePd18vqQaay7RwtFK3NUKL8') // замените!
        });
        await fetch('/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        console.log('Подписка на push сохранена');
        enablePushBtn.style.display = 'none';
        disablePushBtn.style.display = 'inline-block';
    } catch (err) {
        console.error('Ошибка подписки:', err);
        alert('Не удалось подписаться на уведомления');
    }
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        await fetch('/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        console.log('Отписка выполнена');
        enablePushBtn.style.display = 'inline-block';
        disablePushBtn.style.display = 'none';
    }
}

// ---------- Регистрация Service Worker и инициализация ----------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker зарегистрирован', reg);
            initSocket();

            // Проверяем статус push-подписки
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
                enablePushBtn.style.display = 'none';
                disablePushBtn.style.display = 'inline-block';
            } else {
                enablePushBtn.style.display = 'inline-block';
                disablePushBtn.style.display = 'none';
            }
            enablePushBtn.addEventListener('click', async () => {
                if (Notification.permission === 'denied') {
                    alert('Уведомления запрещены в браузере. Разрешите в настройках.');
                    return;
                }
                if (Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        alert('Необходимо разрешить уведомления');
                        return;
                    }
                }
                await subscribeToPush();
            });
            disablePushBtn.addEventListener('click', async () => {
                await unsubscribeFromPush();
            });
        } catch (err) {
            console.error('Ошибка регистрации SW:', err);
        }
    });
} else {
    console.warn('Service Worker не поддерживается');
}