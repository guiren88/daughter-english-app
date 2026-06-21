import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Volume2, Shuffle, Play, Pause, Star, CheckCircle } from 'lucide-react'

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
  setActiveView
}) {
  // If no selected unit, default to the first unit
  const activeUnit = selectedUnit || units[0];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [wordList, setWordList] = useState(activeUnit ? activeUnit.words : []);
  
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
            // Flip to back (show translation)
            // Play audio first
            playAudio(wordList[currentIndex]?.word);
            return true;
          } else {
            // Move to next card and flip back to front
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
      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <option key={u.unit} value={u.unit}>{u.unit}: {u.title}</option>
          ))}
        </select>

        <button 
          className={`ctrl-action-btn ${isUnitCompleted ? 'active' : ''}`}
          onClick={() => onMarkUnitCompleted(activeUnit.unit)}
          style={{ 
            background: isUnitCompleted ? 'var(--accent-green)' : 'rgba(255,255,255,0.03)',
            borderColor: isUnitCompleted ? 'var(--accent-green)' : 'var(--border-glass)',
            boxShadow: isUnitCompleted ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none'
          }}
        >
          <CheckCircle size={18} />
          <span>{isUnitCompleted ? "已通关" : "标记完成"}</span>
        </button>
      </div>

      {/* 3D Card Stage */}
      <div 
        className={`flashcard-stage stagger-item ${isFlipped ? 'flipped' : ''}`}
        style={{ '--index': 0 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flashcard-inner">
          {/* Card Front (English) */}
          <div className="flashcard-front">
            <button 
              className={`bookmark-toggle ${isStarred ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(currentWord);
              }}
            >
              <Star size={24} fill={isStarred ? 'var(--accent-yellow)' : 'transparent'} />
            </button>
            <div className="flashcard-word">{currentWord.word}</div>
            
            <button 
              className="audio-trigger"
              onClick={(e) => {
                e.stopPropagation();
                playAudio(currentWord.word);
              }}
              title="英文发音"
            >
              <Volume2 size={24} />
            </button>
          </div>

          {/* Card Back (Translation) */}
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
            
            <div className="flashcard-trans">{currentWord.translation}</div>
            
            {currentWord.word.length > 0 && (
              <div className="flashcard-extra">
                拼写长度: {currentWord.word.replace(/\s+/g, '').length} 个字母
              </div>
            )}
            
            <button 
              className="audio-trigger"
              onClick={(e) => {
                e.stopPropagation();
                playAudio(currentWord.word);
              }}
              title="英文发音"
            >
              <Volume2 size={24} />
            </button>
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
            💬 单元核心句法复习
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeUnit.sentences.map((sent, index) => (
              <div key={index} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Volume2 
                    size={16} 
                    style={{ color: 'var(--text-muted)', cursor: 'pointer' }} 
                    onClick={() => playAudio(sent.english)}
                  />
                  <span>{sent.english}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
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
