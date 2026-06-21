import React, { useState, useEffect } from 'react'
import { Check, X, Award, RefreshCw, Volume2, HelpCircle, ChevronLeft, AlertCircle } from 'lucide-react'

export default function Quiz({ grade, units, selectedUnit, setSelectedUnit, playAudio, setActiveView, mistakes, onAddMistake, onRemoveMistake }) {
  const activeUnit = selectedUnit || null;

  const [quizMode, setQuizMode] = useState('eng-to-chi'); // 'eng-to-chi', 'chi-to-eng', 'spelling'
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // for multiple choice
  const [typedAnswer, setTypedAnswer] = useState(''); // for spelling
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answeredList, setAnsweredList] = useState([]); // track user answers for review
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  // Generate questions list
  const startQuiz = (customWords = null, targetUnit = null) => {
    // Gather vocabulary pool
    let pool = [];
    const activeUnitForQuiz = targetUnit !== null ? targetUnit : activeUnit;
    if (customWords) {
      pool = customWords;
    } else if (activeUnitForQuiz) {
      pool = [...activeUnitForQuiz.words];
    } else {
      units.forEach(unit => {
        pool = [...pool, ...unit.words];
      });
    }

    if (pool.length === 0) {
      alert("无可用的单词以生成测试卷！");
      return;
    }

    const generalPool = units.flatMap(unit => unit.words);

    if (quizMode !== 'spelling' && generalPool.length < 4) {
      alert("词库词量不足以生成测试卷的的干扰选项！");
      return;
    }

    // Shuffle and pick words (all custom words or up to 10 standard pool words)
    const selectedWords = customWords 
      ? [...pool].sort(() => Math.random() - 0.5)
      : [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    
    // Build questions structure
    const generatedQuestions = selectedWords.map(wordObj => {
      // Pick 3 wrong options from the general pool of current grade
      const wrongOptions = generalPool
        .filter(w => w.word !== wordObj.word)
        .filter((v, i, a) => a.findIndex(t => t.word === v.word) === i)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const options = [wordObj, ...wrongOptions].sort(() => Math.random() - 0.5);

      return {
        wordObj,
        options,
        correctIndex: options.findIndex(opt => opt.word === wordObj.word)
      }
    });

    setQuestions(generatedQuestions);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setAnsweredList([]);
    setQuizFinished(false);
    setShowConfetti(false);
    setQuizStarted(true);
  }



  // Play audio automatically when question loads
  useEffect(() => {
    if (quizStarted && !quizFinished && questions.length > 0) {
      const q = questions[currentQIndex];
      // In spelling mode or eng-to-chi, play the audio automatically
      if (quizMode === 'eng-to-chi' || quizMode === 'spelling') {
        setTimeout(() => {
          playAudio(q.wordObj.word);
        }, 300);
      }
    }
  }, [quizStarted, currentQIndex, quizMode, questions, quizFinished])

  // Handle choice submission
  const handleAnswerClick = (index) => {
    if (selectedAnswer !== null) return; // prevent double clicks
    
    setSelectedAnswer(index);
    const q = questions[currentQIndex];
    const isCorrect = index === q.correctIndex;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      onAddMistake(q.wordObj);
    }

    setAnsweredList(prev => [...prev, {
      word: q.wordObj.word,
      translation: q.wordObj.translation,
      userAnswer: q.options[index].translation,
      correctAnswer: q.wordObj.translation,
      isCorrect
    }]);

    // Play pronunciation on click to reinforce
    playAudio(q.wordObj.word);

    // Auto proceed after 1.5 seconds
    setTimeout(() => {
      proceedToNext();
    }, 1500);
  }

  // Handle spelling submission
  const handleSpellingSubmit = (e) => {
    e.preventDefault();
    if (selectedAnswer !== null) return; // already submitted

    const q = questions[currentQIndex];
    const cleanUser = typedAnswer.trim().toLowerCase();
    const cleanCorrect = q.wordObj.word.trim().toLowerCase();
    const isCorrect = cleanUser === cleanCorrect;

    setSelectedAnswer(isCorrect ? 1 : 0); // use index 1 for correct, 0 for wrong in state tracking
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      onAddMistake(q.wordObj);
    }

    setAnsweredList(prev => [...prev, {
      word: q.wordObj.word,
      translation: q.wordObj.translation,
      userAnswer: typedAnswer,
      correctAnswer: q.wordObj.word,
      isCorrect
    }]);

    playAudio(q.wordObj.word);

    setTimeout(() => {
      proceedToNext();
    }, 1800);
  }

  const proceedToNext = () => {
    setSelectedAnswer(null);
    setTypedAnswer('');
    
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // Quiz finished
      setQuizFinished(true);
      if (score + (selectedAnswer !== null && selectedAnswer !== -1 ? 1 : 0) === questions.length) {
        // Perfect score confetti trigger!
        setShowConfetti(true);
      }
    }
  }

  // Handle quiz timeout
  const handleTimeout = () => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(-1);
    const q = questions[currentQIndex];
    onAddMistake(q.wordObj);

    setAnsweredList(prev => [...prev, {
      word: q.wordObj.word,
      translation: q.wordObj.translation,
      userAnswer: '超时未答',
      correctAnswer: quizMode === 'spelling' ? q.wordObj.word : q.wordObj.translation,
      isCorrect: false
    }]);

    playAudio(q.wordObj.word);

    setTimeout(() => {
      proceedToNext();
    }, 1800);
  }

  // Reset timer on new question
  useEffect(() => {
    if (quizStarted && !quizFinished && selectedAnswer === null) {
      setTimeLeft(10);
    }
  }, [quizStarted, currentQIndex, selectedAnswer, quizFinished]);

  // Quiz countdown timer effect
  useEffect(() => {
    if (!quizStarted || quizFinished || selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, currentQIndex, selectedAnswer, quizFinished, questions]);

  // Confetti generator cells
  const renderConfetti = () => {
    if (!showConfetti) return null;
    return Array.from({ length: 50 }).map((_, idx) => {
      const left = Math.random() * 100;
      const animationDelay = Math.random() * 2;
      const color = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'][idx % 5];
      return (
        <div 
          key={idx} 
          className="confetti" 
          style={{ 
            left: `${left}%`, 
            animationDelay: `${animationDelay}s`,
            background: color
          }}
        />
      );
    });
  }

  return (
    <div className="quiz-container">
      {renderConfetti()}

      {/* Mode settings layout */}
      {!quizStarted ? (
        <div className="glass-card stagger-item" style={{ padding: '2.5rem', textAlign: 'center', '--index': 0 }}>
          <HelpCircle size={48} style={{ color: 'var(--accent-violet)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>
            随堂测验 & 词汇打卡
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px', margin: '0 auto 2.5rem auto' }}>
            <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>选择测验形式:</div>
            
            <label className="option-btn" style={{ cursor: 'pointer', transform: 'none' }}>
              <span>🇬🇧 英文 ➜ 🇨🇳 中文 (多选一)</span>
              <input 
                type="radio" 
                name="quizMode" 
                checked={quizMode === 'eng-to-chi'} 
                onChange={() => setQuizMode('eng-to-chi')}
                style={{ cursor: 'pointer' }}
              />
            </label>

            <label className="option-btn" style={{ cursor: 'pointer', transform: 'none' }}>
              <span>🇨🇳 中文 ➜ 🇬🇧 英文 (多选一)</span>
              <input 
                type="radio" 
                name="quizMode" 
                checked={quizMode === 'chi-to-eng'} 
                onChange={() => setQuizMode('chi-to-eng')}
                style={{ cursor: 'pointer' }}
              />
            </label>

            <label className="option-btn" style={{ cursor: 'pointer', transform: 'none' }}>
              <span>✏️ 英文拼写挑战 (看中文手写拼入)</span>
              <input 
                type="radio" 
                name="quizMode" 
                checked={quizMode === 'spelling'} 
                onChange={() => setQuizMode('spelling')}
                style={{ cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {activeUnit ? `测验范围: ${activeUnit.unit} - ${activeUnit.title}` : `测验范围: 全量词库 (共 ${units.reduce((acc,u)=>acc+u.words.length,0)} 个单词)`}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="action-btn" onClick={() => startQuiz()} style={{ padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}>
              开始测试 (共10题)
            </button>
            <button 
              className="ctrl-action-btn"
              onClick={() => {
                setActiveView('dashboard');
                setSelectedUnit(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.9rem 2.5rem', borderRadius: '30px' }}
            >
              <ChevronLeft size={18} />
              <span>返回目录</span>
            </button>
          </div>
        </div>
      ) : quizFinished ? (
        /* Results summary */
        <div className="glass-card results-screen stagger-item" style={{ '--index': 0 }}>
          <Award size={64} style={{ color: score === questions.length ? 'var(--accent-yellow)' : 'var(--accent-violet)' }} />
          <h2>测试报告</h2>
          
          <div className="score-badge">
            {Math.round((score / questions.length) * 100)}分
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            您一共答对了 <strong>{score}</strong> 题 / 满分 {questions.length} 题
          </p>

          {score === questions.length && (
            <div style={{ color: 'var(--accent-pink)', fontWeight: 'bold', fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>
              🎉 太棒了！拿到满分！
            </div>
          )}

          {/* User Answers details listing */}
          <div style={{ width: '100%', marginTop: '2rem', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              答题详情回顾:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {answeredList.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${item.isCorrect ? 'var(--accent-green)' : '#ef4444'}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.word}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.translation}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: item.isCorrect ? 'var(--accent-green)' : '#ef4444' }}>
                      您的回答: {item.userAnswer}
                    </span>
                    {item.isCorrect ? <Check size={18} style={{ color: 'var(--accent-green)' }} /> : <X size={18} style={{ color: '#ef4444' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {answeredList.some(item => !item.isCorrect) && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              color: '#f87171',
              fontSize: '0.9rem',
              marginTop: '1.5rem',
              textAlign: 'left',
              width: '100%'
            }} className="no-print">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>答错的单词已自动加入【错题本】。你可以在首页【错题本】或【词汇看板】中专门复习它们。</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {activeUnit !== null && (() => {
              const currentIdx = units.findIndex(u => u.unit === activeUnit.unit);
              const hasNext = currentIdx !== -1 && currentIdx < units.length - 1;
              if (!hasNext) return null;
              
              const nextUnit = units[currentIdx + 1];
              return (
                <button 
                  className="action-btn"
                  onClick={() => {
                    setSelectedUnit(nextUnit);
                    startQuiz(null, nextUnit);
                  }}
                  style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <span>➡️ 测试下一单元 ({nextUnit.unit})</span>
                </button>
              );
            })()}

            <button className="action-btn" onClick={() => startQuiz()}>
              <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
              重新测试
            </button>

            {answeredList.some(item => !item.isCorrect) && (
              <button 
                className="action-btn" 
                onClick={() => {
                  const wrongWords = answeredList
                    .filter(item => !item.isCorrect)
                    .map(item => {
                      const found = units.flatMap(u => u.words).find(w => w.word === item.word);
                      return found || { word: item.word, translation: item.correctAnswer };
                    });
                  startQuiz(wrongWords);
                }}
                style={{ background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-violet))' }}
              >
                📋 重新挑战错题
              </button>
            )}

            <button 
              className="action-btn" 
              onClick={() => setQuizStarted(false)}
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-glass)', border: '1px solid' }}
            >
              返回大纲
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Gameplay Stage */
        <div className="glass-card stagger-item" style={{ '--index': 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }} className="no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ 
                fontSize: '0.9rem', 
                background: timeLeft <= 3 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)', 
                color: timeLeft <= 3 ? '#ef4444' : 'var(--accent-yellow)',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                border: `1px solid ${timeLeft <= 3 ? '#ef4444' : 'var(--accent-yellow)'}`,
                fontWeight: 'bold',
                animation: timeLeft <= 3 ? 'pulse 1s infinite' : 'none'
              }}>
                ⏱️ 倒计时: {timeLeft}s
              </span>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("确定要退出本次测试吗？当前进度将不会被保存。")) {
                  setQuizStarted(false);
                }
              }}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer',
                fontSize: '0.85rem',
                textDecoration: 'underline'
              }}
            >
              退出测试
            </button>
          </div>

          <div className="quiz-header">
            <span>题库进度: {currentQIndex + 1} / {questions.length}</span>
            <div className="quiz-progress-track">
              <div 
                className="quiz-progress-fill" 
                style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
              ></div>
            </div>
            <span>得分: {Math.round((score / questions.length) * 100)}分</span>
          </div>

          {/* Question Text display */}
          <div className="question-text">
            {quizMode === 'eng-to-chi' && (
              <>
                请选择正确的中文释义：
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span className="question-word" style={{ margin: 0 }}>
                    {questions[currentQIndex].wordObj.word}
                  </span>
                  <button 
                    onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                    className="ctrl-btn" 
                    style={{ width: '42px', height: '42px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)', borderRadius: '50%' }}
                    title="重播发音"
                    type="button"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              </>
            )}

            {quizMode === 'chi-to-eng' && (
              <>
                请选择正确的英文单词：
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span className="question-word" style={{ color: 'var(--accent-pink)', margin: 0 }}>
                    {questions[currentQIndex].wordObj.translation}
                  </span>
                  <button 
                    onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                    className="ctrl-btn" 
                    style={{ width: '42px', height: '42px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)', borderRadius: '50%' }}
                    title="播放发音"
                    type="button"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              </>
            )}

            {quizMode === 'spelling' && (
              <>
                请拼写此英文单词：
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span className="question-word" style={{ color: 'var(--accent-yellow)', margin: 0 }}>
                    {questions[currentQIndex].wordObj.translation}
                  </span>
                  <button 
                    onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                    className="ctrl-btn" 
                    style={{ width: '42px', height: '42px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)', borderRadius: '50%' }}
                    title="播放发音"
                    type="button"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Form Option choice lists */}
          {quizMode !== 'spelling' ? (
            <div className="options-list">
              {questions[currentQIndex].options.map((opt, idx) => {
                let statusClass = '';
                const isSelected = selectedAnswer === idx;
                
                if (selectedAnswer !== null) {
                  if (idx === questions[currentQIndex].correctIndex) {
                    statusClass = 'correct';
                  } else if (isSelected) {
                    statusClass = 'wrong';
                  }
                }

                return (
                  <button 
                    key={idx}
                    className={`option-btn ${statusClass}`}
                    onClick={() => handleAnswerClick(idx)}
                    disabled={selectedAnswer !== null}
                  >
                    <span>{quizMode === 'eng-to-chi' ? opt.translation : opt.word}</span>
                    {selectedAnswer !== null && idx === questions[currentQIndex].correctIndex && (
                      <Check size={18} />
                    )}
                    {selectedAnswer !== null && isSelected && idx !== questions[currentQIndex].correctIndex && (
                      <X size={18} />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Spelling form */
            <form onSubmit={handleSpellingSubmit} className="spelling-box">
              <input 
                type="text"
                className="spelling-input"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="在此输入拼写..."
                disabled={selectedAnswer !== null}
                autoFocus
                autoComplete="off"
              />

              {/* Character Hints */}
              <div className="spelling-hints">
                {questions[currentQIndex].wordObj.word.split('').map((char, index) => {
                  const isSpace = char === ' ';
                  const isFirst = index === 0;
                  const isLast = index === questions[currentQIndex].wordObj.word.length - 1;
                  
                  if (isSpace) return <span key={index} style={{ width: '12px' }}></span>;
                  
                  // Provide first and last letters as helper hints for spelling
                  const showHint = isFirst || isLast;
                  
                  return (
                    <span 
                      key={index} 
                      className={`hint-letter ${showHint ? 'filled' : ''}`}
                    >
                      {showHint ? char : ''}
                    </span>
                  );
                })}
              </div>

              {selectedAnswer === null ? (
                <button type="submit" className="action-btn" style={{ padding: '0.6rem 2rem' }}>
                  提交答案
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginTop: '1rem' }}>
                  {selectedAnswer === 1 ? (
                    <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓ 拼写正确！</span>
                  ) : selectedAnswer === -1 ? (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                      ⏱️ 答题超时！正确拼写为: {questions[currentQIndex].wordObj.word}
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                      ✗ 拼写错误。正确拼写为: {questions[currentQIndex].wordObj.word}
                    </span>
                  )}
                </div>
              )}
            </form>
          )}

          {/* Quick Voice pronouncer helper */}
          {(quizMode === 'chi-to-eng' || quizMode === 'spelling') && selectedAnswer !== null && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                className="ctrl-btn" 
                style={{ width: '40px', height: '40px' }}
                title="重播发音"
              >
                <Volume2 size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
