import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Volume2, Shuffle, Play, Pause, Star, CheckCircle, Gamepad2, Sparkles } from 'lucide-react'
import { getWordEmoji, playCuteEffect } from '../utils/wordVisuals'
import { speakNatural } from '../utils/speech'

export default function Flashcards({
  grade,
  units,
  selectedUnit,
  setSelectedUnit,
  bookmarkedWords,
  onToggleBookmark,
  onMarkUnitCompleted,
  completedUnits,
  playAudio,
  onAwardStars,
  setActiveView
}) {
  // If no selected unit, default to the newest unit or first unit
  const activeUnit = selectedUnit || units.find(u => u.isNew) || units[0];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [wordList, setWordList] = useState(activeUnit ? activeUnit.words : []);
  const [masteredWords, setMasteredWords] = useState([]);

  const autoPlayTimer = useRef(null);

  // Sync state when active unit changes
  useEffect(() => {
    if (activeUnit) {
      setWordList(activeUnit.words);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsAutoPlaying(false);
    }
  }, [activeUnit])

  // Stop auto-play when unmounted or when index changes manually
  useEffect(() => {
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    }
  }, [])

  // Auto-play logic
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimer.current = setInterval(() => {
        setIsFlipped(prev => {
          if (!prev) {
            playAudio(wordList[currentIndex]?.word);
            return true;
          } else {
            setIsFlipped(false);
            setCurrentIndex(prevIndex => (prevIndex + 1) % wordList.length);
            return false;
          }
        });
      }, 3500);
    } else {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    }
  }, [isAutoPlaying, currentIndex, wordList])

  if (!activeUnit || wordList.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>未找到单元或该单元暂无词汇。</h3>
      </div>
    );
  }

  const currentWord = wordList[currentIndex];
  const isStarred = bookmarkedWords.some(w => w.word === currentWord.word && w.grade === grade);
  const wordEmoji = getWordEmoji(currentWord.word, currentWord.translation);
  const isWordMastered = masteredWords.includes(`${grade}_${activeUnit.unit}_${currentWord.word}`);

  const playSlowAudio = (text) => {
    speakNatural(text, {
      rate: 0.55,
      pitch: 1.05,
      accent: 'us',
      volume: 1.0
    });
  };

  const handleMasterWord = (e) => {
    e.stopPropagation();
    const key = `${grade}_${activeUnit.unit}_${currentWord.word}`;
    if (!masteredWords.includes(key)) {
      setMasteredWords(prev => [...prev, key]);
      playCuteEffect('match');
      if (onAwardStars) onAwardStars(1);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % wordList.length);
    }, 150);
  }

  const handlePrev = () => {
    setIsFlipped(false);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + wordList.length) % wordList.length);
    }, 150);
  }

  const handleShuffle = () => {
    setIsFlipped(false);
    setIsAutoPlaying(false);
    setTimeout(() => {
      const shuffled = [...wordList].sort(() => Math.random() - 0.5);
      setWordList(shuffled);
      setCurrentIndex(0);
    }, 150);
  }

  const handleResetOrder = () => {
    setIsFlipped(false);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setWordList(activeUnit.words);
      setCurrentIndex(0);
    }, 150);
  }

  const isUnitCompleted = completedUnits.includes(`${grade}_${activeUnit.unit}`);

  return (
    <div className="flashcards-view">
      {/* Unit Selector */}
      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          className="ctrl-action-btn"
          onClick={() => {
            setActiveView('dashboard');
            setSelectedUnit(null);
          }}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <ChevronLeft size={16} />
          <span>返回目录</span>
        </button>

        <select 
          className="select-dropdown"
          value={activeUnit.unit}
          onChange={(e) => {
            const found = units.find(u => u.unit === e.target.value);
            if (found) setSelectedUnit(found);
          }}
          style={{ flex: 1, maxWidth: '280px' }}
        >
          {units.map(u => (
            <option key={u.unit} value={u.unit}>
              {u.unit}: {u.title}{u.isNew ? ' ✨ (NEW)' : ''}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="ctrl-action-btn"
            onClick={() => {
              setSelectedUnit(activeUnit);
              setActiveView('games');
            }}
            style={{
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '0.5rem 0.95rem',
              fontWeight: 'bold'
            }}
          >
            <Gamepad2 size={17} />
            <span>玩本课游戏</span>
          </button>

          <button 
            className={`ctrl-action-btn ${isUnitCompleted ? 'active' : ''}`}
            onClick={() => onMarkUnitCompleted(activeUnit.unit)}
            style={{ 
              background: isUnitCompleted ? 'var(--accent-green)' : 'rgba(255,255,255,0.03)',
              borderColor: isUnitCompleted ? 'var(--accent-green)' : 'var(--border-glass)',
              boxShadow: isUnitCompleted ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
              borderRadius: '20px'
            }}
          >
            <CheckCircle size={18} />
            <span>{isUnitCompleted ? "已通关" : "标记完成"}</span>
          </button>
        </div>
      </div>

      {/* 3D Card Stage */}
      <div 
        className={`flashcard-stage stagger-item ${isFlipped ? 'flipped' : ''}`}
        style={{ '--index': 0 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flashcard-inner">
          {/* Card Front (English + Vivid Emoji) */}
          <div className="flashcard-front">
            <button 
              className={`bookmark-toggle ${isStarred ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(currentWord);
              }}
              title="加入重点收藏夹"
            >
              <Star size={24} fill={isStarred ? 'var(--accent-yellow)' : 'transparent'} />
            </button>

            <div style={{ fontSize: '4.2rem', lineHeight: 1.1, marginBottom: '0.35rem', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))' }}>
              {wordEmoji}
            </div>
            <div className="flashcard-word">{currentWord.word}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              👆 点击卡片翻转看中文意思
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                className="audio-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentWord.word);
                }}
                title="标准发音"
                style={{ width: 'auto', height: '42px', padding: '0 1rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold' }}
              >
                <Volume2 size={20} />
                <span>标准读</span>
              </button>
              <button 
                className="audio-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  playSlowAudio(currentWord.word);
                }}
                title="慢速跟读"
                style={{ width: 'auto', height: '42px', padding: '0 1rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 'bold' }}
              >
                <span>🐢</span>
                <span>慢速读</span>
              </button>
            </div>
          </div>

          {/* Card Back (Translation + Mastery Stamp) */}
          <div className="flashcard-back">
            <button 
              className={`bookmark-toggle ${isStarred ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(currentWord);
              }}
            >
              <Star size={24} fill={isStarred ? 'var(--accent-yellow)' : 'transparent'} />
            </button>

            <div style={{ fontSize: '3.4rem', lineHeight: 1.1, marginBottom: '0.25rem' }}>
              {wordEmoji}
            </div>
            <div className="flashcard-trans">{currentWord.translation}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '0.15rem' }}>
              {currentWord.word}
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.9rem', alignItems: 'center' }}>
              <button 
                className="audio-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentWord.word);
                }}
                title="英文发音"
                style={{ width: '42px', height: '42px' }}
              >
                <Volume2 size={20} />
              </button>

              <button
                onClick={handleMasterWord}
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: isWordMastered ? 'default' : 'pointer',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: isWordMastered
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: isWordMastered ? '#fff' : '#1e1b4b',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sparkles size={16} />
                <span>{isWordMastered ? '已学会! +1⭐' : '我记住啦! (+1⭐)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'var(--text-secondary)' }}>
        <span>词卡进度: {currentIndex + 1} / {wordList.length}</span>
        <button 
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={handleResetOrder}
        >
          恢复默认顺序
        </button>
      </div>

      <div className="controls-row">
        <button className="ctrl-btn" onClick={handlePrev} title="上一个">
          <ChevronLeft size={24} />
        </button>

        <button 
          className="ctrl-action-btn"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          style={{ width: '140px', justifyContent: 'center' }}
        >
          {isAutoPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span>{isAutoPlaying ? "暂停播放" : "自动播放"}</span>
        </button>

        <button className="ctrl-btn" onClick={handleShuffle} title="随机打乱">
          <Shuffle size={20} />
        </button>

        <button className="ctrl-btn" onClick={handleNext} title="下一个">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Sentence / Syntax Review Panel below */}
      {activeUnit.sentences && activeUnit.sentences.length > 0 && (
        <div className="glass-card stagger-item" style={{ width: '100%', marginTop: '1.5rem', '--index': 1 }}>
          <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
            💬 单元核心句法复习 (点击喇叭听标准朗读)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeUnit.sentences.map((sent, index) => (
              <div key={index} style={{ padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => playAudio(sent.english)}
                    style={{ background: 'rgba(236,72,153,0.18)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent-pink)' }}
                    title="正常语速"
                  >
                    <Volume2 size={16} />
                  </button>
                  <button
                    onClick={() => playSlowAudio(sent.english)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '12px', padding: '0.15rem 0.45rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    title="慢速跟读"
                  >
                    🐢 慢读
                  </button>
                  <span style={{ fontSize: '1.05rem' }}>{sent.english}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem', paddingLeft: '2.4rem' }}>
                  {sent.chinese}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar Tips Box */}
      {activeUnit.tips && activeUnit.tips.length > 0 && (
        <div className="glass-card stagger-item" style={{ width: '100%', borderLeft: '4px solid var(--accent-pink)', '--index': 2 }}>
          <h4 style={{ color: 'var(--accent-pink)', marginBottom: '0.75rem' }}>💡 备考提示 & 学习建议</h4>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {activeUnit.tips.map((tip, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem' }}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
