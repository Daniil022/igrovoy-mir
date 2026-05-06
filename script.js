// ==================== ШАХТЁР-МИР — ЯДРО ====================

// Загрузка данных
function loadGame() {
    const raw = localStorage.getItem('shahter-mir');
    if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
    }
    return getDefaults();
}

function getDefaults() {
    return {
        coins: 100, diamonds: 0,
        ores: { stone: 0, iron: 0, gold: 0, diamond: 0, crystal: 0, energite: 0, mithril: 0, uranium: 0 },
        totalOresMined: 0,
        miners: { basic: 1, speed: 0, strong: 0, expert: 0, master: 0, legend: 0, cyber: 0, magic: 0, cosmic: 0, god: 0 },
        pickaxe: { level: 1, name: 'Деревянная', power: 1, cost: 100 },
        oilRigs: 0, oilRigCost: 200, oilRigPower: 1,
        barrels: 0, barrelExchanges: 0, barrelCost: 1000000, barrelCapacity: 10,
        oilStored: 0, maxOilStorage: 50,
        level: 1, xp: 0, xpToLevel: 100,
        energy: 100, maxEnergy: 100, energyRegen: 0.5,
        pets: [],
        activePet: null,
        boosts: [],
        achievements: [],
        daily: { tasks: [], date: '', claimed: false },
        prestige: 0, prestigeBonus: 0,
        marketPrices: { stone: 1, iron: 5, gold: 25, diamond: 100, crystal: 50, energite: 200, mithril: 1000, uranium: 5000 },
        stats: { clicks: 0, casesOpened: 0, coinsEarned: 0, maxLevel: 1, oilCollected: 0 },
        theme: 'dark',
        lastSave: Date.now(),
    };
}

let G = loadGame();

function saveGame() {
    G.lastSave = Date.now();
    localStorage.setItem('shahter-mir', JSON.stringify(G));
}

// Форматирование чисел
function fmt(n) {
    if (n >= 1e18) return (n/1e18).toFixed(2)+'Qi';
    if (n >= 1e15) return (n/1e15).toFixed(2)+'Q';
    if (n >= 1e12) return (n/1e12).toFixed(2)+'T';
    if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
    if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
    if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
    return Math.floor(n).toString();
}

// Звуки
const Sound = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(freq, dur, type='square', vol=0.06) {
        try {
            this.init();
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type;
            o.frequency.value = freq;
            g.gain.value = vol;
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            o.connect(g);
            g.connect(this.ctx.destination);
            o.start();
            o.stop(this.ctx.currentTime + dur);
        } catch(e) {}
    },
    dig() { this.play(180, 0.08, 'square', 0.05); },
    rare() { this.play(500, 0.12, 'sine', 0.06); setTimeout(()=>this.play(700,0.12,'sine',0.06), 120); },
    epic() { this.play(600,0.1,'triangle',0.07); setTimeout(()=>this.play(800,0.1,'triangle',0.07),100); setTimeout(()=>this.play(1000,0.15,'sine',0.07),200); },
    caseOpen() { this.play(300,0.08,'triangle',0.06); setTimeout(()=>this.play(500,0.1,'sine',0.07),150); setTimeout(()=>this.play(700,0.15,'sine',0.08),300); },
    achieve() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.play(f,0.18,'sine',0.06),i*130)); },
    sell() { this.play(250,0.1,'sawtooth',0.05); setTimeout(()=>this.play(350,0.1,'sawtooth',0.05),100); },
    click() { this.play(150,0.05,'square',0.03); },
    error() { this.play(80,0.25,'sawtooth',0.04); },
};

// Данные шахтёров
const MINER_DATA = [
    { id:'basic', name:'Новичок', icon:'👷', power:1, cost:0, desc:'Базовый шахтёр' },
    { id:'speed', name:'Скоростной', icon:'🏃', power:3, cost:100, desc:'Копает быстрее' },
    { id:'strong', name:'Силач', icon:'💪', power:5, cost:300, desc:'Сильный удар' },
    { id:'expert', name:'Эксперт', icon:'🧔', power:10, cost:800, desc:'Опытный шахтёр' },
    { id:'master', name:'Мастер', icon:'👨‍🔧', power:20, cost:2000, desc:'Мастер кирки' },
    { id:'legend', name:'Легенда', icon:'🦸', power:40, cost:6000, desc:'Легендарный' },
    { id:'cyber', name:'Киборг', icon:'🤖', power:80, cost:15000, desc:'Робот-шахтёр' },
    { id:'magic', name:'Маг', icon:'🧙', power:150, cost:40000, desc:'Магическая сила' },
    { id:'cosmic', name:'Космический', icon:'👨‍🚀', power:300, cost:100000, desc:'Из космоса' },
    { id:'god', name:'Бог шахты', icon:'👑', power:600, cost:300000, desc:'Божественная мощь' },
];

// Данные кирок
const PICKAXE_NAMES = [
    'Деревянная','Каменная','Железная','Золотая','Алмазная',
    'Нефритовая','Мифриловая','Адамантитовая','Кристальная','Урановая',
    'Лазерная','Плазменная','Квантовая','Тёмная','Светлая',
    'Драконья','Титановая','Энергетическая','Космическая','Божественная'
];

// Данные кейсов
const CASE_DATA = [
    { id:'common', name:'Обычный', icon:'📦', cost:150, color:'#888', desc:'Базовые ресурсы' },
    { id:'rare', name:'Редкий', icon:'📦', cost:500, color:'#2980b9', desc:'Шанс на редкое' },
    { id:'epic', name:'Эпический', icon:'🎁', cost:1500, color:'#8e44ad', desc:'Эпический лут' },
    { id:'legendary', name:'Легендарный', icon:'👑', cost:5000, color:'#f39c12', desc:'Легендарные призы' },
    { id:'oil', name:'Нефтяной', icon:'🛢', cost:800, color:'#2c3e50', desc:'Нефть и бочки' },
    { id:'secret', name:'Тайный', icon:'🔮', cost:10000, color:'#e74c3c', desc:'Секретные предметы' },
];

// Данные питомцев
const PET_DATA = [
    { id:'dog', name:'Пёс', icon:'🐕', bonus:0.1, cost:500, desc:'+10% к добыче' },
    { id:'cat', name:'Кот', icon:'🐈', bonus:0.15, cost:800, desc:'+15% к удаче' },
    { id:'dragon', name:'Дракон', icon:'🐉', bonus:0.3, cost:3000, desc:'+30% к добыче' },
    { id:'phoenix', name:'Феникс', icon:'🦅', bonus:0.4, cost:8000, desc:'+40% к энергии' },
    { id:'golem', name:'Голем', icon:'🗿', bonus:0.5, cost:20000, desc:'+50% к силе' },
    { id:'fairy', name:'Фея', icon:'🧚', bonus:0.25, cost:5000, desc:'+25% к удаче' },
    { id:'robot', name:'Робот', icon:'🤖', bonus:0.6, cost:50000, desc:'+60% к авто' },
    { id:'unicorn', name:'Единорог', icon:'🦄', bonus:1.0, cost:100000, desc:'x2 ко всему' },
];

// Ачивки
function initAchievements() {
    if (G.achievements.length > 0) return;
    G.achievements = [
        { id:1, name:'Первая руда', desc:'Добыть 10 камня', icon:'🪨', done:false, reward:20 },
        { id:2, name:'Железный человек', desc:'Добыть 50 железа', icon:'🔩', done:false, reward:50 },
        { id:3, name:'Золотая лихорадка', desc:'Добыть 25 золота', icon:'🥇', done:false, reward:100 },
        { id:4, name:'Алмазный король', desc:'Добыть 10 алмазов', icon:'💎', done:false, reward:200 },
        { id:5, name:'Кристальный', desc:'Добыть 5 кристаллов', icon:'💠', done:false, reward:300 },
        { id:6, name:'Энергетик', desc:'Добыть 3 энергита', icon:'⚡', done:false, reward:500 },
        { id:7, name:'Мифриловый', desc:'Добыть 2 мифрила', icon:'🌟', done:false, reward:800 },
        { id:8, name:'Урановый магнат', desc:'Добыть 1 уран', icon:'☢', done:false, reward:1500 },
        { id:9, name:'Бригадир', desc:'Нанять 5 шахтёров', icon:'👷', done:false, reward:100 },
        { id:10, name:'Профи', desc:'Нанять 20 шахтёров', icon:'👨‍🔧', done:false, reward:500 },
        { id:11, name:'Киркоман', desc:'Улучшить кирку до 5 уровня', icon:'🧰', done:false, reward:200 },
        { id:12, name:'Мастер кирки', desc:'Улучшить кирку до 10 уровня', icon:'⚒', done:false, reward:1000 },
        { id:13, name:'Нефтяник', desc:'Добыть 50 нефти', icon:'🛢', done:false, reward:150 },
        { id:14, name:'Нефтяной барон', desc:'Купить 3 вышки', icon:'🏭', done:false, reward:500 },
        { id:15, name:'Бочкоман', desc:'Обменять бочки 3 раза', icon:'🛢', done:false, reward:2000 },
        { id:16, name:'Коллекционер', desc:'Открыть 5 кейсов', icon:'📦', done:false, reward:300 },
        { id:17, name:'Хранитель кейсов', desc:'Открыть 25 кейсов', icon:'🎁', done:false, reward:1500 },
        { id:18, name:'Миллионер', desc:'Накопить 1 000 000 монет', icon:'💰', done:false, reward:5000 },
        { id:19, name:'Миллиардер', desc:'Накопить 1 000 000 000 монет', icon:'💎', done:false, reward:50000 },
        { id:20, name:'10 уровень', desc:'Достичь 10 уровня', icon:'⭐', done:false, reward:200 },
        { id:21, name:'50 уровень', desc:'Достичь 50 уровня', icon:'🌟', done:false, reward:2000 },
        { id:22, name:'Престиж 1', desc:'Сделать первый престиж', icon:'🔄', done:false, reward:500 },
        { id:23, name:'Престиж 10', desc:'Сделать 10 престижей', icon:'🔁', done:false, reward:10000 },
        { id:24, name:'Друг шахтёра', desc:'Купить питомца', icon:'🐉', done:false, reward:300 },
        { id:25, name:'Зоопарк', desc:'Купить 5 питомцев', icon:'🦄', done:false, reward:5000 },
    ];
}

// Ежедневные задания
function initDaily() {
    const today = new Date().toDateString();
    if (G.daily.date === today) return;
    G.daily = {
        tasks: [
            { desc:'Добыть 100 камня', target:100, current:0, reward:50 },
            { desc:'Продать руды на 200💰', target:200, current:0, reward:75 },
            { desc:'Открыть 1 кейс', target:1, current:0, reward:100 },
            { desc:'Собрать 20 нефти', target:20, current:0, reward:60 },
            { desc:'Сделать 50 кликов', target:50, current:0, reward:40 },
        ],
        date: today,
        claimed: false,
    };
}

// Общий доход от шахтёров в секунду
function getMinersPower() {
    let power = 0;
    MINER_DATA.forEach(m => {
        power += (G.miners[m.id] || 0) * m.power;
    });
    return power;
}

// Общий бонус от питомца
function getPetBonus() {
    if (!G.activePet) return 0;
    const pet = PET_DATA.find(p => p.id === G.activePet);
    return pet ? pet.bonus : 0;
}

// Бонус от престижа
function getPrestigeBonus() {
    return G.prestige * 0.1; // +10% за престиж
}

// Буст-множитель
function getBoostMultiplier() {
    let mult = 1;
    G.boosts = G.boosts.filter(b => b.endTime > Date.now());
    G.boosts.forEach(b => mult *= b.mult);
    return mult;
}

// Общая сила клика
function getClickPower() {
    const base = G.pickaxe.power + getMinersPower() * 0.1;
    const petBonus = getPetBonus();
    const prestigeBonus = getPrestigeBonus();
    const boostMult = getBoostMultiplier();
    return Math.max(1, Math.floor(base * (1 + petBonus + prestigeBonus) * boostMult));
}

// Авто-добыча в секунду
function getAutoPower() {
    const base = getMinersPower() * 0.5;
    const petBonus = getPetBonus();
    const prestigeBonus = getPrestigeBonus();
    const boostMult = getBoostMultiplier();
    return Math.max(0, Math.floor(base * (1 + petBonus + prestigeBonus) * boostMult));
}

// Добыча нефти в секунду
function getOilRate() {
    return G.oilRigs * G.oilRigPower;
}

// Получить текущую руду по прогрессу
function getCurrentOre() {
    const total = G.totalOresMined;
    if (total >= 10000) return { name:'Уран', icon:'☢', key:'uranium', color:'#2ecc71' };
    if (total >= 5000) return { name:'Мифрил', icon:'🌟', key:'mithril', color:'#3498db' };
    if (total >= 2000) return { name:'Энергит', icon:'⚡', key:'energite', color:'#f39c12' };
    if (total >= 1000) return { name:'Кристалл', icon:'💠', key:'crystal', color:'#e91e90' };
    if (total >= 400) return { name:'Алмаз', icon:'💎', key:'diamond', color:'#00bcd4' };
    if (total >= 150) return { name:'Золото', icon:'🥇', key:'gold', color:'#ffc107' };
    if (total >= 40) return { name:'Железо', icon:'🔩', key:'iron', color:'#9e9e9e' };
    return { name:'Камень', icon:'🪨', key:'stone', color:'#795548' };
}

// Проверка ачивок
function checkAchievements() {
    let newAchieve = false;
    G.achievements.forEach(a => {
        if (a.done) return;
        let check = false;
        switch(a.id) {
            case 1: check = G.ores.stone >= 10; break;
            case 2: check = G.ores.iron >= 50; break;
            case 3: check = G.ores.gold >= 25; break;
            case 4: check = G.ores.diamond >= 10; break;
            case 5: check = G.ores.crystal >= 5; break;
            case 6: check = G.ores.energite >= 3; break;
            case 7: check = G.ores.mithril >= 2; break;
            case 8: check = G.ores.uranium >= 1; break;
            case 9: check = Object.values(G.miners).reduce((a,b)=>a+b,0) >= 5; break;
            case 10: check = Object.values(G.miners).reduce((a,b)=>a+b,0) >= 20; break;
            case 11: check = G.pickaxe.level >= 5; break;
            case 12: check = G.pickaxe.level >= 10; break;
            case 13: check = G.ores.oil >= 50; break;
            case 14: check = G.oilRigs >= 3; break;
            case 15: check = G.barrelExchanges >= 3; break;
            case 16: check = G.stats.casesOpened >= 5; break;
            case 17: check = G.stats.casesOpened >= 25; break;
            case 18: check = G.coins >= 1000000; break;
            case 19: check = G.coins >= 1000000000; break;
            case 20: check = G.level >= 10; break;
            case 21: check = G.level >= 50; break;
            case 22: check = G.prestige >= 1; break;
            case 23: check = G.prestige >= 10; break;
            case 24: check = G.pets.length >= 1; break;
            case 25: check = G.pets.length >= 5; break;
        }
        if (check) {
            a.done = true;
            G.coins += a.reward;
            newAchieve = true;
            showToast(a.icon, a.name, a.desc);
            Sound.achieve();
        }
    });
    if (newAchieve) saveGame();
}

// Проверка ежедневных
function checkDailyTasks() {
    if (G.daily.claimed) return;
    G.daily.tasks.forEach(t => {
        switch(t.desc.split(' ')[0]) {
            case 'Добыть': t.current = G.ores.stone; break;
            case 'Продать': t.current = G.stats.coinsEarned; break;
            case 'Открыть': t.current = G.stats.casesOpened; break;
            case 'Собрать': t.current = G.stats.oilCollected; break;
            case 'Сделать': t.current = G.stats.clicks; break;
        }
    });
    if (G.daily.tasks.every(t => t.current >= t.target) && !G.daily.claimed) {
        G.daily.claimed = true;
        const totalReward = G.daily.tasks.reduce((a,t)=>a+t.reward,0);
        G.coins += totalReward;
        G.diamonds += 1;
        showToast('🎯', 'Все задания дня!', `+${totalReward}💰 +1💎`);
        Sound.achieve();
        saveGame();
    }
}

// Показать тост
function showToast(icon, title, text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toast-icon').textContent = icon;
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-text').textContent = text;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Обновить энергию
function updateEnergy() {
    if (G.energy < G.maxEnergy) {
        G.energy = Math.min(G.maxEnergy, G.energy + G.energyRegen);
    }
}

// Проверка уровня
function checkLevelUp() {
    while (G.xp >= G.xpToLevel) {
        G.xp -= G.xpToLevel;
        G.level++;
        G.xpToLevel = Math.floor(G.xpToLevel * 1.5);
        G.coins += G.level * 50;
        if (G.level > G.stats.maxLevel) G.stats.maxLevel = G.level;
    }
}

// Инициализация
initAchievements();
initDaily();

// Авто-сохранение и обновление
setInterval(() => {
    updateEnergy();
    checkDailyTasks();
    saveGame();
    updateAllUI();
}, 10000);

// Авто-добыча
setInterval(() => {
    const autoPower = getAutoPower();
    if (autoPower > 0) {
        const ore = getCurrentOre();
        G.ores[ore.key] += autoPower;
        G.totalOresMined += autoPower;
        G.xp += autoPower;
    }
    // Нефть
    const oilRate = getOilRate();
    if (oilRate > 0) {
        const maxStore = 50 + G.barrels * 10 * G.barrelCapacity;
        G.oilStored = Math.min(maxStore, G.oilStored + oilRate);
        G.ores.oil += oilRate;
        G.stats.oilCollected += oilRate;
    }
    checkLevelUp();
    updateAllUI();
}, 1000);

// Энергия реген
setInterval(() => {
    if (G.energy < G.maxEnergy) {
        G.energy = Math.min(G.maxEnergy, G.energy + 0.5);
        updateAllUI();
    }
}, 2000);

// Обновление UI
function updateAllUI() {
    // Общие элементы
    const els = {
        coins: document.getElementById('coins'),
        diamonds: document.getElementById('diamonds'),
        oil: document.getElementById('oil'),
        energy: document.getElementById('energy'),
        level: document.getElementById('level'),
    };
    if (els.coins) els.coins.textContent = fmt(G.coins);
    if (els.diamonds) els.diamonds.textContent = fmt(G.diamonds);
    if (els.oil) els.oil.textContent = fmt(G.ores.oil);
    if (els.energy) els.energy.textContent = Math.floor(G.energy);
    if (els.level) els.level.textContent = G.level;
    
    // XP бар
    const xpFill = document.getElementById('xp-fill');
    const xpMini = document.getElementById('xp-mini');
    if (xpFill) xpFill.style.width = (G.xp / G.xpToLevel * 100) + '%';
    if (xpMini) xpMini.style.width = (G.xp / G.xpToLevel * 100) + '%';
}

// Сохранение перед уходом
window.addEventListener('beforeunload', saveGame);
