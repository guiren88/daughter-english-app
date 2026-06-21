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
  mistakes
}) {
  const [unitFilter, setUnitFilter] = useState('all'); // 'all' or 'completed'

  // Compute dashboard metrics
  const totalUnits = units.length;
  const totalWords = units.reduce((acc, unit) => acc + unit.words.length, 0);
  const gradeBookmarks = bookmarkedWords.filter(w => w.grade === grade).length;
  const gradeMistakes = mistakes.filter(m => m.grade === grade).length;
  const gradeCompleted = units.filter(unit => completedUnits.includes(`${grade}_${unit.unit}`)).length;

  const filteredUnits = unitFilter === 'completed'
    ? units.filter(unit => completedUnits.includes(`${grade}_${unit.unit}`))
    : units;

  return (
    <div>
      {/* Dashboard top section */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
            {grade.toUpperCase()} 英语核心知识点看板
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            欢迎来到二实小 1A/1B 单元核心词汇与句法训练营
          </p>
        </div>

        <div className="toggle-group">
          <button 
            className={`toggle-btn ${grade === '1a' ? 'active' : ''}`}
            onClick={() => setGrade('1a')}
          >
            Grade 1A (上册)
          </button>
          <button 
            className={`toggle-btn ${grade === '1b' ? 'active' : ''}`}
            onClick={() => setGrade('1b')}
          >
            Grade 1B (下册)
          </button>
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
