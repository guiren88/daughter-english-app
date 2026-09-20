import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, ChevronLeft, ChevronRight, Volume2, 
  CheckCircle, HelpCircle, Award, Sparkles, Eye, EyeOff, RotateCcw
} from 'lucide-react';
import storiesData from '../data/stories.json';

export default function Stories({ 
  grade, 
  onAwardStars, 
  playAudio, 
  initialUnit = null,
  setActiveView 
}) {
  // Current grade stories
  const gradeKey = `grade_${grade.toLowerCase()}`;
  const stories = storiesData[gradeKey] || [];

  // State
  const [activeStory, setActiveStory] = useState(() => {
    if (initialUnit) {
      const matched = stories.find(s => s.unit === initialUnit.unit);
      if (matched) return matched;
    }
    return null;
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [showChinese, setShowChinese] = useState(true);
  const [isReadingQuiz, setIsReadingQuiz] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85); // Child-friendly slow pace
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Completed stories tracking in localStorage
  const [completedStories, setCompletedStories] = useState(() => {
    try {
      const saved = localStorage.getItem('oxford_completed_stories');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Auto scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, activeStory, isReadingQuiz]);

  // Read sentence using SpeechSynthesis
  const speakSentence = (text, rate = speechRate) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.05; // Slightly cheerful pitch
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Start reading a story
  const handleStartStory = (story) => {
    setActiveStory(story);
    setCurrentPage(0);
    setIsReadingQuiz(false);
    setIsQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    // Automatically read first page after a brief moment
    setTimeout(() => {
      if (story.pages && story.pages[0]) {
        speakSentence(story.pages[0].sentenceEn);
      }
    }, 400);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (!activeStory) return;
    if (newPage >= 0 && newPage < activeStory.pages.length) {
      setCurrentPage(newPage);
      speakSentence(activeStory.pages[newPage].sentenceEn);
    }
  };

  // Handle quiz option selection
  const handleSelectOption = (index) => {
    if (selectedOption !== null) return; // Prevent double clicking
    setSelectedOption(index);

    const question = activeStory.quiz[currentQuestionIndex];
    const isCorrect = index === question.answer;

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      if (playAudio) playAudio('correct');
    } else {
      if (playAudio) playAudio('incorrect');
    }

    // Move to next question or complete after 1.8s
    setTimeout(() => {
      if (currentQuestionIndex + 1 < activeStory.quiz.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        // Complete Quiz!
        setIsQuizCompleted(true);
        const storyId = activeStory.id;
        if (!completedStories.includes(storyId)) {
          const updated = [...completedStories, storyId];
          setCompletedStories(updated);
          localStorage.setItem('oxford_completed_stories', JSON.stringify(updated));
          // Reward stars!
          if (onAwardStars) {
            onAwardStars(5);
          }
        }
      }
    }, 1800);
  };

  // Reset quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setIsQuizCompleted(false);
  };

  // ==========================================
  // VIEW 1: Story Catalog / Shelf
  // ==========================================
  if (!activeStory) {
    return (
      <div className="stories-catalog-container">
        {/* Header Banner */}
        <div className="glass-card story-hero-banner" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📚✨</div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            单元同步微故事阅读
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.25rem auto' }}>
            把课本上的零散单词变成生动的小故事！听原汁原味儿童英文朗读，在真实情景中理解与应用。
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
            <Sparkles size={16} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              每读完一本故事并完成小挑战，奖励 <strong>+5 颗成长星星 ⭐</strong>
            </span>
          </div>
        </div>

        {/* Stories Grid */}
        {stories.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>当前学期暂无同步故事哦</p>
            <p style={{ fontSize: '0.9rem' }}>正在快马加鞭制作中，敬请期待！</p>
          </div>
        ) : (
          <div className="stories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {stories.map(story => {
              const isCompleted = completedStories.includes(story.id);
              return (
                <div 
                  key={story.id} 
                  className="glass-card story-card"
                  onClick={() => handleStartStory(story)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    border: isCompleted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div>
                    {/* Top Row: Unit & Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className="unit-num">{story.unit}</span>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {isCompleted && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            background: 'rgba(16, 185, 129, 0.15)', 
                            color: 'var(--accent-green)', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontWeight: 'bold'
                          }}>
                            <CheckCircle size={12} /> 已通关
                          </span>
                        )}
                        <span className="unit-new-badge" style={{ fontSize: '0.65rem' }}>
                          {story.badge}
                        </span>
                      </div>
                    </div>

                    {/* Story Cover Graphic & Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ 
                        fontSize: '3rem', 
                        width: '72px', 
                        height: '72px', 
                        borderRadius: '16px', 
                        background: 'rgba(255,255,255,0.06)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }}>
                        {story.coverEmoji}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                          {story.title}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {story.titleCn}
                        </p>
                      </div>
                    </div>

                    {/* Story Summary */}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                      {story.summary}
                    </p>

                    {/* Core Words Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                      {story.coreWords.slice(0, 6).map((word, idx) => (
                        <span 
                          key={idx} 
                          style={{ 
                            fontSize: '0.72rem', 
                            background: 'rgba(255,255,255,0.04)', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '6px',
                            color: 'var(--text-muted)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          {word}
                        </span>
                      ))}
                      {story.coreWords.length > 6 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{story.coreWords.length - 6}个词
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Start Button */}
                  <button 
                    className="action-btn"
                    style={{ 
                      width: '100%', 
                      borderRadius: '12px', 
                      padding: '0.65rem 1rem', 
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <BookOpen size={18} />
                    <span>开始阅读绘本</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: Story Reader (Page by Page)
  // ==========================================
  const page = activeStory.pages[currentPage];
  const isLastPage = currentPage === activeStory.pages.length - 1;

  if (isReadingQuiz) {
    // ==========================================
    // VIEW 3: Comprehension Challenge Quiz
    // ==========================================
    const question = activeStory.quiz[currentQuestionIndex];

    return (
      <div className="story-quiz-container" style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Quiz Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button 
            className="ctrl-action-btn"
            onClick={() => setIsReadingQuiz(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <ChevronLeft size={16} />
            <span>返回重读故事</span>
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            阅读理解挑战：第 {currentQuestionIndex + 1} / {activeStory.quiz.length} 题
          </span>
        </div>

        {/* Quiz Stage Card */}
        <div className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'center', position: 'relative' }}>
          {!isQuizCompleted ? (
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤔</div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {question.question}
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {question.questionCn}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {question.options.map((opt, idx) => {
                  let btnBg = 'rgba(255,255,255,0.04)';
                  let btnBorder = 'var(--border-glass)';
                  let btnColor = 'var(--text-primary)';

                  if (selectedOption !== null) {
                    if (idx === question.answer) {
                      btnBg = 'rgba(16, 185, 129, 0.2)';
                      btnBorder = 'var(--accent-green)';
                      btnColor = 'var(--accent-green)';
                    } else if (idx === selectedOption) {
                      btnBg = 'rgba(239, 68, 68, 0.2)';
                      btnBorder = '#ef4444';
                      btnColor = '#ef4444';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={selectedOption !== null}
                      style={{
                        padding: '1rem 1.25rem',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        background: btnBg,
                        border: `1px solid ${btnBorder}`,
                        color: btnColor,
                        cursor: selectedOption !== null ? 'default' : 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <span>{opt}</span>
                      {selectedOption !== null && idx === question.answer && (
                        <CheckCircle size={20} style={{ color: 'var(--accent-green)' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Hint */}
              {selectedOption !== null && (
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '0.8rem 1rem', 
                  borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border-glass)',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)'
                }}>
                  💡 <strong>解析：</strong> {question.explanation}
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completed View */
            <div style={{ padding: '1rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>🎉🏆</div>
              <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)', color: 'var(--accent-yellow)', marginBottom: '0.5rem' }}>
                挑战成功！太棒啦！
              </h2>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                你答对了 {quizScore} / {activeStory.quiz.length} 道阅读理解题！
              </p>
              
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                color: '#1e1b4b',
                fontWeight: 'bold',
                padding: '0.6rem 1.25rem',
                borderRadius: '30px',
                fontSize: '1.1rem',
                marginBottom: '2rem',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)'
              }}>
                <span>⭐</span>
                <span>获得 5 颗成长星星！</span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  className="ctrl-action-btn"
                  onClick={handleRestartQuiz}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '20px' }}
                >
                  <RotateCcw size={16} />
                  <span>再做一次</span>
                </button>
                <button
                  className="action-btn"
                  onClick={() => setActiveStory(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.5rem', borderRadius: '20px' }}
                >
                  <BookOpen size={16} />
                  <span>返回故事书架</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Story Reader Page View
  return (
    <div className="story-reader-container" style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Top Reader Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button 
          className="ctrl-action-btn"
          onClick={() => setActiveStory(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: '12px', fontSize: '0.85rem' }}
        >
          <ChevronLeft size={16} />
          <span>返回书架</span>
        </button>

        {/* Center Progress Title */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
            {activeStory.title}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            第 {currentPage + 1} / {activeStory.pages.length} 页
          </span>
        </div>

        {/* Utility Toggles */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="ctrl-action-btn"
            onClick={() => setShowChinese(!showChinese)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem' }}
            title="切换中文释义显示"
          >
            {showChinese ? <Eye size={15} /> : <EyeOff size={15} />}
            <span>{showChinese ? '中文已开启' : '仅看英文'}</span>
          </button>

          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="select-dropdown"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: '8px', height: 'auto' }}
            title="调节朗读语速"
          >
            <option value="0.75">🐢 极慢速</option>
            <option value="0.85">🐰 慢速 (推荐)</option>
            <option value="1.0">⚡ 标准速</option>
          </select>
        </div>
      </div>

      {/* Main Illustrated Scene Card */}
      <div 
        className="glass-card story-page-card"
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-premium)',
          position: 'relative',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-glass-focus)',
          background: 'rgba(255,255,255,0.03)'
        }}
      >
        {/* Character Badge */}
        {page.character && (
          <div style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.5rem',
            background: 'rgba(255,255,255,0.06)',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-glass)'
          }}>
            🗣️ {page.character}
          </div>
        )}

        {/* Scene Graphic */}
        <div 
          style={{ 
            fontSize: '5.5rem', 
            margin: '1rem 0 1.75rem 0',
            userSelect: 'none',
            animation: 'story-float 3s infinite ease-in-out'
          }}
        >
          {page.sceneEmoji}
        </div>

        {/* English Sentence (Clickable to read) */}
        <div 
          onClick={() => speakSentence(page.sentenceEn)}
          style={{ 
            cursor: 'pointer',
            padding: '1rem',
            borderRadius: '16px',
            background: isSpeaking ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
            border: isSpeaking ? '1px dashed var(--accent-pink)' : '1px dashed transparent',
            transition: 'var(--transition-smooth)',
            marginBottom: '1rem'
          }}
          title="点击朗读本句"
        >
          <p style={{ 
            fontSize: '1.45rem', 
            lineHeight: '1.6', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            letterSpacing: '0.2px'
          }}>
            {page.sentenceEn}
          </p>
        </div>

        {/* Chinese Sentence Translation */}
        {showChinese && (
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {page.sentenceCn}
          </p>
        )}

        {/* Core Focus Word Pill */}
        {page.focusWord && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>本页重点词句:</span>
            <button
              onClick={() => speakSentence(page.focusWord, 0.8)}
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid var(--accent-pink)',
                color: 'var(--text-primary)',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer'
              }}
              title="点击单读重点词"
            >
              <Volume2 size={14} style={{ color: 'var(--accent-pink)' }} />
              <span>{page.focusWord}</span>
            </button>
          </div>
        )}
      </div>

      {/* Reader Bottom Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        {/* Previous Page Button */}
        <button
          className="ctrl-action-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          style={{ 
            opacity: currentPage === 0 ? 0.4 : 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.6rem 1.25rem', 
            borderRadius: '20px' 
          }}
        >
          <ChevronLeft size={18} />
          <span>上一页</span>
        </button>

        {/* Page Dots Indicator */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {activeStory.pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handlePageChange(idx)}
              style={{
                width: idx === currentPage ? '24px' : '10px',
                height: '10px',
                borderRadius: '5px',
                background: idx === currentPage ? 'var(--accent-pink)' : 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              title={`跳转到第 ${idx + 1} 页`}
            />
          ))}
        </div>

        {/* Next Page or Start Quiz Button */}
        {!isLastPage ? (
          <button
            className="action-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.6rem 1.4rem', 
              borderRadius: '20px' 
            }}
          >
            <span>下一页</span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            className="action-btn"
            onClick={() => {
              setIsReadingQuiz(true);
              handleRestartQuiz();
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.6rem 1.4rem', 
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            <span>做小挑战 (+5⭐)</span>
            <Award size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
