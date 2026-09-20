// High-Quality Speech Engine & Voice Selector for Oxford English App

let cachedVoices = [];

export function initVoices(callback) {
  if (!('speechSynthesis' in window)) return;

  const update = () => {
    cachedVoices = window.speechSynthesis.getVoices();
    if (callback && cachedVoices.length > 0) {
      callback(cachedVoices);
    }
  };

  update();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = update;
  }
}

// Get the highest quality natural / human-like English voice
export function getBestEnglishVoice(accent = 'us') {
  if (!('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const enVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
  if (enVoices.length === 0) return null;

  // Best natural voice rankings for US and UK
  const usPreferred = [
    'Microsoft Jenny Online (Natural)',
    'Microsoft Aria Online (Natural)',
    'Microsoft Guy Online (Natural)',
    'Ava (Premium)',
    'Ava (Enhanced)',
    'Samantha (Enhanced)',
    'Samantha (Premium)',
    'Samantha',
    'Google US English',
    'Zoe (Premium)',
    'Allison (Enhanced)',
    'Nicky (Enhanced)',
    'Susan',
    'Victoria'
  ];

  const ukPreferred = [
    'Microsoft Sonia Online (Natural)',
    'Microsoft Libby Online (Natural)',
    'Microsoft Ryan Online (Natural)',
    'Google UK English Female',
    'Google UK English Male',
    'Serena (Premium)',
    'Daniel (Enhanced)',
    'Kate (Enhanced)',
    'Oliver (Enhanced)',
    'Stephanie'
  ];

  const preferredOrder = accent === 'uk' ? [...ukPreferred, ...usPreferred] : [...usPreferred, ...ukPreferred];

  // 1. Try matching preferred high-quality natural voices
  for (const name of preferredOrder) {
    const match = enVoices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (match) return match;
  }

  // 2. Filter out famously bad/robotic legacy synthesizer voices (like old macOS Alex, Fred, etc.)
  const roboticFilter = ['alex', 'fred', 'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'good news', 'hysterical', 'pipe organ', 'trinoids', 'whisper', 'zarvox'];
  const naturalFallback = enVoices.find(v => {
    const lowerName = v.name.toLowerCase();
    const isRobotic = roboticFilter.some(bad => lowerName.includes(bad));
    if (accent === 'uk') {
      return !isRobotic && (v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk'));
    }
    return !isRobotic && v.lang.toLowerCase().includes('us');
  });

  if (naturalFallback) return naturalFallback;

  // 3. Fallback to any non-robotic English voice
  const safeFallback = enVoices.find(v => !roboticFilter.some(bad => v.name.toLowerCase().includes(bad)));
  return safeFallback || enVoices[0] || null;
}

// Speak sentence or phrase using the best voice
export function speakNatural(text, {
  rate = 0.85,
  pitch = 1.0,
  accent = 'us',
  volume = 1.0,
  onStart = null,
  onEnd = null,
  onError = null
} = {}) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const cleanText = text.replace(/[\/\\]/g, ' ').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = Math.min(1.0, volume);

  const bestVoice = getBestEnglishVoice(accent);
  if (bestVoice) {
    utterance.voice = bestVoice;
    utterance.lang = bestVoice.lang;
  } else {
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
}
