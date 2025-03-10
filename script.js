// Инициализация Socket.IO
const socket = io();

class Timer {
    constructor(id) {
        this.timeLeft = 600; // 10 минут в секундах по умолчанию
        this.timerId = null;
        this.initialTime = 600;
        this.warningPlayed = false;
        this.id = id;

        // DOM элементы
        this.displayElement = document.getElementById(`display${id}`);
        this.startBtn = document.getElementById(`startBtn${id}`);
        this.resetBtn = document.getElementById(`resetBtn${id}`);
        this.userNameInput = document.getElementById(`userName${id}`);
        this.timerMinutesInput = document.getElementById(`timerMinutes${id}`);
        this.minutesValueSpan = document.getElementById(`minutesValue${id}`);
        this.section = document.querySelector(`.timer-section.${
            id === 1 ? 'left' : 
            id === 2 ? 'right' : 
            id === 3 ? 'third' : 
            id === 4 ? 'fourth' : 
            'fifth'
        }`);
        this.progressBar = this.section.querySelector('.progress-bar');
        this.backgroundInfo = this.section.querySelector('.background-info');
        this.backgroundUserName = this.section.querySelector('.user-name');
        this.backgroundTimer = this.section.querySelector('.background-timer');
        this.backgroundPause = this.section.querySelector('.background-pause');

        // Привязка методов
        this.startTimer = this.startTimer.bind(this);
        this.resetTimer = this.resetTimer.bind(this);
        this.updateDisplay = this.updateDisplay.bind(this);
        this.updateProgress = this.updateProgress.bind(this);
        this.updateTabTitle = this.updateTabTitle.bind(this);

        // Инициализация слушателей
        this.timerMinutesInput.addEventListener('input', () => {
            const minutes = parseInt(this.timerMinutesInput.value);
            this.minutesValueSpan.textContent = minutes;
            this.timeLeft = minutes * 60;
            this.initialTime = this.timeLeft;
            this.warningPlayed = false;
            this.updateDisplay();
            this.updateProgress();
            updateTimerProportions();
            
            // Отправляем обновление на сервер
            socket.emit('updateTimer', {
                id: this.id,
                timeLeft: this.timeLeft,
                name: this.userNameInput.value,
                isRunning: this.timerId !== null
            });
        });

        this.startBtn.addEventListener('click', this.startTimer);
        this.resetBtn.addEventListener('click', this.resetTimer);
        this.backgroundPause.addEventListener('click', this.startTimer);
        this.userNameInput.addEventListener('input', () => {
            socket.emit('updateTimer', {
                id: this.id,
                name: this.userNameInput.value
            });
        });

        // Инициализация отображения
        this.updateDisplay();
        this.updateProgress();
    }

    updateTabTitle() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${this.userNameInput.value} - ${timeString} | Лимитон`;
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.displayElement.textContent = timeString;
        this.backgroundTimer.textContent = timeString;
        if (this.timerId !== null) {
            this.updateTabTitle();
        }
    }

    updateProgress() {
        const progress = this.timeLeft / this.initialTime;
        this.progressBar.style.transform = `scaleY(${progress})`;
    }

    showBackgroundInfo() {
        this.section.querySelector('.timer-container').classList.add('hidden');
        this.backgroundUserName.textContent = this.userNameInput.value;
        this.backgroundInfo.classList.add('visible');
        this.adjustBackgroundInfoScale();
    }

    adjustBackgroundInfoScale() {
        // Сбрасываем масштаб для правильного измерения
        this.backgroundInfo.style.transform = 'translate(-50%, -50%) scale(1)';
        
        // Получаем размеры
        const sectionWidth = this.section.offsetWidth;
        const infoWidth = this.backgroundInfo.offsetWidth;
        
        if (infoWidth > sectionWidth * 0.9) { // Оставляем 10% отступа
            const scale = (sectionWidth * 0.9) / infoWidth;
            this.backgroundInfo.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }

    hideBackgroundInfo() {
        this.section.querySelector('.timer-container').classList.remove('hidden');
        this.backgroundInfo.classList.remove('visible');
        this.backgroundInfo.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    startTimer() {
        if (this.timerId === null) {
            if (!this.userNameInput.value.trim()) {
                alert('Пожалуйста, введите ваше имя!');
                return;
            }
            this.startBtn.textContent = 'Пауза';
            this.userNameInput.disabled = true;
            this.timerMinutesInput.disabled = true;
            this.warningPlayed = false;
            this.showBackgroundInfo();
            this.updateTabTitle();

            // Отправляем обновление на сервер
            socket.emit('updateTimer', {
                id: this.id,
                timeLeft: this.timeLeft,
                name: this.userNameInput.value,
                isRunning: true
            });

            this.timerId = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                this.updateProgress();

                // Отправляем обновление на сервер
                socket.emit('updateTimer', {
                    id: this.id,
                    timeLeft: this.timeLeft,
                    name: this.userNameInput.value,
                    isRunning: true
                });

                if (this.timeLeft === 300 && !this.warningPlayed) {
                    playSound(warningSound);
                    this.warningPlayed = true;
                }

                if (this.timeLeft === 0) {
                    clearInterval(this.timerId);
                    this.timerId = null;
                    this.hideBackgroundInfo();
                    this.startBtn.textContent = 'Старт';
                    this.userNameInput.disabled = false;
                    this.timerMinutesInput.disabled = false;
                    document.title = 'Лимитон';
                    playSound(finishSound);
                    
                    // Отправляем обновление на сервер
                    socket.emit('updateTimer', {
                        id: this.id,
                        timeLeft: this.timeLeft,
                        name: this.userNameInput.value,
                        isRunning: false
                    });
                }
            }, 1000);
        } else {
            clearInterval(this.timerId);
            this.timerId = null;
            this.startBtn.textContent = 'Старт';
            this.userNameInput.disabled = false;
            this.timerMinutesInput.disabled = false;
            this.hideBackgroundInfo();
            document.title = 'Лимитон';
            
            // Отправляем обновление на сервер
            socket.emit('updateTimer', {
                id: this.id,
                timeLeft: this.timeLeft,
                name: this.userNameInput.value,
                isRunning: false
            });
        }
    }

    resetTimer() {
        clearInterval(this.timerId);
        this.timerId = null;
        this.timeLeft = parseInt(this.timerMinutesInput.value) * 60;
        this.initialTime = this.timeLeft;
        this.warningPlayed = false;
        this.updateDisplay();
        this.updateProgress();
        this.startBtn.textContent = 'Старт';
        this.userNameInput.disabled = false;
        this.timerMinutesInput.disabled = false;
        this.hideBackgroundInfo();
        document.title = 'Лимитон';
        
        // Отправляем обновление на сервер
        socket.emit('updateTimer', {
            id: this.id,
            timeLeft: this.timeLeft,
            name: this.userNameInput.value,
            isRunning: false
        });
        
        updateTimerProportions();
    }
}

// Функция обновления позиций панелей управления
function updateControlPanelPositions() {
    const rightSection = document.querySelector('.timer-section.right');
    const thirdSection = document.querySelector('.timer-section.third');
    const fourthSection = document.querySelector('.timer-section.fourth');
    const fifthSection = document.querySelector('.timer-section.fifth');
    
    const leftContainer = timer1.section.querySelector('.timer-container');
    const rightContainer = timer2.section.querySelector('.timer-container');
    const thirdContainer = timer3.section.querySelector('.timer-container');
    const fourthContainer = timer4.section.querySelector('.timer-container');
    const fifthContainer = timer5.section.querySelector('.timer-container');

    // Один таймер
    if (rightSection.classList.contains('hidden')) {
        leftContainer.style.left = '50%';
    }
    // Два таймера
    else if (thirdSection.classList.contains('hidden')) {
        leftContainer.style.left = '30%';
        rightContainer.style.left = '70%';
    }
    // Три таймера
    else if (fourthSection.classList.contains('hidden')) {
        leftContainer.style.left = '20%';
        rightContainer.style.left = '50%';
        thirdContainer.style.left = '80%';
    }
    // Четыре таймера
    else if (fifthSection.classList.contains('hidden')) {
        leftContainer.style.left = '15%';
        rightContainer.style.left = '38%';
        thirdContainer.style.left = '62%';
        fourthContainer.style.left = '85%';
    }
    // Пять таймеров
    else {
        leftContainer.style.left = '10%';
        rightContainer.style.left = '30%';
        thirdContainer.style.left = '50%';
        fourthContainer.style.left = '70%';
        fifthContainer.style.left = '90%';
    }
}

// Обновляем функцию updateTimerProportions
function updateTimerProportions() {
    const time1 = parseInt(timer1.timerMinutesInput.value);
    const time2 = parseInt(timer2.timerMinutesInput.value);
    const time3 = parseInt(timer3.timerMinutesInput.value);
    const time4 = parseInt(timer4.timerMinutesInput.value);
    const time5 = parseInt(timer5.timerMinutesInput.value);
    
    const totalTime = time1 + 
        (!timer2.section.classList.contains('hidden') ? time2 : 0) + 
        (!timer3.section.classList.contains('hidden') ? time3 : 0) +
        (!timer4.section.classList.contains('hidden') ? time4 : 0) +
        (!timer5.section.classList.contains('hidden') ? time5 : 0);
    
    // Обновляем отображение общего времени
    document.getElementById('totalMinutes').textContent = totalTime;
    socket.emit('updateTotalMinutes', totalTime);
    
    timer1.section.style.flex = time1 / totalTime;
    
    if (!timer2.section.classList.contains('hidden')) {
        timer2.section.style.flex = time2 / totalTime;
    } else {
        timer2.section.style.flex = 0;
    }
    
    if (!timer3.section.classList.contains('hidden')) {
        timer3.section.style.flex = time3 / totalTime;
    } else {
        timer3.section.style.flex = 0;
    }

    if (!timer4.section.classList.contains('hidden')) {
        timer4.section.style.flex = time4 / totalTime;
    } else {
        timer4.section.style.flex = 0;
    }

    if (!timer5.section.classList.contains('hidden')) {
        timer5.section.style.flex = time5 / totalTime;
    } else {
        timer5.section.style.flex = 0;
    }

    updateControlPanelPositions();
}

// Общая функция воспроизведения звука
function playSound(audio) {
    audio.currentTime = 0;
    audio.volume = 1;
    
    audio.play().then(() => {
        // Начинаем плавное затухание за 2 секунды до конца
        setTimeout(() => {
            const fadeInterval = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume -= 0.05;
                } else {
                    clearInterval(fadeInterval);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 1;
                }
            }, 100);
        }, 8000);
    }).catch(error => console.log('Ошибка воспроизведения звука:', error));
}

// Инициализация аудио элементов
const warningSound = document.getElementById('warningSound');
const finishSound = document.getElementById('finishSound');

// Создание экземпляров таймеров
const timer1 = new Timer(1);
const timer2 = new Timer(2);
const timer3 = new Timer(3);
const timer4 = new Timer(4);
const timer5 = new Timer(5);

// Добавляем функционал переключения таймеров
const addTimerButton = document.getElementById('addTimer');
const hideButton2 = document.getElementById('hideTimer');
const hideButton3 = document.getElementById('hideTimer3');
const hideButton4 = document.getElementById('hideTimer4');
const hideButton5 = document.getElementById('hideTimer5');

addTimerButton.addEventListener('click', () => {
    const rightSection = document.querySelector('.timer-section.right');
    const thirdSection = document.querySelector('.timer-section.third');
    const fourthSection = document.querySelector('.timer-section.fourth');
    const fifthSection = document.querySelector('.timer-section.fifth');
    
    let newCount = 1;
    if (rightSection.classList.contains('hidden')) {
        newCount = 2;
    } else if (thirdSection.classList.contains('hidden')) {
        newCount = 3;
    } else if (fourthSection.classList.contains('hidden')) {
        newCount = 4;
    } else if (fifthSection.classList.contains('hidden')) {
        newCount = 5;
    }
    
    socket.emit('updateVisibleTimers', newCount);
});

hideButton2.addEventListener('click', () => {
    const rightSection = document.querySelector('.timer-section.right');
    const thirdSection = document.querySelector('.timer-section.third');
    const fourthSection = document.querySelector('.timer-section.fourth');
    const fifthSection = document.querySelector('.timer-section.fifth');
    
    if (!fifthSection.classList.contains('hidden')) {
        fifthSection.classList.add('hidden');
        timer5.resetTimer();
    }
    if (!fourthSection.classList.contains('hidden')) {
        fourthSection.classList.add('hidden');
        timer4.resetTimer();
    }
    if (!thirdSection.classList.contains('hidden')) {
        thirdSection.classList.add('hidden');
        timer3.resetTimer();
    }
    
    rightSection.classList.add('hidden');
    timer2.resetTimer();
    updateTimerProportions();
});

hideButton3.addEventListener('click', () => {
    const thirdSection = document.querySelector('.timer-section.third');
    const fourthSection = document.querySelector('.timer-section.fourth');
    const fifthSection = document.querySelector('.timer-section.fifth');
    
    if (!fifthSection.classList.contains('hidden')) {
        fifthSection.classList.add('hidden');
        timer5.resetTimer();
    }
    if (!fourthSection.classList.contains('hidden')) {
        fourthSection.classList.add('hidden');
        timer4.resetTimer();
    }
    
    thirdSection.classList.add('hidden');
    timer3.resetTimer();
    updateTimerProportions();
});

hideButton4.addEventListener('click', () => {
    const fourthSection = document.querySelector('.timer-section.fourth');
    const fifthSection = document.querySelector('.timer-section.fifth');
    
    if (!fifthSection.classList.contains('hidden')) {
        fifthSection.classList.add('hidden');
        timer5.resetTimer();
    }
    
    fourthSection.classList.add('hidden');
    timer4.resetTimer();
    updateTimerProportions();
});

hideButton5.addEventListener('click', () => {
    const fifthSection = document.querySelector('.timer-section.fifth');
    fifthSection.classList.add('hidden');
    timer5.resetTimer();
    updateTimerProportions();
});

// Функция полного сброса системы
function resetAllTimers() {
    // Сброс всех таймеров
    [timer1, timer2, timer3, timer4, timer5].forEach(timer => {
        timer.resetTimer();
        if (timer.id !== 1) {
            timer.section.classList.add('hidden');
        }
    });

    // Сброс значений таймеров на 10 минут
    [timer1, timer2, timer3, timer4, timer5].forEach(timer => {
        timer.timerMinutesInput.value = 10;
        timer.minutesValueSpan.textContent = 10;
        timer.timeLeft = 600;
        timer.initialTime = 600;
        timer.updateDisplay();
        timer.updateProgress();
    });

    // Обновление пропорций и позиций
    updateTimerProportions();
}

// Добавляем обработчик для кнопки сброса
const resetAllButton = document.getElementById('resetAll');
resetAllButton.addEventListener('click', () => {
    socket.emit('resetAll');
});

// Инициализация начальных позиций
updateTimerProportions();

// Обработка событий Socket.IO
socket.on('initialState', (state) => {
    // Обновляем состояние всех таймеров
    state.timers.forEach(timerData => {
        const timer = [timer1, timer2, timer3, timer4, timer5].find(t => t.id === timerData.id);
        if (timer) {
            timer.timeLeft = timerData.timeLeft;
            timer.initialTime = timerData.timeLeft;
            timer.userNameInput.value = timerData.name;
            timer.timerMinutesInput.value = Math.floor(timerData.timeLeft / 60);
            timer.minutesValueSpan.textContent = Math.floor(timerData.timeLeft / 60);
            timer.updateDisplay();
            timer.updateProgress();
            
            if (timerData.isRunning) {
                timer.startTimer();
            }
        }
    });
    
    // Обновляем видимость таймеров
    updateVisibleTimers(state.visibleTimers);
    
    // Обновляем общее время
    document.getElementById('totalMinutes').textContent = state.totalMinutes;
});

socket.on('timerUpdated', (timerData) => {
    const timer = [timer1, timer2, timer3, timer4, timer5].find(t => t.id === timerData.id);
    if (timer) {
        if (timerData.timeLeft !== undefined) {
            timer.timeLeft = timerData.timeLeft;
            timer.initialTime = timerData.timeLeft;
            timer.timerMinutesInput.value = Math.floor(timerData.timeLeft / 60);
            timer.minutesValueSpan.textContent = Math.floor(timerData.timeLeft / 60);
        }
        if (timerData.name !== undefined) {
            timer.userNameInput.value = timerData.name;
        }
        if (timerData.isRunning !== undefined) {
            if (timerData.isRunning && timer.timerId === null) {
                timer.startTimer();
            } else if (!timerData.isRunning && timer.timerId !== null) {
                timer.startTimer();
            }
        }
        timer.updateDisplay();
        timer.updateProgress();
    }
});

socket.on('visibleTimersUpdated', (count) => {
    updateVisibleTimers(count);
});

socket.on('allTimersReset', (state) => {
    // Обновляем состояние всех таймеров
    state.timers.forEach(timerData => {
        const timer = [timer1, timer2, timer3, timer4, timer5].find(t => t.id === timerData.id);
        if (timer) {
            timer.timeLeft = timerData.timeLeft;
            timer.initialTime = timerData.timeLeft;
            timer.userNameInput.value = timerData.name;
            timer.timerMinutesInput.value = Math.floor(timerData.timeLeft / 60);
            timer.minutesValueSpan.textContent = Math.floor(timerData.timeLeft / 60);
            timer.updateDisplay();
            timer.updateProgress();
        }
    });
    
    // Обновляем видимость таймеров
    updateVisibleTimers(state.visibleTimers);
    
    // Обновляем общее время
    document.getElementById('totalMinutes').textContent = state.totalMinutes;
});

socket.on('totalMinutesUpdated', (total) => {
    document.getElementById('totalMinutes').textContent = total;
});

// Функция обновления видимости таймеров
function updateVisibleTimers(count) {
    const sections = ['.right', '.third', '.fourth', '.fifth'];
    sections.forEach((section, index) => {
        const element = document.querySelector(`.timer-section${section}`);
        if (element) {
            if (index < count - 1) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    });
    updateTimerProportions();
}
