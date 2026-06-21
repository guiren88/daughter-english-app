import React, { useState, useEffect } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, HelpCircle, FileText, Star, Volume2, VolumeX } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Flashcards from './components/Flashcards'
import Quiz from './components/Quiz'
import Glossary from './components/Glossary'
import Worksheet from './components/Worksheet'
import vocabData from './data/vocabulary.json'

function FloatingDecorations({ theme }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let symbols = ['✨', '⭐', '🎈'];
    let opacity = 0.15;
    
    switch (theme) {
      case 'cinnamoroll':
        symbols = ['☁️', '✨', '🥞', '☕', '💙'];
        opacity = 0.18;
        break;
      case 'melody':
        symbols = ['🐰', '🍓', '🌸', '🎀', '💖'];
        opacity = 0.16;
        break;
      case 'purin':
        symbols = ['🍮', '🍪', '🥞', '⭐️', '💛'];
        opacity = 0.16;
        break;
      case 'dark':
        symbols = ['✨', '⭐', '☄️', '🪐', '👾'];
        opacity = 0.1;
        break;
      case 'kuromi':
      default:
        symbols = ['💀', '😈', '✨', '🖤', '💜'];
        opacity = 0.14;
        break;
    }

    // Generate 15 items with pre-populated positions and timing
    const newItems = Array.from({ length: 15 }, (_, i) => {
      const left = Math.random() * 100;
      const size = 1 + Math.random() * 1.5;
      const delay = Math.random() * -16;
      const duration = 12 + Math.random() * 8;
      const sway = 20 + Math.random() * 50;
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      return {
        id: i,
        symbol,
        style: {
          left: `${left}%`,
          fontSize: `${size}rem`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          '--float-sway': `${sway}px`,
          '--float-opacity': opacity
        }
      };
    });

    setItems(newItems);
  }, [theme]);

  return (
    <div className="floating-decorations no-print">
      {items.map(item => (
        <span 
          key={item.id} 
          className="floating-item"
          style={item.style}
        >
          {item.symbol}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [grade, setGrade] = useState('1b') // '1a' or '1b'
  const [activeView, setActiveView] = useState('dashboard') // 'dashboard', 'flashcards', 'quiz', 'glossary', 'worksheet'
  const [selectedUnit, setSelectedUnit] = useState(null) // null = all units, or unit object
  const [bookmarkedWords, setBookmarkedWords] = useState([])
  const [completedUnits, setCompletedUnits] = useState([])
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('oxford_theme') || 'kuromi';
  });
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  const [showOnlyMistakes, setShowOnlyMistakes] = useState(false);
  const [mistakes, setMistakes] = useState(() => {
    try {
      const saved = localStorage.getItem('oxford_mistakes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Sync mistakes to localStorage
  useEffect(() => {
    localStorage.setItem('oxford_mistakes', JSON.stringify(mistakes));
  }, [mistakes]);

  // Add a mistake (with error count increment)
  const addMistake = (wordObj) => {
    const exists = mistakes.some(m => m.word === wordObj.word && m.grade === grade);
    if (!exists) {
      setMistakes(prev => [...prev, { ...wordObj, grade, errorCount: 1, dateAdded: new Date().toISOString() }]);
    } else {
      setMistakes(prev => prev.map(m => 
        (m.word === wordObj.word && m.grade === grade) 
          ? { ...m, errorCount: (m.errorCount || 1) + 1 } 
          : m
      ));
    }
  };

  // Remove a mistake
  const removeMistake = (word) => {
    setMistakes(prev => prev.filter(m => !(m.word === word && m.grade === grade)));
  };
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('oxford_volume');
    return saved !== null ? parseFloat(saved) : 1.0;
  });

  // Sync volume to localStorage and Web Audio gain
  useEffect(() => {
    localStorage.setItem('oxford_volume', volume.toString());
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Web Audio API refs for volume amplification (up to 300%)
  const audioRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const gainNodeRef = React.useRef(null);
  const sourceNodeRef = React.useRef(null);
  const currentTextRef = React.useRef("");

  const fallbackSpeechSynthesis = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = text.replace(/[\/\\]/g, ' ').trim();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.volume = Math.min(1.0, volume);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Global Text-To-Speech Pronunciation Helper (Web Audio API Youdao TTS with Native Fallback)
  const playAudio = (text) => {
    const cleanedText = text.replace(/[\/\\]/g, ' ').trim();
    currentTextRef.current = cleanedText;

    try {
      // Lazy-initialize Web Audio Context on first play
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        const audio = new Audio();
        audioRef.current = audio;
        
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceNodeRef.current.connect(gainNodeRef.current);
        
        audio.onerror = () => {
          console.warn("TTS proxy loading failed, falling back to native SpeechSynthesis.");
          fallbackSpeechSynthesis(currentTextRef.current);
        };
      }

      // Sync current gain value (supports up to 3.0 volume)
      gainNodeRef.current.gain.value = volume;

      // Stop native speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Load and play Youdao TTS via Vite local proxy
      const encodedText = encodeURIComponent(cleanedText);
      audioRef.current.src = `/api/tts?audio=${encodedText}&type=2`;
      audioRef.current.play().catch(err => {
        console.warn("Audio element play failed, falling back to native SpeechSynthesis:", err);
        fallbackSpeechSynthesis(cleanedText);
      });
    } catch (e) {
      console.error("Web Audio API error, falling back to native SpeechSynthesis:", e);
      fallbackSpeechSynthesis(cleanedText);
    }
  };


  // Sync theme to document body class
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('oxford_theme', theme);
  }, [theme])

  // Get dynamic branding details depending on the selected theme
  const getThemeBrand = () => {
    switch (theme) {
      case 'cinnamoroll':
        return { emoji: '☁️', text: '大耳狗云端英语' };
      case 'melody':
        return { emoji: '🐰', text: '美乐蒂草莓英语' };
      case 'purin':
        return { emoji: '🍮', text: '布丁狗焦糖英语' };
      case 'dark':
        return { emoji: '🌌', text: '黑曜石极简英语' };
      case 'kuromi':
      default:
        return { emoji: '😈', text: '酷洛米魔幻英语' };
    }
  }

  const brand = getThemeBrand();

  // Load user data from localStorage
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem('oxford_bookmarks')
      if (savedBookmarks) {
        setBookmarkedWords(JSON.parse(savedBookmarks))
      }
      const savedCompleted = localStorage.getItem('oxford_completed')
      if (savedCompleted) {
        setCompletedUnits(JSON.parse(savedCompleted))
      }
    } catch (e) {
      console.error("Error loading user progress:", e)
    }
  }, [])

  // Toggle word bookmark
  const toggleBookmark = (wordObj) => {
    let updated;
    const exists = bookmarkedWords.some(w => w.word === wordObj.word && w.grade === grade);
    if (exists) {
      updated = bookmarkedWords.filter(w => !(w.word === wordObj.word && w.grade === grade));
    } else {
      updated = [...bookmarkedWords, { ...wordObj, grade }];
    }
    setBookmarkedWords(updated);
    localStorage.setItem('oxford_bookmarks', JSON.stringify(updated));
  }

  // Toggle unit completed status
  const toggleUnitCompleted = (unitName) => {
    const key = `${grade}_${unitName}`;
    let updated;
    if (completedUnits.includes(key)) {
      updated = completedUnits.filter(u => u !== key);
    } else {
      updated = [...completedUnits, key];
    }
    setCompletedUnits(updated);
    localStorage.setItem('oxford_completed', JSON.stringify(updated));
  }

  // Get current grade units
  const currentUnits = grade === '1a' ? vocabData.grade_1a : vocabData.grade_1b;

  // Handle unit selection
  const handleSelectUnit = (unit, view = 'flashcards') => {
    setSelectedUnit(unit);
    setActiveView(view);
  }

  return (
    <div className="app-container">
      {/* Background decorations */}
      <FloatingDecorations theme={theme} />

      {/* Navigation bar */}
      <nav className="navbar">
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {theme === 'kuromi' ? (
            <img 
              src="/kuromi_icon.png" 
              alt="Kuromi" 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: '2px solid var(--accent-pink)',
                boxShadow: '0 0 10px rgba(236, 72, 153, 0.4)'
              }} 
            />
          ) : (
            <span className="brand-emoji" style={{ fontSize: '1.75rem' }}>{brand.emoji}</span>
          )}
          <span className="nav-brand-text" style={{ fontSize: '1.35rem' }}>{brand.text}</span>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveView('dashboard'); setSelectedUnit(null); }}
          >
            <LayoutDashboard size={18} />
            <span>仪表盘</span>
          </button>
          <button 
            className={`nav-btn ${activeView === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveView('flashcards')}
          >
            <BookOpen size={18} />
            <span>单词卡</span>
          </button>
          <button 
            className={`nav-btn ${activeView === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveView('quiz')}
          >
            <HelpCircle size={18} />
            <span>随堂测</span>
          </button>
          <button 
            className={`nav-btn ${activeView === 'glossary' ? 'active' : ''}`}
            onClick={() => setActiveView('glossary')}
          >
            <Star size={18} />
            <span>词汇看板</span>
          </button>
          <button 
            className={`nav-btn ${activeView === 'worksheet' ? 'active' : ''}`}
            onClick={() => setActiveView('worksheet')}
          >
            <FileText size={18} />
            <span>线下练习纸</span>
          </button>

          {/* Volume Control Slider */}
          <div className="volume-control no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.15)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            {volume === 0 ? (
              <VolumeX size={18} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setVolume(1.0)} />
            ) : (
              <Volume2 size={18} style={{ color: 'var(--accent-pink)', cursor: 'pointer' }} onClick={() => setVolume(0)} />
            )}
            <input 
              type="range" 
              min="0" 
              max="3" 
              step="0.1" 
              value={volume} 
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setVolume(vol);
                // Speak a short feedback tone so the user hears the update
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance("volume");
                  utterance.lang = 'en-US';
                  utterance.volume = Math.min(1.0, vol);
                  window.speechSynthesis.speak(utterance);
                }
              }}
              style={{ 
                width: '70px', 
                cursor: 'pointer', 
                accentColor: 'var(--accent-pink)',
                height: '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                outline: 'none'
              }}
              title={`发音音量: ${Math.round(volume * 100)}%`}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right', fontWeight: 'bold' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Theme Dropdown Selector */}
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="select-dropdown no-print"
            style={{ 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.9rem',
              borderColor: 'var(--accent-pink)',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.15)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            <option value="kuromi" style={{ background: '#15102a', color: '#fff' }}>😈 酷洛米主题</option>
            <option value="cinnamoroll" style={{ background: '#e0f2fe', color: '#0f172a' }}>☁️ 大耳狗主题</option>
            <option value="melody" style={{ background: '#fce7f3', color: '#be185d' }}>🐰 美乐蒂主题</option>
            <option value="purin" style={{ background: '#fef9c3', color: '#854d0e' }}>🍮 布丁狗主题</option>
            <option value="dark" style={{ background: '#111', color: '#fff' }}>🌌 黑曜石主题</option>
          </select>
        </div>
      </nav>

      {/* Main Views Container */}
      <main className="main-content">
        <div key={activeView} className="view-transition">
          {activeView === 'dashboard' && (
            <Dashboard 
              grade={grade} 
              setGrade={setGrade} 
              units={currentUnits} 
              completedUnits={completedUnits}
              bookmarkedWords={bookmarkedWords}
              onSelectUnit={handleSelectUnit}
              onToggleUnitCompleted={toggleUnitCompleted}
              setActiveView={setActiveView}
              setShowOnlyBookmarks={setShowOnlyBookmarks}
              showOnlyMistakes={showOnlyMistakes}
              setShowOnlyMistakes={setShowOnlyMistakes}
              mistakes={mistakes}
            />
          )}
          
          {activeView === 'flashcards' && (
            <Flashcards 
              grade={grade}
              units={currentUnits}
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              bookmarkedWords={bookmarkedWords}
              onToggleBookmark={toggleBookmark}
              onMarkUnitCompleted={toggleUnitCompleted}
              completedUnits={completedUnits}
              playAudio={playAudio}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'quiz' && (
            <Quiz 
              grade={grade}
              units={currentUnits}
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              playAudio={playAudio}
              setActiveView={setActiveView}
              mistakes={mistakes}
              onAddMistake={addMistake}
              onRemoveMistake={removeMistake}
            />
          )}

          {activeView === 'glossary' && (
            <Glossary 
              vocabData={vocabData}
              currentGrade={grade}
              bookmarkedWords={bookmarkedWords}
              onToggleBookmark={toggleBookmark}
              playAudio={playAudio}
              showOnlyBookmarks={showOnlyBookmarks}
              setShowOnlyBookmarks={setShowOnlyBookmarks}
              showOnlyMistakes={showOnlyMistakes}
              setShowOnlyMistakes={setShowOnlyMistakes}
              mistakes={mistakes}
              onRemoveMistake={removeMistake}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'worksheet' && (
            <Worksheet 
              grade={grade}
              units={currentUnits}
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              setActiveView={setActiveView}
            />
          )}
        </div>
      </main>
    </div>
  )
}
