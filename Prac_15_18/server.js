const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ========== VAPID-ключи ==========
const vapidKeys = {
    publicKey: 'BAHWFuxwI8pDuM7YuRSRygcfvFhPmwsXaJdjgSJKSuIL3wL9JrLjSJhHyndIixfyePd18vqQaay7RwtFK3NUKL8',
    privateKey: 'RRgwPTEvrzX8b-Sq0cFNfLrqW9brr3RuhI_RV-ACX_Q'
};

webpush.setVapidDetails(
    'mailto:kurdenkoff.ivan@yandex.ru',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Раздача статических файлов из корня проекта
app.use(express.static(path.join(__dirname, './')));

// Хранилище push-подписок (в реальном проекте используйте БД)
let subscriptions = [];

// Хранилище активных напоминаний (таймеры)
const reminders = new Map(); // key = reminderId (число), value = { timeoutId, text, reminderTime }

// ========== HTTP эндпоинты для подписок ==========
app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    console.log('Новая подписка, всего:', subscriptions.length);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('Подписка удалена, осталось:', subscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

// ========== Эндпоинт для откладывания напоминания ==========
app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(400).json({ error: 'Reminder not found' });
    }
    const reminder = reminders.get(reminderId);
    clearTimeout(reminder.timeoutId);  // отменяем старый таймер

    const newDelay = 5 * 60 * 1000; // 5 минут
    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: '⏰ Напоминание (отложенное)',
            body: reminder.text,
            reminderId: reminderId
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
        });
        reminders.delete(reminderId);
    }, newDelay);

    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + newDelay
    });
    console.log(`Напоминание ${reminderId} отложено на 5 минут`);
    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

// ========== Socket.IO сервер ==========
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log('Клиент подключён:', socket.id);

    // Обычная новая задача (без напоминания)
    socket.on('newTask', (task) => {
        console.log('newTask:', task);
        // Рассылаем всем клиентам
        io.emit('taskAdded', task);
        // Отправляем push-уведомление всем подписанным
        const payload = JSON.stringify({
            title: '📝 Новая заметка',
            body: task.text,
            reminderId: null
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
        });
    });

    // Новая задача с напоминанием
    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        const delay = reminderTime - Date.now();
        if (delay <= 0) {
            console.log('Напоминание в прошлом, игнорируем');
            return;
        }
        // Устанавливаем таймер
        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({
                title: '⏰ Напоминание',
                body: text,
                reminderId: id
            });
            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
            });
            reminders.delete(id);
        }, delay);
        reminders.set(id, { timeoutId, text, reminderTime });
        console.log(`Напоминание ${id} запланировано через ${delay} мс`);
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключён:', socket.id);
    });
});

// ========== Запуск HTTPS сервера ==========
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+2.pem'))
};
const PORT = 3001;
const httpsServer = require('https').createServer(httpsOptions, app);
// Переназначаем socket.io на HTTPS сервер
const io2 = require('socket.io')(httpsServer, { cors: { origin: "*" } });
// Заменим io на io2 (проще пересоздать)
// Для простоты перезапишем обработчики
httpsServer.listen(PORT, () => {
    console.log(`✅ Сервер запущен на https://localhost:${PORT}`);
});

// Переносим обработчики с io на io2
io2.on('connection', (socket) => {
    console.log('Клиент подключён (https):', socket.id);
    socket.on('newTask', (task) => {
        io2.emit('taskAdded', task);
        const payload = JSON.stringify({ title: '📝 Новая заметка', body: task.text, reminderId: null });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
        });
    });
    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        const delay = reminderTime - Date.now();
        if (delay <= 0) return;
        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({ title: '⏰ Напоминание', body: text, reminderId: id });
            subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error(err)));
            reminders.delete(id);
        }, delay);
        reminders.set(id, { timeoutId, text, reminderTime });
    });
    socket.on('disconnect', () => console.log('disconnected'));
});

// Также оставляем старый HTTP эндпоинты (они работают)