import React, { useState, useEffect } from 'react'
import { ChevronLeft, Award, CheckCircle, Printer, RefreshCw, Volume2, Sparkles, AlertCircle, BookOpen, Clock } from 'lucide-react'
import examPapersData from '../data/examPapers.json'
import { playCuteEffect } from '../utils/wordVisuals'

export default function ExamPapers({ grade, playAudio, onAwardStars, onAddStudyRecord, setActiveView }) {
  const [selectedPaperId, setSelectedPaperId] = useState(examPapersData[0].id);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showChineseTranslation, setShowChineseTranslation] = useState(true);

  const activePaper = examPapersData.find(p => p.id === selectedPaperId) || examPapersData[0];

  // Reset answers when switching paper
  useEffect(() => {
    setUserAnswers({});
    setSubmitted(false);
  }, [selectedPaperId]);

  const handleSelectOption = (qId, optionVal, correctVal) => {
    if (submitted) return;
    const isCorrect = optionVal === correctVal;
    if (isCorrect) {
      playCuteEffect('match');
    } else {
      playCuteEffect('note', 0);
    }
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optionVal
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
    playCuteEffect('match');

    // Award stars based on score
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

    // Scroll up smoothly to result banner
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`exam-papers-view ${isPrintMode ? 'print-preview' : ''}`} style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="select-dropdown"
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            style={{ minWidth: '280px', fontWeight: 'bold' }}
          >
            {examPapersData.map(p => (
              <option key={p.id} value={p.id}>
                {p.badge ? `[${p.badge}] ` : ''}{p.title}
              </option>
            ))}
          </select>

          <button
            className={`ctrl-action-btn ${isPrintMode ? 'active' : ''}`}
            onClick={() => setIsPrintMode(!isPrintMode)}
            style={{ borderRadius: '20px', padding: '0.5rem 1rem' }}
          >
            <Printer size={16} />
            <span>{isPrintMode ? '切换在线交互模式' : '试卷纸质打印版'}</span>
          </button>
        </div>
      </div>

      {/* Exam Header Banner */}
      <div className="glass-card exam-header-card" style={{ padding: '1.75rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
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
                <Clock size={14} /> 限时 {activePaper.timeLimit}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>
              {activePaper.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {activePaper.subtitle} · {activePaper.summary}
            </p>
          </div>

          {/* Student Info Box for Paper Printing */}
          <div className="print-student-info" style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            border: '1px dashed var(--border-glass)',
            background: 'rgba(255,255,255,0.03)',
            fontSize: '0.9rem'
          }}>
            <div>班级: <strong>二 (3) 班</strong></div>
            <div>姓名: <strong>沈礼洛</strong></div>
            <div>学号: <strong>5</strong></div>
          </div>
        </div>

        {/* Score & Result Banner after Submission */}
        {submitted && (
          <div style={{
            marginTop: '1.5rem',
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
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  本次测试成绩：<span style={{ color: score >= 85 ? 'var(--accent-green)' : 'var(--accent-pink)' }}>{score} 分</span> ({gradeRank})
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  答对 <strong>{correctCount}</strong> / {totalCount} 题 · 已奖励 <strong>+{score === 100 ? 8 : score >= 85 ? 5 : 3} 颗星星 ⭐</strong>！
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                className="action-btn"
                onClick={handleReset}
                style={{ borderRadius: '999px', padding: '0.5rem 1.25rem' }}
              >
                <RefreshCw size={16} />
                <span>重新做一遍</span>
              </button>
              <button
                className="ctrl-action-btn"
                onClick={handlePrint}
                style={{ borderRadius: '999px', padding: '0.5rem 1.25rem' }}
              >
                <Printer size={16} />
                <span>打印该试卷</span>
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
              <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)' }}>
                {section.sectionTitle}
              </h3>
              {section.sectionDesc && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {section.sectionDesc}
                </p>
              )}
            </div>

            {/* Reading Passage if present */}
            {section.passage && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '1.2rem',
                borderRadius: '12px',
                border: '1px solid var(--border-glass)',
                marginBottom: '1.5rem',
                lineHeight: 1.7
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <BookOpen size={16} /> 阅读短文材料 (Reading Material)
                  </span>
                  <button
                    className="no-print"
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
                    {showChineseTranslation ? '隐藏中文对照' : '显示中文对照'}
                  </button>
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
                const isSelected = !!userChoice;
                const isCorrect = userChoice === q.correct;

                return (
                  <div
                    key={q.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: q.isTargetError ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                      border: q.isTargetError ? '1.5px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-glass)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Question Header & Target Error Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', lineHeight: 1.5, flex: 1 }}>
                        <span style={{ marginRight: '0.5rem', color: 'var(--accent-pink)' }}>
                          {qIdx + 1}.
                        </span>
                        <span>{q.prompt}</span>
                      </div>

                      {q.isTargetError && (
                        <span style={{
                          fontSize: '0.75rem',
                          background: 'linear-gradient(135deg, #ef4444, #f97316)',
                          color: '#fff',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '8px',
                          fontWeight: '800',
                          flexShrink: 0
                        }}>
                          🎯 洛洛试卷失分点
                        </span>
                      )}
                    </div>

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

                        if (submitted) {
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
                            onClick={() => handleSelectOption(q.id, opt.val, q.correct)}
                            style={{
                              padding: '0.65rem 1rem',
                              borderRadius: '10px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              cursor: submitted ? 'default' : 'pointer',
                              background: btnBg,
                              border: `1.5px solid ${btnBorder}`,
                              color: btnColor,
                              fontWeight: isChosen ? '700' : '500',
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

                    {/* Immediate or Post-Submit Analysis */}
                    {submitted && (
                      <div style={{
                        marginTop: '0.85rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        borderLeft: `4px solid ${isCorrect ? 'var(--accent-green)' : '#ef4444'}`,
                        fontSize: '0.88rem',
                        lineHeight: 1.6
                      }}>
                        <div style={{ fontWeight: 'bold', color: isCorrect ? 'var(--accent-green)' : '#ef4444', marginBottom: '0.2rem' }}>
                          {isCorrect ? '✅ 回答正确！' : `❌ 回答错误！正确答案是【${q.correct}】`}
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
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          border: '1.5px solid var(--accent-pink)'
        }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>
              答题进度: {answeredCount} / {totalCount} 题
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              全部完成后点击右侧按钮交卷判分并领取星星 ⭐
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
