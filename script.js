// ==================== ШАХТЁР-МИР — ЯДРО v2.0 ====================

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
        pickaxe: { level: 1, name: 'Деревянная', power: 1, cost: 500 },
        oilRigs: 0, oilRigCost: 5000, oilRigPower: 2,
        barrels: 0, barrelExchanges: 0, barrelCost: 1000000, barrelCapacity: 10,
        oilStored: 0, maxOilStorage: 50,
        level: 1, xp: 0, xpToLevel: 500,
        energy: 100, maxEnergy: 100, energyRegen: 0.5,
        pets: [], activePet: null,
        boosts: [],
        achievements: [],
        daily: { tasks: [], date: '', claimed: false },
        prestige: 0, prestigeBonus: 0,
        marketPrices: { stone: 1, iron: 3, gold: 10, diamond: 40, crystal: 20, energite: 80, mithril: 400, uranium: 2000 },
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

function fmt(n) {
    if (n >= 1e18) return (n/1e18).toFixed(1)+'Qi';
    if (n >= 1e15) return (n/1e15).toFixed(1)+'Q';
    if (n >= 1e12) return (n/1e12).toFixed(1)+'T';
    if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
    if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (n >= 1e4) return (n/1e3).toFixed(1)+'K';
    return Math.floor(n).toString();
}

// Звуки
const Sound = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(freq, dur, type='square', vol=0.04) {
        try {
            this.init();
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type; o.frequency.value = freq;
            g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(); o.stop(this.ctx.currentTime + dur);
        } catch(e) {}
    },
    dig() { this.play(200, 0.06, 'square', 0.04); },
    rare() { this.play(500, 0.1, 'sine', 0.05); setTimeout(()=>this.play(700,0.1,'sine',0.05), 120); },
    caseOpen() { this.play(300,0.06,'triangle',0.05); setTimeout(()=>this.play(500,0.08,'sine',0.05),150); setTimeout(()=>this.play(700,0.12,'sine',0.06),300); },
    achieve() { [523,659,784].forEach((f,i)=>setTimeout(()=>this.play(f,0.15,'sine',0.05),i*150)); },
    sell() { this.play(250,0.08,'sawtooth',0.04); setTimeout(()=>this.play(350,0.08,'sawtooth',0.04),100); },
    error() { this.play(80,0.2,'sawtooth',0.03); },
};

// Шахтёры
const MINER_DATA = [
    { id:'basic', name:'Новичок', icon:'👷', power:1, cost:0 },
    { id:'speed', name:'Скоростной', icon:'🏃', power:2, cost:500 },
    { id:'strong', name:'Силач', icon:'💪', power:4, cost:2000 },
    { id:'expert', name:'Эксперт', icon:'🧔', power:7, cost:8000 },
    { id:'master', name:'Мастер', icon:'👨‍🔧', power:12, cost:25000 },
    { id:'legend', name:'Легенда', icon:'🦸', power:20, cost:80000 },
    { id:'cyber', name:'Киборг', icon:'🤖', power:35, cost:300000 },
    { id:'magic', name:'Маг', icon:'🧙', power:60, cost:1000000 },
    { id:'cosmic', name:'Космический', icon:'👨‍🚀', power:100, cost:5000000 },
    { id:'god', name:'Бог шахты', icon:'👑', power:180, cost:20000000 },
];

// Кирки
const PICKAXE_NAMES = [
    'Деревянная','Каменная','Железная','Золотая','Алмазная',
    'Нефритовая','Мифриловая','Адамантитовая','Кристальная','Урановая',
    'Лазерная','Плазменная','Квантовая','Тёмная','Светлая',
    'Драконья','Титановая','Энергетическая','Космическая','Божественная'
];

// Кейсы
const CASE_DATA = [
    { id:'common', name:'Обычный', icon:'📦', cost:500, color:'#888' },
    { id:'rare', name:'Редкий', icon:'📦', cost:2500, color:'#2980b9' },
    { id:'epic', name:'Эпический', icon:'🎁', cost:15000, color:'#8e44ad' },
    { id:'legendary', name:'Легендарный', icon:'👑', cost:100000, color:'#f39c12' },
    { id:'oil', name:'Нефтяной', icon:'🛢', cost:30000, color:'#2c3e50' },
    { id:'secret', name:'Тайный', icon:'🔮', cost:500000, color:'#e74c3c' },
];

// Питомцы
const PET_DATA = [
    { id:'dog', name:'Пёс', icon:'🐕', bonus:0.05, cost:10000 },
    { id:'cat', name:'Кот', icon:'🐈', bonus:0.08, cost:25000 },
    { id:'dragon', name:'Дракон', icon:'🐉', bonus:0.15, cost:100000 },
    { id:'phoenix', name:'Феникс', icon:'🦅', bonus:0.2, cost:300000 },
    { id:'golem', name:'Голем', icon:'🗿', bonus:0.3, cost:1000000 },
    { id:'fairy', name:'Фея', icon:'🧚', bonus:0.12, cost:80000 },
    { id:'robot', name:'Робот', icon:'🤖', bonus:0.4, cost:5000000 },
    { id:'unicorn', name:'Единорог', icon:'🦄', bonus:0.6, cost:25000000 },
];

function initAchievements() {
    if (G.achievements.length > 0) return;
    G.achievements = [
        { id:1, name:'Первая руда', desc:'Добыть 50 камня', icon:'🪨', done:false, reward:100 },
        { id:2, name:'Железный', desc:'Добыть 200 железа', icon:'🔩', done:false, reward:500 },
        { id:3, name:'Золотая лихорадка', desc:'Добыть 100 золота', icon:'🥇', done:false, reward:2000 },
        { id:4, name:'Алмазный', desc:'Добыть 50 алмазов', icon:'💎', done:false, reward:5000 },
        { id:5, name:'Кристальный', desc:'Добыть 20 кристаллов', icon:'💠', done:false, reward:10000 },
        { id:6, name:'Энергетик', desc:'Добыть 10 энергита', icon:'⚡', done:false, reward:25000 },
        { id:7, name:'Мифриловый', desc:'Добыть 5 мифрила', icon:'🌟', done:false, reward:50000 },
        { id:8, name:'Урановый', desc:'Добыть 2 урана', icon:'☢', done:false, reward:200000 },
        { id:9, name:'Бригадир', desc:'Нанять 10 шахтёров', icon:'👷', done:false, reward:1000 },
        { id:10, name:'Профи', desc:'Нанять 50 шахтёров', icon:'👨‍🔧', done:false, reward:10000 },
        { id:11, name:'Кирка 5', desc:'Кирка 5 уровня', icon:'🧰', done:false, reward:5000 },
        { id:12, name:'Кирка 10', desc:'Кирка 10 уровня', icon:'⚒', done:false, reward:50000 },
        { id:13, name:'Нефтяник', desc:'Добыть 200 нефти', icon:'🛢', done:false, reward:3000 },
        { id:14, name:'Барон', desc:'Купить 5 вышек', icon:'🏭', done:false, reward:25000 },
        { id:15, name:'Бочкоман', desc:'Обменять бочки 3 раза', icon:'🛢', done:false, reward:100000 },
        { id:16, name:'Коллекционер', desc:'Открыть 10 кейсов', icon:'📦', done:false, reward:5000 },
        { id:17, name:'Хранитель', desc:'Открыть 50 кейсов', icon:'🎁', done:false, reward:100000 },
        { id:18, name:'Миллионер', desc:'1 000 000💰', icon:'💰', done:false, reward:50000 },
        { id:19, name:'Миллиардер', desc:'1 000 000 000💰', icon:'💎', done:false, reward:5000000 },
        { id:20, name:'10 уровень', desc:'Достичь 10 уровня', icon:'⭐', done:false, reward:2000 },
        { id:21, name:'50 уровень', desc:'Достичь 50 уровня', icon:'🌟', done:false, reward:100000 },
        { id:22, name:'Престиж 1', desc:'Первый престиж', icon:'🔄', done:false, reward:10000 },
        { id:23, name:'Престиж 5', desc:'5 престижей', icon:'🔁', done:false, reward:500000 },
        { id:24, name:'Друг', desc:'Купить питомца', icon:'🐉', done:false, reward:5000 },
        { id:25, name:'Зоопарк', desc:'5 питомцев', icon:'🦄', done:false, reward:500000 },
    ];
}

function initDaily() {
    const today = new Date().toDateString();
    if (G.daily.date === today) return;
    G.daily = {
        tasks: [
            { desc:'Добыть 500 камня', target:500, current:0, reward:200 },
            { desc:'Продать на 1000💰', target:1000, current:0, reward:300 },
            { desc:'Открыть 1 кейс', target:1, current:0, reward:500 },
            { desc:'Собрать 50 нефти', target:50, current:0, reward:250 },
            { desc:'Сделать 200 кликов', target:200, current:0, reward:150 },
        ],
        date: today, claimed: false,
    };
}

function getMinersPower() {
    let power = 0;
    MINER_DATA.forEach(m => { power += (G.miners[m.id]||0) * m.power; });
    return power;
}

function getPetBonus() {
    if (!G.activePet) return 0;
    const pet = PET_DATA.find(p => p.id === G.activePet);
    return pet ? pet.bonus : 0;
}

function getPrestigeBonus() { return G.prestige * 0.05; }

function getBoostMultiplier() {
    let mult = 1;
    G.boosts = G.boosts.filter(b => b.endTime > Date.now());
    G.boosts.forEach(b => mult *= b.mult);
    return mult;
}

function getClickPower() {
    const base = G.pickaxe.power + getMinersPower() * 0.05;
    const petBonus = getPetBonus();
    const prestigeBonus = getPrestigeBonus();
    const boostMult = getBoostMultiplier();
    return Math.max(1, Math.floor(base * (1 + petBonus + prestigeBonus) * boostMult));
}

function getAutoPower() {
    const base = getMinersPower() * 0.3;
    const petBonus = getPetBonus();
    const prestigeBonus = getPrestigeBonus();
    const boostMult = getBoostMultiplier();
    return Math.max(0, Math.floor(base * (1 + petBonus + prestigeBonus) * boostMult));
}

function getOilRate() { return G.oilRigs * G.oilRigPower; }

function getCurrentOre() {
    const total = G.totalOresMined;
    if (total >= 100000) return { name:'Уран', icon:'☢', key:'uranium' };
    if (total >= 50000) return { name:'Мифрил', icon:'🌟', key:'mithril' };
    if (total >= 20000) return { name:'Энергит', icon:'⚡', key:'energite' };
    if (total >= 8000) return { name:'Кристалл', icon:'💠', key:'crystal' };
    if (total >= 3000) return { name:'Алмаз', icon:'💎', key:'diamond' };
    if (total >= 1000) return { name:'Золото', icon:'🥇', key:'gold' };
    if (total >= 300) return { name:'Железо', icon:'🔩', key:'iron' };
    return { name:'Камень', icon:'🪨', key:'stone' };
}

function checkAchievements() {
    let found = false;
    G.achievements.forEach(a => {
        if (a.done) return;
        let check = false;
        switch(a.id) {
            case 1: check=G.ores.stone>=50; break;
            case 2: check=G.ores.iron>=200; break;
            case 3: check=G.ores.gold>=100; break;
            case 4: check=G.ores.diamond>=50; break;
            case 5: check=G.ores.crystal>=20; break;
            case 6: check=G.ores.energite>=10; break;
            case 7: check=G.ores.mithril>=5; break;
            case 8: check=G.ores.uranium>=2; break;
            case 9: check=Object.values(G.miners).reduce((a,b)=>a+b,0)>=10; break;
            case 10: check=Object.values(G.miners).reduce((a,b)=>a+b,0)>=50; break;
            case 11: check=G.pickaxe.level>=5; break;
            case 12: check=G.pickaxe.level>=10; break;
            case 13: check=G.ores.oil>=200; break;
            case 14: check=G.oilRigs>=5; break;
            case 15: check=G.barrelExchanges>=3; break;
            case 16: check=G.stats.casesOpened>=10; break;
            case 17: check=G.stats.casesOpened>=50; break;
            case 18: check=G.coins>=1e6; break;
            case 19: check=G.coins>=1e9; break;
            case 20: check=G.level>=10; break;
            case 21: check=G.level>=50; break;
            case 22: check=G.prestige>=1; break;
            case 23: check=G.prestige>=5; break;
            case 24: check=G.pets.length>=1; break;
            case 25: check=G.pets.length>=5; break;
        }
        if (check) { a.done=true; G.coins+=a.reward; found=true; showToast(a.icon,a.name,'+'+fmt(a.reward)+'💰'); Sound.achieve(); }
    });
    if (found) saveGame();
}

function checkDailyTasks() {
    if (G.daily.claimed) return;
    G.daily.tasks.forEach(t => {
        if (t.desc.includes('Добыть')) t.current = G.ores.stone;
        if (t.desc.includes('Продать')) t.current = G.stats.coinsEarned;
        if (t.desc.includes('Открыть')) t.current = G.stats.casesOpened;
        if (t.desc.includes('Собрать')) t.current = G.stats.oilCollected;
        if (t.desc.includes('Сделать')) t.current = G.stats.clicks;
    });
    if (G.daily.tasks.every(t=>t.current>=t.target) && !G.daily.claimed) {
        G.daily.claimed=true;
        const total=G.daily.tasks.reduce((a,t)=>a+t.reward,0);
        G.coins+=total; G.diamonds+=1;
        showToast('🎯','Все задания!','+'+fmt(total)+'💰 +1💎');
        Sound.achieve(); saveGame();
    }
}

function showToast(icon, title, text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toast-icon').textContent = icon;
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-text').textContent = text;
    toast.classList.remove('hidden');
    setTimeout(()=>toast.classList.add('hidden'), 3000);
}

function updateEnergy() { if(G.energy<G.maxEnergy) G.energy=Math.min(G.maxEnergy,G.energy+G.energyRegen); }
function checkLevelUp() { while(G.xp>=G.xpToLevel){G.xp-=G.xpToLevel;G.level++;G.xpToLevel=Math.floor(G.xpToLevel*1.6);G.coins+=G.level*100;if(G.level>G.stats.maxLevel)G.stats.maxLevel=G.level;} }

initAchievements();
initDaily();

// Авто-сохранение
setInterval(()=>{updateEnergy();checkDailyTasks();saveGame();}, 10000);

// Авто-добыча
setInterval(()=>{
    const ap=getAutoPower();
    if(ap>0){const ore=getCurrentOre();G.ores[ore.key]+=ap;G.totalOresMined+=ap;G.xp+=ap;}
    const or=getOilRate();
    if(or>0){const max=50+G.barrels*10*G.barrelCapacity;G.oilStored=Math.min(max,G.oilStored+or);G.ores.oil+=or;G.stats.oilCollected+=or;}
    checkLevelUp();
},1000);

setInterval(()=>{if(G.energy<G.maxEnergy){G.energy=Math.min(G.maxEnergy,G.energy+0.5);}},2000);

window.addEventListener('beforeunload',saveGame);
