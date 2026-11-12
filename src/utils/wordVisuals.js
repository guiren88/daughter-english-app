// Visual Emoji Association, Kawaii Sound Synthesizer & Gamification Data for Kids

const WORD_EMOJI_MAP = {
  // 2A Unit 1 - Morning routine
  'morning': '🌅',
  'good morning': '🌅',
  'up': '⬆️',
  'get up': '🛏️',
  'teeth': '🦷',
  'tooth': '🦷',
  'brush': '🪥',
  'brush my teeth': '🪥',
  'face': '😊',
  'wash': '🧼',
  'wash my face': '🫧',
  'dressed': '👗',
  'ready': '🎒',
  'be ready for': '🎒',
  'mum': '👩',
  'dad': '👨',
  'school': '🏫',
  'checklist': '📋',
  'have breakfast': '🥞',
  'breakfast': '🍳',
  'milk': '🥛',
  'egg': '🥚',

  // 2A Unit 2 - Room & Prepositions
  'room': '🏠',
  'tidy the room': '🧹',
  'box': '📦',
  'in the box': '📦',
  'bed': '🛏️',
  'under the bed': '🛏️',
  'desk': '🪑',
  'on the desk': '🖥️',
  'shelf': '📚',
  'on the shelf': '📚',
  'where': '🔍',
  'mess': '🌪️',
  'toy': '🧸',
  'right': '✅',
  'can': '💪',
  'put': '📥',
  "let's": '🤝',

  // 2A Unit 3 - Transport & London
  'car': '🚗',
  'by car': '🚗',
  'bus': '🚌',
  'by bus': '🚌',
  'underground': '🚇',
  'metro': '🚇',
  'foot': '🦶',
  'on foot': '🚶‍♀️',
  'london': '🎡',
  'bookmark': '🔖',
  'colour': '🎨',
  'postcard': '✉️',
  'a postcard from london': '💌',
  'cut': '✂️',
  'love': '❤️',
  'on the way': '🛣️',
  'i see': '💡',

  // 2A Unit 4 - Sports & Warm-up
  'sports': '🏅',
  'play sports': '🏃‍♀️',
  'run': '🏃',
  'football': '⚽',
  'play football': '⚽',
  'jump': '🦘',
  'basketball': '🏀',
  'play basketball': '🏀',
  'ping-pong': '🏓',
  'play ping-pong': '🏓',
  'best': '🏆',
  'out': '🚩',
  'have a go': '🌟',
  'try again': '🔄',
  'should': '💡',
  'board game': '🎲',
  'do a warm-up': '🤸‍♀️',

  // 2A Unit 5 - Sky & Day/Night
  'sky': '🌤️',
  'in the sky': '🌤️',
  'high in the sky': '☀️',
  'sun': '☀️',
  'moon': '🌙',
  'star': '⭐',
  'cloud': '☁️',
  'behind the clouds': '⛅',
  'high': '🎈',
  'behind': '🙈',
  'bright': '✨',
  'evening': '🌆',
  'in the evening': '🌆',
  'night': '🌌',
  'at night': '🌃',
  'diamond': '💎',
  'come up': '🌅',
  'go down': '🌇',
  'come out': '✨',

  // 2A Unit 6–10 & Common Primary Words
  'sea': '🌊',
  'in the sea': '🌊',
  'seahorse': '🐡',
  'seahorses': '🐡',
  'dolphin': '🐬',
  'dolphins': '🐬',
  'clownfish': '🐠',
  'goldfish': '🐠',
  'fishes': '🐟',
  'clown': '🤡',
  'swim': '🏊‍♀️',
  'small': '🐣',
  'cute': '🥰',
  'spring': '🌸',
  'summer': '🍉',
  'autumn': '🍁',
  'winter': '⛄',
  'warm': '🌷',
  'hot': '🥵',
  'cool': '🍃',
  'cold': '🥶',
  'apple': '🍎',
  'banana': '🍌',
  'orange': '🍊',
  'pear': '🍐',
  'bird': '🐦',
  'cat': '🐱',
  'dog': '🐶',
  'duck': '🦆',
  'hen': '🐔',
  'bee': '🐝',
  'rabbit': '🐰',
  'panda': '🐼',
  'bear': '🐻',
  'lion': '🦁',
  'tiger': '🐯',
  'monkey': '🐵',
  'elephant': '🐘',
  'pig': '🐷',
  'cow': '🐮',
  'horse': '🐴',
  'sheep': '🐑',
  'fish': '🐟',
  'book': '📖',
  'bag': '🎒',
  'schoolbag': '🎒',
  'pencil': '✏️',
  'ruler': '📏',
  'rubber': '🧼',
  'eye': '👀',
  'eyes': '👀',
  'ear': '👂',
  'ears': '👂',
  'mouth': '👄',
  'nose': '👃',
  'head': '🧒',
  'hand': '✋',
  'red': '🔴',
  'blue': '🔵',
  'yellow': '🟡',
  'green': '🟢',
  'pink': '🩷',
  'white': '⚪',
  'black': '⚫',
  'one': '1️⃣',
  'two': '2️⃣',
  'three': '3️⃣',
  'four': '4️⃣',
  'five': '5️⃣',
  'six': '6️⃣',
  'seven': '7️⃣',
  'eight': '8️⃣',
  'nine': '9️⃣',
  'ten': '🔟',
  'kite': '🪁',
  'ball': '⚽',
  'gift': '🎁',
  'house': '🏡',
  'flower': '🌻',
  'tree': '🌳'
};

export function getWordEmoji(word = '', translation = '') {
  const clean = word.trim().toLowerCase();
  if (WORD_EMOJI_MAP[clean]) return WORD_EMOJI_MAP[clean];

  // Partial match on English word
  for (const [key, emoji] of Object.entries(WORD_EMOJI_MAP)) {
    if (key.length >= 3 && clean.includes(key)) {
      return emoji;
    }
  }

  // Fallback match on Chinese translation keywords
  if (translation.includes('太阳')) return '☀️';
  if (translation.includes('月亮') || translation.includes('月球')) return '🌙';
  if (translation.includes('星')) return '⭐';
  if (translation.includes('云')) return '☁️';
  if (translation.includes('天空')) return '🌤️';
  if (translation.includes('钻石')) return '💎';
  if (translation.includes('夜晚') || translation.includes('晚上')) return '🌌';
  if (translation.includes('足球')) return '⚽';
  if (translation.includes('篮球')) return '🏀';
  if (translation.includes('乒乓')) return '🏓';
  if (translation.includes('跑')) return '🏃';
  if (translation.includes('跳')) return '🦘';
  if (translation.includes('运动') || translation.includes('热身')) return '🤸';
  if (translation.includes('车')) return '🚌';
  if (translation.includes('地铁')) return '🚇';
  if (translation.includes('船')) return '⛵';
  if (translation.includes('飞机')) return '✈️';
  if (translation.includes('猫')) return '🐱';
  if (translation.includes('狗')) return '🐶';
  if (translation.includes('鸟')) return '🐦';
  if (translation.includes('鱼') || translation.includes('海')) return '🐬';
  if (translation.includes('苹果')) return '🍎';
  if (translation.includes('书')) return '📚';
  if (translation.includes('床')) return '🛏️';
  if (translation.includes('牙')) return '🦷';
  if (translation.includes('脸')) return '😊';
  if (translation.includes('早餐') || translation.includes('吃')) return '🥞';
  if (translation.includes('春')) return '🌸';
  if (translation.includes('夏')) return '🍉';
  if (translation.includes('秋')) return '🍁';
  if (translation.includes('冬')) return '⛄';

  return '✨';
}

// Companion Mascot Profiles
export const COMPANION_PROFILES = {
  kuromi: {
    name: '酷洛米 Kuromi',
    avatar: '😈',
    foodEmoji: '🍓',
    foodName: '草莓大福',
    quotes: [
      { en: "Let's do our best today!", cn: "今天我们也要竭尽全力哦！" },
      { en: "Wow, you are so smart!", cn: "哇，洛洛今天也太聪明了吧！" },
      { en: "Can we play a word game?", cn: "陪本小姐玩一局单词消消乐嘛！" },
      { en: "Well done! Keep shining!", cn: "做得太棒啦！继续闪闪发光吧！" }
    ]
  },
  melody: {
    name: '美乐蒂 My Melody',
    avatar: '🐰',
    foodEmoji: '🍰',
    foodName: '草莓杏仁蛋糕',
    quotes: [
      { en: "Good morning! Let's learn happily!", cn: "早上好呀！一起开开心心学英语吧！" },
      { en: "You can do it! Don't worry!", cn: "你一定可以做到的，别担心哦！" },
      { en: "Every word is like a little flower!", cn: "背熟的每一个单词都像一朵小花！" },
      { en: "Thank you for studying with me!", cn: "谢谢你今天陪美乐蒂一起学习！" }
    ]
  },
  cinnamoroll: {
    name: '大耳狗 Cinnamoroll',
    avatar: '☁️',
    foodEmoji: 'innamon',
    foodIcon: '🥨',
    foodName: '肉桂卷',
    quotes: [
      { en: "High in the sky! Let's fly together!", cn: "飞向高高的蓝天！我们一起出发吧！" },
      { en: "Soft white clouds and sweet words!", cn: "软软的白云，甜甜的英语单词！" },
      { en: "You are doing a great job!", cn: "你今天表现得超级棒哦！" },
      { en: "Let's collect more shiny stars!", cn: "我们一起去收集更多闪亮星星吧！" }
    ]
  },
  purin: {
    name: '布丁狗 Pompompurin',
    avatar: '🍮',
    foodEmoji: '🍮',
    foodName: '焦糖布丁',
    quotes: [
      { en: "Yummy! Studying makes me happy!", cn: "真美味！学完英语心情美滋滋！" },
      { en: "Have a go! It's super fun!", cn: "勇敢试一试吧！超级好玩的！" },
      { en: "Well done, my best friend!", cn: "做得好，我最好的好朋友！" },
      { en: "Let's play sports after class!", cn: "学完这一课我们去运动吧！" }
    ]
  },
  pikachu: {
    name: '皮卡丘 Pikachu',
    avatar: '⚡',
    foodEmoji: '🍎',
    foodName: '雷电能量果',
    quotes: [
      { en: "Pika Pika! Full power today!", cn: "皮卡皮卡！今天也是电力满满的一天！" },
      { en: "You are a Pokémon Word Master!", cn: "你就是宝可梦单词小大师！" },
      { en: "Run fast and jump high!", cn: "跑得快、跳得高，冲向满分吧！" },
      { en: "Thunderbolt of knowledge!", cn: "十万伏特知识光线发射！" }
    ]
  },
  dark: {
    name: '星际宇航员 Astro',
    avatar: '🪐',
    foodEmoji: '🌟',
    foodName: '星辰能量块',
    quotes: [
      { en: "The little star is like a diamond!", cn: "小星星就像宇宙里的一颗钻石！" },
      { en: "Ready for our space mission?", cn: "准备好开启今天的太空探索了吗？" },
      { en: "Explore the sky and stars!", cn: "去探索广阔的天空与繁星吧！" }
    ]
  }
};

// Level Progression System
export const LEVEL_RANKS = [
  { level: 1, minStars: 0, title: '魔法英语小萌新', badge: '🌱' },
  { level: 2, minStars: 5, title: '闪亮单词小达人', badge: '⭐' },
  { level: 3, minStars: 15, title: '元气阅读小能手', badge: '📖' },
  { level: 4, minStars: 30, title: '三丽鸥荣誉学霸', badge: '🎀' },
  { level: 5, minStars: 50, title: '皇家双语小博士', badge: '👑' },
  { level: 6, minStars: 80, title: '宇宙传奇大魔王', badge: '🦄' }
];

export function getPlayerLevel(stars = 0) {
  let current = LEVEL_RANKS[0];
  let next = LEVEL_RANKS[1];
  for (let i = 0; i < LEVEL_RANKS.length; i++) {
    if (stars >= LEVEL_RANKS[i].minStars) {
      current = LEVEL_RANKS[i];
      next = LEVEL_RANKS[i + 1] || null;
    }
  }
  const progress = next
    ? Math.min(100, Math.round(((stars - current.minStars) / (next.minStars - current.minStars)) * 100))
    : 100;
  return { current, next, progress };
}

// Collectible Sticker Book (12 Adorable Stickers unlocked by Stars & Completed Units)
export const STICKER_COLLECTION = [
  { id: 's1', emoji: '😈', name: '傲娇酷洛米', reqText: '初始赠送', check: (stars, comp) => true },
  { id: 's2', emoji: '🌅', name: '元气早安太阳', reqText: '获得 3 ⭐', check: (stars, comp) => stars >= 3 },
  { id: 's3', emoji: '🐰', name: '甜心美乐蒂', reqText: '获得 5 ⭐', check: (stars, comp) => stars >= 5 },
  { id: 's4', emoji: '🚌', name: '伦敦红巴士', reqText: '获得 10 ⭐', check: (stars, comp) => stars >= 10 },
  { id: 's5', emoji: '☁️', name: '软萌大耳狗', reqText: '获得 15 ⭐', check: (stars, comp) => stars >= 15 },
  { id: 's6', emoji: '🏓', name: '乒乓小冠军', reqText: '获得 20 ⭐', check: (stars, comp) => stars >= 20 },
  { id: 's7', emoji: '🍮', name: '治愈布丁狗', reqText: '获得 25 ⭐', check: (stars, comp) => stars >= 25 },
  { id: 's8', emoji: '💎', name: '夜空小钻石', reqText: '获得 32 ⭐', check: (stars, comp) => stars >= 32 },
  { id: 's9', emoji: '⚡', name: '闪电皮卡丘', reqText: '获得 40 ⭐', check: (stars, comp) => stars >= 40 },
  { id: 's10', emoji: '🏅', name: '单元通关王', reqText: '通关任意 2 个单元', check: (stars, comp) => comp >= 2 },
  { id: 's11', emoji: '🎡', name: '伦敦眼摩天轮', reqText: '通关任意 5 个单元', check: (stars, comp) => comp >= 5 },
  { id: 's12', emoji: '🦄', name: '彩虹独角兽', reqText: '获得 60 ⭐', check: (stars, comp) => stars >= 60 }
];

// Kawaii Web Audio Synthesizer for Game & Pet Feedback
export function playCuteEffect(type = 'pop', step = 0) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const volSaved = localStorage.getItem('oxford_volume');
    const volumeVal = volSaved !== null ? parseFloat(volSaved) : 1.0;
    if (volumeVal === 0) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'note') {
      // Musical xylophone scale (C5 major pentatonic + octave)
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5];
      const freq = scale[step % scale.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14 * Math.min(1.5, volumeVal), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
      setTimeout(() => ctx.close().catch(() => {}), 300);
    } else if (type === 'match') {
      // Sparkle chord arpeggio (C6 - E6 - G6)
      [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12 * Math.min(1.5, volumeVal), now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.26);
      });
      setTimeout(() => ctx.close().catch(() => {}), 500);
    } else if (type === 'pet') {
      // Cute rising chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.18);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12 * Math.min(1.5, volumeVal), now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
      setTimeout(() => ctx.close().catch(() => {}), 300);
    }
  } catch (e) {
    // ignore audio errors
  }
}
