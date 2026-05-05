// Состояние игры
const gameState = {
    player: {
        name: 'Игрок',
        avatar: '😊',
        level: 1,
        xp: 0,
        coins: 500,
        gems: 50,
        inventory: [],
        currentLocation: null
    },
    locations: {
        forest: { name: 'Дремучий лес', icon: '🌲', players: 12, bg: '#1a3a1a' },
        pier: { name: 'Пирс', icon: '⚓', players: 8, bg: '#1a2a3a' },
        mountains: { name: 'Горы', icon: '🏔', players: 5, bg: '#2a2a2a' },
        beach: { name: 'Пляж', icon: '🏖', players: 15, bg: '#3a3a1a' },
        square: { name: 'Площадь', icon: '🏛', players: 20, bg: '#2a1a2a' },
        residential: { name: 'Жилой район', icon: '🏘', players: 10, bg: '#1a2a2a' },
        park: { name: 'Парк', icon: '🌳', players: 18, bg: '#1a3a2a' },
        mall: { name: 'Торговый центр', icon: '🏬', players: 25, bg: '#2a1a1a' }
    },
    shopItems: [
        { id: 'hat1', name: 'Кепка', icon: '🧢', price: 100, type: 'coins' },
        { id: 'hat2', name: 'Корона', icon: '👑', price: 10, type: 'gems' },
        { id: 'pet1', name: 'Котик', icon: '🐱', price: 200, type: 'coins' },
        { id: 'pet2', name: 'Дракон', icon: '🐉', price: 25, type: 'gems' },
        { id: 'toy1', name: 'Мяч', icon: '⚽', price: 50, type: 'coins' },
        { id: 'toy2', name: 'Скейт', icon: '🛹', price: 150, type: 'coins' },
    ],
    chatMessages: [
        { user: 'Система', text: 'Добро пожаловать в Игровой-Мир!' },
        { user: 'Сапфир', text: 'Всем привет! Идём в лес?' },
        { user: 'Элина', text: 'Я на пляже, присоединяйтесь!' },
    ]
};

// Мини-игры для локаций
const miniGames = {
    forest: { name: 'Поиск грибов', type: 'clicker', target: 10, reward: 30 },
    pier: { name: 'Рыбалка', type: 'timing', target: 5, reward: 40 },
    mountains: { name: 'Сбор кристаллов', type: 'clicker', target: 15, reward: 50 },
    beach: { name: 'Волейбол', type: 'timing', target: 8, reward: 35 },
    square: { name: 'Танцевальный батл', type: 'clicker', target: 20, reward: 45 },
    residential: { name: 'Поиск клада', type: 'clicker', target: 12, reward: 60 },
    park: { name: 'Покорми уток', type: 'timing', target: 6, reward: 25 },
    mall: { name: 'Шопинг-челлендж', type: 'clicker', target: 18, reward: 55 }
};

// Аватары игроков в локациях
const playerAvatars = ['🧑', '👩', '👦', '👧', '👨', '👩‍🦰', '🧔', '👱', '👩‍🦱', '🧑‍🦰'];

// Загрузка
document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        updateUI();
    }, 2500);

    // Кнопка назад на карту
    document.getElementById('back-to-map').addEventListener('click', showMap);
    document.getElementById('back-to-location').addEventListener('click', showLocation);

    // Вход в локации
    document.querySelectorAll('.enter-btn').forEach(btn => {
        btn.closest('.location-card').addEventListener('click', function() {
            const locationId = this.dataset.location;
            enterLocation(locationId);
        });
    });

    // Мини-игра
    document.getElementById('mini-game-btn').addEventListener('click', startMiniGame);
    document.getElementById('collect-btn').addEventListener('click', collectBonus);

    // Нижняя панель
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.dataset.view;
            if (view === 'map') showMap();
            if (view === 'shop') openShop();
            if (view === 'inventory') openInventory();
            if (view === 'chat') openChat();
            if (view === 'friends') openFriends();
        });
    });

    // Закрытие модалок
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.add('hidden');
        });
    });

    // Чат
    document.getElementById('send-chat').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Клик по аватару для смены
    document.getElementById('user-avatar').addEventListener('click', changeAvatar);
});

// Загрузка/сохранение
function loadGameState() {
    const saved = localStorage.getItem('igrovoy-mir-save');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.player = { ...gameState.player, ...data.player };
        gameState.chatMessages = data.chatMessages || gameState.chatMessages;
    }
}

function saveGameState() {
    localStorage.setItem('igrovoy-mir-save', JSON.stringify({
        player: gameState.player,
        chatMessages: gameState.chatMessages
    }));
}

// Обновление интерфейса
function updateUI() {
    document.getElementById('username-display').textContent = gameState.player.name;
    document.getElementById('user-avatar').textContent = gameState.player.avatar;
    document.getElementById('coins-count').textContent = gameState.player.coins;
    document.getElementById('gems-count').textContent = gameState.player.gems;
    document.getElementById('level-count').textContent = gameState.player.level;
}

// Навигация
function showMap() {
    document.querySelectorAll('.map-view, .location-view, .minigame-view').forEach(v => v.classList.remove('active'));
    document.getElementById('map-view').classList.add('active');
    gameState.player.currentLocation = null;
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function enterLocation(locationId) {
    const location = gameState.locations[locationId];
    document.querySelectorAll('.map-view, .location-view, .minigame-view').forEach(v => v.classList.remove('active'));
    document.getElementById('location-view').classList.add('active');
    document.getElementById('location-title').textContent = location.icon + ' ' + location.name;
    document.getElementById('scene-area').style.background = location.bg;
    document.getElementById('scene-area').innerHTML = `<p style="font-size:3rem;">${location.icon}</p><p>${location.name}</p>`;
    
    // Генерация игроков в локации
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    const count = Math.floor(Math.random() * 8) + 2;
    for (let i = 0; i < count; i++) {
        const avatar = playerAvatars[Math.floor(Math.random() * playerAvatars.length)];
        const dot = document.createElement('span');
        dot.className = 'player-dot';
        dot.textContent = avatar;
        dot.title = 'Игрок ' + (i + 1);
        playersList.appendChild(dot);
    }
    
    gameState.player.currentLocation = locationId;
    saveGameState();
}

function showLocation() {
    if (gameState.player.currentLocation) {
        enterLocation(gameState.player.currentLocation);
    }
}

// Мини-игры
function startMiniGame() {
    if (!gameState.player.currentLocation) return;
    
    const game = miniGames[gameState.player.currentLocation];
    document.querySelectorAll('.map-view, .location-view, .minigame-view').forEach(v => v.classList.remove('active'));
    document.getElementById('minigame-view').classList.add('active');
    document.getElementById('minigame-title').textContent = '🎮 ' + game.name;
    document.getElementById('minigame-score').textContent = 'Очки: 0 / ' + game.target;
    
    const content = document.getElementById('minigame-content');
    
    if (game.type === 'clicker') {
        let clicks = 0;
        content.innerHTML = `
            <p>Кликай по кнопке как можно быстрее!</p>
            <button id="clicker-btn" style="font-size:3rem;padding:2rem;border-radius:50%;background:#e94560;color:#fff;border:none;cursor:pointer;margin-top:1rem;">
                🎯
            </button>
            <p id="click-count">0 / ${game.target}</p>
        `;
        document.getElementById('clicker-btn').addEventListener('click', () => {
            clicks++;
            document.getElementById('click-count').textContent = clicks + ' / ' + game.target;
            document.getElementById('minigame-score').textContent = 'Очки: ' + clicks + ' / ' + game.target;
            if (clicks >= game.target) {
                winMiniGame(game);
            }
        });
    } else if (game.type === 'timing') {
        let score = 0;
        let position = Math.random() * 200;
        content.innerHTML = `
            <p>Нажми, когда ползунок будет в зелёной зоне!</p>
            <div style="position:relative;height:20px;background:#333;border-radius:10px;margin:2rem 0;">
                <div style="position:absolute;left:40%;width:20%;height:100%;background:#27ae60;border-radius:10px;"></div>
                <div id="timing-slider" style="position:absolute;width:15px;height:25px;background:#e94560;border-radius:5px;top:-3px;left:0%;transition:left 0.05s;"></div>
            </div>
            <button id="timing-btn" style="font-size:1.5rem;padding:1rem 2rem;background:#f39c12;color:#fff;border:none;border-radius:10px;cursor:pointer;">СТОП!</button>
            <p id="timing-score">${score} / ${game.target}</p>
        `;
        
        let moving = true;
        let dir = 1;
        const slider = document.getElementById('timing-slider');
        
        const moveInterval = setInterval(() => {
            if (!moving) return;
            let left = parseFloat(slider.style.left) || 0;
            left += dir * 2;
            if (left >= 90) dir = -1;
            if (left <= 0) dir = 1;
            slider.style.left = left + '%';
        }, 50);
        
        document.getElementById('timing-btn').addEventListener('click', () => {
            const left = parseFloat(slider.style.left) || 0;
            if (left >= 35 && left <= 55) {
                score++;
                document.getElementById('minigame-score').textContent = 'Очки: ' + score + ' / ' + game.target;
                document.getElementById('timing-score').textContent = score + ' / ' + game.target + ' ✅';
                if (score >= game.target) {
                    clearInterval(moveInterval);
                    moving = false;
                    winMiniGame(game);
                }
            } else {
                document.getElementById('timing-score').textContent = score + ' / ' + game.target + ' ❌ Мимо!';
            }
        });
    }
}

function winMiniGame(game) {
    gameState.player.coins += game.reward;
    gameState.player.xp += game.reward;
    if (gameState.player.xp >= gameState.player.level * 100) {
        gameState.player.level++;
        gameState.player.xp = 0;
        alert('🎉 Новый уровень! Теперь ты ' + gameState.player.level + ' уровня!');
    }
    updateUI();
    saveGameState();
    setTimeout(() => {
        alert('🏆 Ты выиграл! Получено 🪙 ' + game.reward + ' монет!');
        showLocation();
    }, 500);
}

function collectBonus() {
    const bonus = Math.floor(Math.random() * 20) + 10;
    gameState.player.coins += bonus;
    updateUI();
    saveGameState();
    alert('🎁 Ты собрал бонус: 🪙 ' + bonus + ' монет!');
}

// Магазин
function openShop() {
    const shopGrid = document.getElementById('shop-items');
    shopGrid.innerHTML = gameState.shopItems.map(item => `
        <div class="shop-item">
            <div class="item-icon">${item.icon}</div>
            <p>${item.name}</p>
            <p style="font-size:0.8rem;color:#888;">${item.price} ${item.type === 'coins' ? '🪙' : '💎'}</p>
            <button onclick="buyItem('${item.id}')">Купить</button>
        </div>
    `).join('');
    document.getElementById('shop-modal').classList.remove('hidden');
}

function buyItem(itemId) {
    const item = gameState.shopItems.find(i => i.id === itemId);
    if (!item) return;
    
    const currency = item.type === 'coins' ? 'coins' : 'gems';
    if (gameState.player[currency] >= item.price) {
        gameState.player[currency] -= item.price;
        gameState.player.inventory.push(item);
        updateUI();
        saveGameState();
        openShop();
        alert('✅ Куплено: ' + item.name + '!');
    } else {
        alert('❌ Недостаточно ' + (item.type === 'coins' ? 'монет' : 'кристаллов'));
    }
}

function openInventory() {
    const invGrid = document.getElementById('inventory-items');
    if (gameState.player.inventory.length === 0) {
        invGrid.innerHTML = '<p style="text-align:center;color:#888;">Пока пусто. Загляни в магазин!</p>';
    } else {
        invGrid.innerHTML = gameState.player.inventory.map(item => `
            <div class="shop-item">
                <div class="item-icon">${item.icon}</div>
                <p>${item.name}</p>
            </div>
        `).join('');
    }
    document.getElementById('inventory-modal').classList.remove('hidden');
}

// Чат
function openChat() {
    renderChat();
    document.getElementById('chat-modal').classList.remove('hidden');
}

function renderChat() {
    const chatDiv = document.getElementById('chat-messages');
    chatDiv.innerHTML = gameState.chatMessages.map(msg => `
        <div class="chat-msg">
            <strong>${msg.user}:</strong> ${msg.text}
        </div>
    `).join('');
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    gameState.chatMessages.push({
        user: gameState.player.name,
        text: text
    });
    input.value = '';
    renderChat();
    saveGameState();
}

// Друзья
function openFriends() {
    document.getElementById('friends-modal').classList.remove('hidden');
}

// Смена аватара
function changeAvatar() {
    const avatars = ['😊', '😎', '🤩', '😇', '🦊', '🐱', '🐶', '🦄', '🤖', '👽'];
    const currentIndex = avatars.indexOf(gameState.player.avatar);
    const nextIndex = (currentIndex + 1) % avatars.length;
    gameState.player.avatar = avatars[nextIndex];
    updateUI();
    saveGameState();
}

// Сохранение при уходе
window.addEventListener('beforeunload', saveGameState);
