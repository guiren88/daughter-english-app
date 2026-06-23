import React, { useState } from 'react'
import { CheckCircle, Award, Bookmark, BookOpen, Layers, AlertCircle } from 'lucide-react'

export default function Dashboard({ 
  grade, 
  setGrade, 
  units, 
  completedUnits, 
  bookmarkedWords,
  onSelectUnit,
  onToggleUnitCompleted,
  setActiveView,
  setShowOnlyBookmarks,
  showOnlyMistakes,
  setShowOnlyMistakes,
  mistakes,
  studyHistory
}) {
  const [unitFilter, setUnitFilter] = useState('all'); // 'all' or 'completed'
  const [showMoreGrades, setShowMoreGrades] = useState(() => {
    return ['3', '4', '5'].some(num => grade.startsWith(num));
  });

  // Compute dashboard metrics
  const totalUnits = units.length;
  const totalWords = units.reduce((acc, unit) => acc + unit.words.length, 0);
  const gradeBookmarks = bookmarkedWords.filter(w => w.grade === grade).length;
  const gradeMistakes = mistakes.filter(m => m.grade === grade).length;
  const gradeCompleted = units.filter(unit => completedUnits.includes(`${grade}_${unit.unit}`)).length;

  const filteredUnits = unitFilter === 'completed'
    ? units.filter(unit => completedUnits.includes(`${grade}_${unit.unit}`))
    : units;

  // Study Streak & Check-in Calculation
  const studyDates = studyHistory ? studyHistory.map(h => h.date) : [];
  const checkInCount = new Set(studyDates).size;

  const getStreak = () => {
    if (!studyDates || studyDates.length === 0) return 0;
    const uniqueDates = Array.from(new Set(studyDates)).sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const latestStudyDate = new Date(uniqueDates[0]);
    latestStudyDate.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(checkDate - latestStudyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      return 0; // Streak broken
    }

    let currentCheck = latestStudyDate;
    for (let i = 0; i < uniqueDates.length; i++) {
      const d = new Date(uniqueDates[i]);
      d.setHours(0, 0, 0, 0);
      
      const diff = Math.round((currentCheck - d) / (1000 * 60 * 60 * 24));
      if (diff === 0) {
        streak++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else if (diff === 1) {
        streak++;
        currentCheck = d;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streakDays = getStreak();

  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  return (
    <div>
      {/* Dashboard top section */}
      <div className="dashboard-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
            {grade.toUpperCase()} 英语核心知识点看板
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            欢迎来到小学英语核心词汇与句法训练营
          </p>
        </div>

        <div className="grade-selector-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          {/* 年级选择行 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div className="toggle-group" style={{ margin: 0, padding: '2px', background: 'rgba(0,0,0,0.2)' }}>
              {['1', '2'].map((num) => {
                const sem = grade.slice(-1); // 'a' or 'b'
                const targetGrade = num + sem;
                const isActive = grade.startsWith(num);
                return (
                  <button
                    key={num}
                    className={`toggle-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setGrade(targetGrade)}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                  >
                    {num}年级
                  </button>
                );
              })}
            </div>

            <button
              className="toggle-btn"
              onClick={() => setShowMoreGrades(!showMoreGrades)}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                background: showMoreGrades ? 'var(--accent-pink)' : 'rgba(255,255,255,0.05)',
                color: showMoreGrades ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: showMoreGrades ? '0 0 10px rgba(236,72,153,0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {showMoreGrades ? '收起高年级 ⬆️' : '更多年级... ⬇️'}
            </button>

            {showMoreGrades && (
              <div className="toggle-group view-transition" style={{ margin: 0, padding: '2px', background: 'rgba(0,0,0,0.2)', display: 'flex' }}>
                {['3', '4', '5'].map((num) => {
                  const sem = grade.slice(-1); // 'a' or 'b'
                  const targetGrade = num + sem;
                  const isActive = grade.startsWith(num);
                  return (
                    <button
                      key={num}
                      className={`toggle-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setGrade(targetGrade)}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    >
                      {num}年级
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* 上下册选择行 */}
          <div className="toggle-group" style={{ margin: 0, padding: '2px', background: 'rgba(0,0,0,0.2)', alignSelf: 'flex-end' }}>
            {['a', 'b'].map((sem) => {
              const num = grade.slice(0, -1); // '1', '2', etc.
              const targetGrade = num + sem;
              const isActive = grade.endsWith(sem);
              return (
                <button
                  key={sem}
                  className={`toggle-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setGrade(targetGrade)}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                >
                  {sem === 'a' ? '上册 (A)' : '下册 (B)'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-row">
        <div 
          className="glass-card stat-card stagger-item" 
          style={{ '--index': 0, cursor: 'pointer' }}
          onClick={() => {
            setUnitFilter('all');
            const el = document.getElementById('units-catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          title="点击查看所有单元目录"
        >
          <div className="stat-icon violet">
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <h4>{totalUnits}</h4>
            <p>总单元数</p>
          </div>
        </div>

        <div 
          className="glass-card stat-card stagger-item" 
          style={{ '--index': 1, cursor: 'pointer' }}
          onClick={() => {
            setShowOnlyBookmarks(false);
            setActiveView('glossary');
          }}
          title="点击进入词汇看板自主学习"
        >
          <div className="stat-icon pink">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <h4>{totalWords}</h4>
            <p>核心词汇量 (点击自主学习)</p>
          </div>
        </div>

        <div 
          className="glass-card stat-card stagger-item" 
          style={{ '--index': 2, cursor: 'pointer' }}
          onClick={() => {
            setUnitFilter('completed');
            const el = document.getElementById('units-catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          title="点击查看已完成单元"
        >
          <div className="stat-icon cyan">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h4>{gradeCompleted} / {totalUnits}</h4>
            <p>已通关单元</p>
          </div>
        </div>

        <div 
          className="glass-card stat-card stagger-item" 
          style={{ '--index': 3, cursor: 'pointer' }}
          onClick={() => {
            setShowOnlyBookmarks(true);
            setShowOnlyMistakes(false);
            setActiveView('glossary');
          }}
          title="点击查看收藏夹单词"
        >
          <div className="stat-icon green">
            <Bookmark size={24} />
          </div>
          <div className="stat-info">
            <h4>{gradeBookmarks}</h4>
            <p>收藏夹单词数</p>
          </div>
        </div>

        <div 
          className="glass-card stat-card stagger-item" 
          style={{ '--index': 4, cursor: 'pointer' }}
          onClick={() => {
            setShowOnlyBookmarks(false);
            setShowOnlyMistakes(true);
            setActiveView('glossary');
          }}
          title="点击查看错题本单词"
        >
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #f43f5e)' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h4>{gradeMistakes}</h4>
            <p>错题本单词数</p>
          </div>
        </div>
      </div>

      {/* Check-in Calendar & Reports Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }} className="no-print">
        {/* Left Column: Calendar */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>📅 每日打卡看板</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ({new Date().getFullYear()}年{new Date().getMonth() + 1}月)
              </span>
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>累计打卡: <strong>{checkInCount}</strong>天</span>
              <span style={{ color: 'var(--border-glass)' }}>|</span>
              <span style={{ color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>连击: 🔥<strong>{streakDays}</strong>天</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} style={{ aspectRatio: '1' }}></div>;
              
              const dayStr = day.toISOString().split('T')[0];
              const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
              const isCheckedIn = studyDates.includes(dayStr);
              
              return (
                <div 
                  key={dayStr}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    position: 'relative',
                    background: isCheckedIn 
                      ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(139, 92, 246, 0.25))' 
                      : isToday 
                        ? 'rgba(255,255,255,0.08)' 
                        : 'rgba(255,255,255,0.02)',
                    border: isToday ? '1px solid var(--accent-pink)' : isCheckedIn ? '1px solid rgba(236,72,153,0.3)' : '1px solid transparent',
                    color: isCheckedIn ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isCheckedIn || isToday ? 'bold' : 'normal'
                  }}
                  title={isCheckedIn ? `打卡时间: ${dayStr}` : `未打卡`}
                >
                  <span>{day.getDate()}</span>
                  {isCheckedIn && (
                    <span style={{ fontSize: '0.75rem', position: 'absolute', bottom: '2px', lineHeight: 1 }}>🌸</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Reports */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)' }}>
            📊 学习小报告 (最近测试历史)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, maxHeight: '240px', overflowY: 'auto' }}>
            {(!studyHistory || studyHistory.filter(h => h.grade === grade).length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 1rem' }}>
                <span style={{ fontSize: '2rem' }}>📝</span>
                <div>本学期暂无测试记录</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>点击单元目录的“去测试”开始您的第一次挑战吧！</div>
              </div>
            ) : (
              studyHistory
                .filter(h => h.grade === grade)
                .slice(-5)
                .reverse()
                .map((record, index) => {
                  let modeName = '多选';
                  if (record.mode === 'spelling') modeName = '拼写';
                  if (record.mode === 'speech') modeName = '跟读';
                  
                  return (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem 0.8rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{record.unitTitle}</span>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.05rem 0.35rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                            {modeName}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.date}</span>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontSize: '1.15rem', 
                          fontWeight: 'bold', 
                          color: record.score === 100 
                            ? 'var(--accent-green)' 
                            : record.score >= 80 
                              ? 'var(--accent-yellow)' 
                              : '#ef4444' 
                        }}>
                          {record.score}分
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          答对 {record.correctCount} / {record.totalCount} 题
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 id="units-catalog" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📚 单元学习目录
          {unitFilter === 'completed' && (
            <span 
              style={{ 
                fontSize: '0.85rem', 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: 'var(--accent-green)', 
                padding: '0.2rem 0.6rem', 
                borderRadius: '12px',
                border: '1px solid var(--accent-green)',
                fontWeight: 'normal'
              }}
            >
              已筛选: 已通关
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="action-btn"
            style={{ 
              padding: '0.45rem 1.25rem', 
              fontSize: '0.85rem', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#1e1b4b',
              fontWeight: 'bold',
              border: 'none',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onClick={() => onSelectUnit(null, 'quiz')}
          >
            <span>🏆 挑战全册单词总测试 (共{totalWords}题)</span>
          </button>
          {unitFilter !== 'all' && (
            <button 
              className="ctrl-action-btn"
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '20px' }}
              onClick={() => setUnitFilter('all')}
            >
              显示全部单元
            </button>
          )}
        </div>
      </div>

      {/* Units Grid */}
      {filteredUnits.length === 0 ? (
        <div 
          className="glass-card" 
          style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem', 
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <Award size={48} style={{ color: 'var(--accent-pink)', opacity: 0.8 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>
            当前学期还没有已通关的单元哦！
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            点击单元卡片右上角的绿色勾选按钮，即可将单元标记为“已通关”。
          </p>
          <button 
            className="action-btn"
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '0.9rem', borderRadius: '20px' }}
            onClick={() => setUnitFilter('all')}
          >
            查看全部单元
          </button>
        </div>
      ) : (
        <div className="units-grid">
          {filteredUnits.map((unit, index) => {
            const isCompleted = completedUnits.includes(`${grade}_${unit.unit}`);
            return (
              <div 
                key={unit.unit} 
                className="glass-card unit-card stagger-item"
                style={{ '--index': index }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="unit-num">{unit.unit}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleUnitCompleted(unit.unit);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isCompleted ? 'var(--accent-green)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                      title={isCompleted ? "标记为未完成" : "标记为已通关"}
                    >
                      <CheckCircle size={22} fill={isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'transparent'} />
                    </button>
                  </div>
                  <h3 className="unit-title">{unit.title}</h3>
                  <span className="unit-word-count">包含 {unit.words.length} 个核心词组/单词</span>
                </div>

                <div>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: isCompleted ? '100%' : '15%' }}></div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button 
                      className="action-btn"
                      style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '8px' }}
                      onClick={() => onSelectUnit(unit, 'flashcards')}
                    >
                      背单词
                    </button>
                    <button 
                      className="action-btn"
                      style={{ 
                        flex: 1, 
                        padding: '0.5rem 1rem', 
                        fontSize: '0.9rem', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-glass)'
                      }}
                      onClick={() => onSelectUnit(unit, 'quiz')}
                    >
                      去测试
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
