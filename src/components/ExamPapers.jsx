import React, { useState, useEffect } from 'react'
import { ChevronLeft, Award, CheckCircle, Printer, RefreshCw, Volume2, Sparkles, AlertCircle, BookOpen, Clock, Eye, EyeOff, Lightbulb, ShieldCheck } from 'lucide-react'
import examPapersData from '../data/examPapers.json'
import { playCuteEffect } from '../utils/wordVisuals'
import { speakNatural } from '../utils/speech'

export default function ExamPapers({ grade, playAudio, onAwardStars, onAddStudyRecord, onAddMistake, setActiveView }) {
  const [selectedPaperId, setSelectedPaperId] = useState(examPapersData[0].id);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [instantMode, setInstantMode] = useState(true); // Default to Instant Tutor Mode for better learning
  const [rewardedQuestions, setRewardedQuestions] = useState({});
  const [revealedScripts, setRevealedScripts] = useState({});
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showChineseTranslation, setShowChineseTranslation] = useState(true);

  const activePaper = examPapersData.find(p => p.id === selectedPaperId) || examPapersData[0];

  // Reset state when switching paper
  useEffect(() => {
    setUserAnswers({});
    setSubmitted(false);
    setRevealedScripts({});
  }, [selectedPaperId]);

  const handleSlowAudio = (text) => {
    if (!text) return;
    speakNatural(text, { rate: 0.6, pitch: 1.05, accent: 'us', volume: 1.0 });
  };

  const extractEnglishForRead = (promptText) => {
    // Strip Chinese instructions in brackets or leading Chinese prefixes for cleaner TTS
    const cleaned = promptText
      .replace(/【.*?】/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/（.*?）/g, '')
      .replace(/[\u4e00-\u9fa5？，。！：“”‘’、：；]+/g, ' ')
      .replace(/_+/g, ' blank ')
      .trim();
    return cleaned;
  };

  const handleSelectOption = (q, optionVal) => {
    if (submitted) return;
    // In instant mode, if already answered correctly, lock it unless reset
    if (instantMode && userAnswers[q.id] === q.correct) return;

    const isCorrect = optionVal === q.correct;

    if (instantMode) {
      if (isCorrect) {
        playCuteEffect('match');
        // Award +1 star on first-time correct answer for this question
        if (!rewardedQuestions[q.id]) {
          setRewardedQuestions(prev => ({ ...prev, [q.id]: true }));
          if (onAwardStars) onAwardStars(1);
        }
      } else {
        playCuteEffect('wrong');
        // Sync with Mistake Book if question has mistakeWord metadata
        if (q.mistakeWord && onAddMistake) {
          onAddMistake(q.mistakeWord);
        }
      }
    } else {
      playCuteEffect('note', 2);
    }

    setUserAnswers(prev => ({
      ...prev,
      [q.id]: optionVal
    }));
  };

  const handleRetryQuestion = (qId) => {
    setUserAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const toggleScriptReveal = (qId) => {
    setRevealedScripts(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Calculate score
  const allQuestions = activePaper.sections.flatMap(s => s.questions);
  const totalCount = allQuestions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = allQuestions.filter(q => userAnswers[q.id] === q.correct).length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  let gradeRank = '优秀 (A+)';
  let rankEmoji = '🏆';
  if (score < 70) {
    gradeRank = '需努力 (C)';
    rankEmoji = '🌱';
  } else if (score < 85) {
    gradeRank = '合格 (B)';
    rankEmoji = '🌼';
  } else if (score < 95) {
    gradeRank = '良好 (A)';
    rankEmoji = '🌸';
  }

  const handleSubmit = () => {
    if (answeredCount < totalCount) {
      const confirmSubmit = window.confirm(`还有 ${totalCount - answeredCount} 道题没做完哦，确定要现在交卷吗？`);
      if (!confirmSubmit) return;
    }
    setSubmitted(true);
    playCuteEffect('win');

    // Sync any wrong answers with mistakeWord into Mistake Book
    allQuestions.forEach(q => {
      if (userAnswers[q.id] && userAnswers[q.id] !== q.correct && q.mistakeWord && onAddMistake) {
        onAddMistake(q.mistakeWord);
      }
    });

    // Award completion bonus stars
    let starsBonus = 3;
    if (score === 100) starsBonus = 8;
    else if (score >= 85) starsBonus = 5;

    if (onAwardStars) {
      onAwardStars(starsBonus);
    }

    if (onAddStudyRecord) {
      onAddStudyRecord({
        date: new Date().toISOString().split('T')[0],
        grade,
        unitTitle: activePaper.title,
        mode: '真题试卷',
        score,
        correctCount,
        totalCount
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    setRevealedScripts({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`exam-papers-view ${isPrintMode ? 'print-preview' : ''}`} style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Non-print Top Controls Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          className="ctrl-action-btn"
          onClick={() => setActiveView('dashboard')}
          style={{ padding: '0.5rem 1rem', borderRadius: '20px' }}
        >
          <ChevronLeft size={16} />
          <span>返回学习看板</span>
        </button>

        {/* Mode Switcher: Instant Tutor Mode vs Exam Mode */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.2)',
            padding: '0.25rem',
            borderRadius: '999px',
            border: '1px solid var(--border-glass)'
          }}>
            <button
              onClick={() => setInstantMode(true)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: instantMode ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'transparent',
                color: instantMode ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
              title="选完立即揭晓对错与名师解析，答对直接+1颗星，答错可立即重选订正！"
            >
              <Lightbulb size={15} />
              <span>💡 边做边讲辅导模式</span>
            </button>
            <button
              onClick={() => setInstantMode(false)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: !instantMode ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'transparent',
                color: !instantMode ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
              title="模拟真实考场，全部做完后统一交卷打分！"
            >
              <ShieldCheck size={15} />
              <span>⏱️ 考场实战交卷模式</span>
            </button>
          </div>

          <button
            className={`ctrl-action-btn ${isPrintMode ? 'active' : ''}`}
            onClick={() => setIsPrintMode(!isPrintMode)}
            style={{ borderRadius: '20px', padding: '0.45rem 0.95rem' }}
          >
            <Printer size={16} />
            <span>{isPrintMode ? '返回在线互动' : '纸质打印预览'}</span>
          </button>
        </div>
      </div>

      {/* Visual 5-Paper Selector Cards (Non-Print) */}
      <div className="no-print" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
        gap: '0.65rem'
      }}>
        {examPapersData.map((paper) => {
          const isActive = paper.id === selectedPaperId;
          const qCount = paper.sections.reduce((acc, s) => acc + s.questions.length, 0);
          const hasListening = paper.sections.some(s => s.questions.some(q => q.type === 'listening'));

          return (
            <div
              key={paper.id}
              onClick={() => setSelectedPaperId(paper.id)}
              className="glass-card"
              style={{
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                borderRadius: '14px',
                border: isActive ? '2px solid var(--accent-pink)' : '1px solid var(--border-glass)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(139, 92, 246, 0.22))'
                  : 'rgba(255,255,255,0.03)',
                transform: isActive ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background: isActive ? 'var(--accent-pink)' : 'rgba(255,255,255,0.1)',
                  color: isActive ? '#fff' : 'var(--text-secondary)'
                }}>
                  {paper.badge}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  {qCount}题 {hasListening ? '· 🎧含听力' : ''}
                </span>
              </div>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: '800',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                lineHeight: 1.35
              }}>
                {paper.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Exam Header Banner */}
      <div className="glass-card exam-header-card" style={{ padding: '1.6rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                padding: '0.2rem 0.75rem',
                borderRadius: '999px'
              }}>
                {activePaper.badge}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> 建议用时 {activePaper.timeLimit}
              </span>
              {instantMode && (
                <span className="no-print" style={{
                  fontSize: '0.78rem',
                  color: 'var(--accent-cyan)',
                  background: 'rgba(6, 182, 212, 0.12)',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '999px',
                  fontWeight: 'bold'
                }}>
                  ✨ 当前：边做边讲模式（即选即判 + 自动收录错题本）
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>
              {activePaper.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              {activePaper.subtitle} —— {activePaper.summary}
            </p>
          </div>

          {/* Student Info Box */}
          <div className="print-student-info" style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.6rem 1rem',
            borderRadius: '12px',
            border: '1px dashed var(--border-glass)',
            background: 'rgba(255,255,255,0.03)',
            fontSize: '0.88rem',
            flexShrink: 0
          }}>
            <div>班级: <strong>二 (3) 班</strong></div>
            <div>姓名: <strong>沈礼洛</strong></div>
            <div>学号: <strong>5</strong></div>
          </div>
        </div>

        {/* Score & Result Banner after Submission */}
        {submitted && (
          <div style={{
            marginTop: '1.4rem',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(139, 92, 246, 0.22))',
            border: '2px solid var(--accent-pink)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '3rem' }}>{rankEmoji}</span>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  本卷总评成绩：<span style={{ color: score >= 85 ? 'var(--accent-green)' : 'var(--accent-pink)' }}>{score} 分</span> ({gradeRank})
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  共答对 <strong>{correctCount}</strong> / {totalCount} 题 · 交卷通关额外奖励 <strong>+{score === 100 ? 8 : score >= 85 ? 5 : 3} 颗星星 ⭐</strong>！
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                className="action-btn"
                onClick={handleReset}
                style={{ borderRadius: '999px', padding: '0.5rem 1.25rem' }}
              >
                <RefreshCw size={16} />
                <span>重新挑战本卷</span>
              </button>
              <button
                className="ctrl-action-btn"
                onClick={handlePrint}
                style={{ borderRadius: '999px', padding: '0.5rem 1.25rem' }}
              >
                <Printer size={16} />
                <span>打印试卷</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sections and Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activePaper.sections.map((section, sIdx) => (
          <div key={sIdx} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.65rem' }}>
              <h3 style={{ fontSize: '1.22rem', color: 'var(--accent-cyan)' }}>
                {section.sectionTitle}
              </h3>
              {section.sectionDesc && (
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {section.sectionDesc}
                </p>
              )}
            </div>

            {/* Reading Passage if present */}
            {section.passage && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '1.2rem',
                borderRadius: '14px',
                border: '1px solid var(--border-glass)',
                marginBottom: '1.5rem',
                lineHeight: 1.75
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={16} /> 阅读短文材料 (Reading Material)
                  </span>
                  <div className="no-print" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button
                      onClick={() => playAudio(section.passage)}
                      style={{
                        background: 'rgba(236, 72, 153, 0.15)',
                        border: '1px solid var(--accent-pink)',
                        color: 'var(--text-primary)',
                        padding: '0.25rem 0.7rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Volume2 size={14} /> 朗读短文
                    </button>
                    <button
                      onClick={() => setShowChineseTranslation(!showChineseTranslation)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {showChineseTranslation ? '隐藏中文翻译' : '显示中文翻译'}
                    </button>
                  </div>
                </div>

                <div style={{ whiteSpace: 'pre-line', fontSize: '1.02rem', fontWeight: '500' }}>
                  {section.passage}
                </div>

                {showChineseTranslation && section.passageCn && (
                  <div style={{
                    whiteSpace: 'pre-line',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.85rem',
                    borderTop: '1px dashed var(--border-glass)',
                    paddingTop: '0.75rem'
                  }}>
                    {section.passageCn}
                  </div>
                )}
              </div>
            )}

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {section.questions.map((q, qIdx) => {
                const userChoice = userAnswers[q.id];
                const isAnswered = !!userChoice;
                const isCorrect = userChoice === q.correct;
                const showFeedback = submitted || (instantMode && isAnswered);
                const isListening = q.type === 'listening' || !!q.audioText;
                const scriptVisible = submitted || isAnswered || !!revealedScripts[q.id];
                const englishReadText = q.audioText || extractEnglishForRead(q.prompt);

                return (
                  <div
                    key={q.id}
                    style={{
                      padding: '1.1rem',
                      borderRadius: '14px',
                      background: q.isTargetError ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                      border: q.isTargetError ? '1.5px solid rgba(239, 68, 68, 0.32)' : '1px solid var(--border-glass)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Question Header & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', lineHeight: 1.5, flex: 1, minWidth: '220px' }}>
                        <span style={{ marginRight: '0.5rem', color: 'var(--accent-pink)' }}>
                          {qIdx + 1}.
                        </span>
                        <span>{q.prompt}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                        {!isListening && englishReadText && englishReadText.length > 1 && (
                          <button
                            className="no-print"
                            onClick={() => playAudio(englishReadText)}
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid var(--border-glass)',
                              color: 'var(--text-secondary)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="朗读题目英文"
                          >
                            <Volume2 size={13} /> 读题
                          </button>
                        )}

                        {q.isTargetError && (
                          <span style={{
                            fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #ef4444, #f97316)',
                            color: '#fff',
                            padding: '0.18rem 0.6rem',
                            borderRadius: '8px',
                            fontWeight: '800'
                          }}>
                            🎯 洛洛真题失分点
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interactive AI Listening Player Bar (for listening questions) */}
                    {isListening && q.audioText && (
                      <div className="no-print" style={{
                        marginBottom: '0.85rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(139, 92, 246, 0.14))',
                        border: '1px solid rgba(96, 165, 250, 0.35)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.65rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => playAudio(q.audioText)}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                              color: '#fff',
                              border: 'none',
                              padding: '0.45rem 1rem',
                              borderRadius: '999px',
                              fontWeight: '800',
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
                            }}
                          >
                            <Volume2 size={16} />
                            <span>🔊 点击听考官读题</span>
                          </button>

                          <button
                            onClick={() => handleSlowAudio(q.audioText)}
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-glass)',
                              padding: '0.42rem 0.85rem',
                              borderRadius: '999px',
                              fontWeight: '700',
                              fontSize: '0.82rem',
                              cursor: 'pointer'
                            }}
                            title="0.6倍慢速清晰朗读每个单词"
                          >
                            🐢 慢速听 (0.6x)
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {scriptVisible ? (
                            <span style={{
                              fontSize: '0.85rem',
                              color: 'var(--accent-cyan)',
                              background: 'rgba(0,0,0,0.25)',
                              padding: '0.25rem 0.7rem',
                              borderRadius: '8px',
                              fontWeight: '600'
                            }}>
                              🎙️ 听力原文："{q.audioText}"
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleScriptReveal(q.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                textDecoration: 'underline'
                              }}
                            >
                              <Eye size={13} /> 听不清？点此偷看听力原文
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Print-only Listening Script Notice */}
                    {isListening && q.audioText && isPrintMode && (
                      <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                        [家长读题录音稿: "{q.audioText}"]
                      </div>
                    )}

                    {/* Options Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: q.options.length === 2 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.65rem'
                    }}>
                      {q.options.map((opt) => {
                        const isChosen = userChoice === opt.val;
                        const isRightAnswer = opt.val === q.correct;
                        let btnBg = 'rgba(255,255,255,0.04)';
                        let btnBorder = 'var(--border-glass)';
                        let btnColor = 'var(--text-primary)';

                        if (showFeedback) {
                          if (isRightAnswer) {
                            btnBg = 'rgba(16, 185, 129, 0.2)';
                            btnBorder = 'var(--accent-green)';
                            btnColor = 'var(--accent-green)';
                          } else if (isChosen && !isRightAnswer) {
                            btnBg = 'rgba(239, 68, 68, 0.2)';
                            btnBorder = '#ef4444';
                            btnColor = '#ef4444';
                          }
                        } else if (isChosen) {
                          btnBg = 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(139, 92, 246, 0.25))';
                          btnBorder = 'var(--accent-pink)';
                        }

                        return (
                          <button
                            key={opt.val}
                            onClick={() => handleSelectOption(q, opt.val)}
                            style={{
                              padding: '0.68rem 1rem',
                              borderRadius: '10px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              cursor: submitted ? 'default' : 'pointer',
                              background: btnBg,
                              border: `1.5px solid ${btnBorder}`,
                              color: btnColor,
                              fontWeight: isChosen || (showFeedback && isRightAnswer) ? '700' : '500',
                              fontSize: '0.95rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: `1.5px solid ${btnBorder}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}>
                              {opt.val}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Immediate Tutor Feedback or Post-Submit Analysis */}
                    {showFeedback && (
                      <div style={{
                        marginTop: '0.85rem',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        background: isCorrect ? 'rgba(16, 185, 129, 0.09)' : 'rgba(239, 68, 68, 0.09)',
                        borderLeft: `4px solid ${isCorrect ? 'var(--accent-green)' : '#ef4444'}`,
                        fontSize: '0.88rem',
                        lineHeight: 1.6
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <div style={{ fontWeight: 'bold', color: isCorrect ? 'var(--accent-green)' : '#ef4444' }}>
                            {isCorrect
                              ? '✅ 太棒啦！回答完全正确 (+1 ⭐)'
                              : `❌ 哎呀选错啦！正确答案是【${q.correct}】${q.mistakeWord ? `（已自动加入错题本：${q.mistakeWord.word}）` : ''}`}
                          </div>

                          {!isCorrect && !submitted && instantMode && (
                            <button
                              className="no-print"
                              onClick={() => handleRetryQuestion(q.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.18)',
                                border: '1px solid #ef4444',
                                color: '#fca5a5',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <RefreshCw size={12} /> 我看懂啦，重选一次订正
                            </button>
                          )}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {q.analysis}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Submission Bar */}
      {!submitted && (
        <div className="glass-card no-print" style={{
          position: 'sticky',
          bottom: '1rem',
          zIndex: 50,
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          border: '1.5px solid var(--accent-pink)'
        }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>
              本卷进度: 已答 {answeredCount} / {totalCount} 题
              {instantMode && answeredCount > 0 && (
                <span style={{ marginLeft: '0.6rem', color: 'var(--accent-green)' }}>
                  (当前正确率: {Math.round((correctCount / answeredCount) * 100)}%)
                </span>
              )}
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              做完后点击右侧交卷，生成等第评价单并领取通关大奖星星 ⭐
            </div>
          </div>

          <button
            className="action-btn"
            onClick={handleSubmit}
            style={{
              padding: '0.65rem 2rem',
              borderRadius: '999px',
              fontSize: '1.05rem',
              fontWeight: '800',
              boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)'
            }}
          >
            立即交卷判分 📝
          </button>
        </div>
      )}
    </div>
  );
}
