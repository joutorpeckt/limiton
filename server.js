const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Статические файлы
app.use(express.static('./'));

// Хранение состояния таймеров
let timersState = {
    timers: [
        { id: 1, name: 'Таймер 1', timeLeft: 600, isRunning: false },
        { id: 2, name: 'Таймер 2', timeLeft: 600, isRunning: false },
        { id: 3, name: 'Таймер 3', timeLeft: 600, isRunning: false },
        { id: 4, name: 'Таймер 4', timeLeft: 600, isRunning: false },
        { id: 5, name: 'Таймер 5', timeLeft: 600, isRunning: false }
    ],
    visibleTimers: 1,
    totalMinutes: 10
};

io.on('connection', (socket) => {
    // Отправляем текущее состояние новому клиенту
    socket.emit('initialState', timersState);

    // Обработка обновления состояния таймера
    socket.on('updateTimer', (timerData) => {
        const timerIndex = timersState.timers.findIndex(t => t.id === timerData.id);
        if (timerIndex !== -1) {
            timersState.timers[timerIndex] = { ...timersState.timers[timerIndex], ...timerData };
            io.emit('timerUpdated', timerData);
        }
    });

    // Обработка добавления/скрытия таймеров
    socket.on('updateVisibleTimers', (count) => {
        timersState.visibleTimers = count;
        io.emit('visibleTimersUpdated', count);
    });

    // Обработка сброса всех таймеров
    socket.on('resetAll', () => {
        timersState.timers = timersState.timers.map(timer => ({
            ...timer,
            timeLeft: 600,
            isRunning: false
        }));
        timersState.visibleTimers = 1;
        timersState.totalMinutes = 10;
        io.emit('allTimersReset', timersState);
    });

    // Обработка обновления общего времени
    socket.on('updateTotalMinutes', (total) => {
        timersState.totalMinutes = total;
        io.emit('totalMinutesUpdated', total);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 