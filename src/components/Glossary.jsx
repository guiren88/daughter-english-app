import React, { useState, useEffect } from 'react'
import { Volume2, Star, Search, AlertCircle, Check, ChevronLeft } from 'lucide-react'
import { getWordEmoji } from '../utils/wordVisuals'

export default function Glossary({
  vocabData,
  currentGrade,
  bookmarkedWords,
  onToggleBookmark,
  playAudio,
  showOnlyBookmarks,
  setShowOnlyBookmarks,
  showOnlyMistakes,
  setShowOnlyMistakes,
  mistakes,
  onRemoveMistake,
  setActiveView
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState(currentGrade || 'all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [showAllGrades, setShowAllGrades] = useState(() => {
    return ['3', '4', '5'].some(num => (currentGrade || '').startsWith(num));
  });

  useEffect(() => {
    if (currentGrade) {
      setGradeFilter(currentGrade);
      if (['3', '4', '5'].some(num => currentGrade.startsWith(num))) {
        setShowAllGrades(true);
      }
    }
  }, [currentGrade]);

  useEffect(() => {
    setUnitFilter('all');
  }, [gradeFilter])

  const getDropdownUnits = () => {
    if (gradeFilter === 'all') return [];
    return vocabData[`grade_${gradeFilter}`] || [];
  }

  let allWords = [];
  
  Object.keys(vocabData).forEach(key => {
    const gradeVal = key.replace('grade_', '');
    const isHighGrade = ['3', '4', '5'].some(num => gradeVal.startsWith(num));
    if (isHighGrade && !showAllGrades) {
      return;
    }
    if (gradeFilter === 'all' || gradeFilter === gradeVal) {
      vocabData[key].forEach(unit => {
        unit.words.forEach(wordObj => {
          allWords.push({
            ...wordObj,
            grade: gradeVal,
            unitName: unit.unit,
            unitTitle: unit.title
          });
        });
      });
    }
  });

  const filteredWords = allWords.filter(wordObj => {
    const isBookmarked = bookmarkedWords.some(w => w.word === wordObj.word && w.grade === wordObj.grade);
    const isMistake = mistakes.some(m => m.word === wordObj.word && m.grade === wordObj.grade);
    
    const matchesSearch = 
      wordObj.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wordObj.translation.includes(searchTerm);
      
    const matchesUnit = unitFilter === 'all' || wordObj.unitName === unitFilter;
    const matchesBookmark = !showOnlyBookmarks || isBookmarked;
    const matchesMistake = !showOnlyMistakes || isMistake;
    
    return matchesSearch && matchesUnit && matchesBookmark && matchesMistake;
  });

  const dropdownUnits = getDropdownUnits();

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)', marginBottom: 0 }}>
          🔍 核心词汇索引大纲 (点击单词即可发音)
        </h2>
        <button 
          className="ctrl-action-btn"
          onClick={() => {
            setActiveView('dashboard');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '20px' }}
        >
          <ChevronLeft size={16} />
          <span>返回目录</span>
        </button>
      </div>

      {/* Glossary Filtering Controls */}
      <div className="glossary-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={18} 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
          />
          <input 
            type="text"
            className="search-input"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索英文或中文..."
          />
        </div>

        <select 
          className="select-dropdown"
          value={gradeFilter}
          onChange={(e) => {
            if (e.target.value === 'show_more') {
              setShowAllGrades(true);
            } else {
              setGradeFilter(e.target.value);
            }
          }}
        >
          <option value="all">
            {showAllGrades ? '全套词库 (1A - 5B)' : '全套词库 (1A - 2B)'}
          </option>
          {Object.keys(vocabData).map(key => {
            const val = key.replace('grade_', '');
            const isHighGrade = ['3', '4', '5'].some(num => val.startsWith(num));
            if (isHighGrade && !showAllGrades) {
              return null;
            }
            const display = val.toUpperCase();
            return (
              <option key={val} value={val}>
                {display.replace('A', 'A (上册)').replace('B', 'B (下册)')}
              </option>
            );
          })}
          {!showAllGrades && (
            <option value="show_more" style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>
              ➕ 显示 3、4、5 年级高年级词库...
            </option>
          )}
        </select>

        <select 
          className="select-dropdown"
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          disabled={gradeFilter === 'all'}
          style={{ opacity: gradeFilter === 'all' ? 0.6 : 1 }}
        >
          <option value="all">所有单元</option>
          {dropdownUnits.map(u => (
            <option key={u.unit} value={u.unit}>
              {u.unit}: {u.title}{u.isNew ? ' ✨ (NEW)' : ''}
            </option>
          ))}
        </select>

        <label 
          className="option-btn" 
          style={{ 
            padding: '0.65rem 1rem', 
            fontSize: '0.95rem', 
            borderRadius: 'var(--radius-md)', 
            cursor: 'pointer',
            transform: 'none',
            justifyContent: 'center',
            gap: '0.5rem',
            background: showOnlyBookmarks ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.03)',
            borderColor: showOnlyBookmarks ? 'var(--accent-yellow)' : 'var(--border-glass)'
          }}
        >
          <Star size={16} fill={showOnlyBookmarks ? 'var(--accent-yellow)' : 'transparent'} style={{ color: showOnlyBookmarks ? 'var(--accent-yellow)' : 'var(--text-secondary)' }} />
          <span>只看收藏夹</span>
          <input 
            type="checkbox"
            checked={showOnlyBookmarks}
            onChange={(e) => {
              setShowOnlyBookmarks(e.target.checked);
              if (e.target.checked) setShowOnlyMistakes(false);
            }}
            style={{ display: 'none' }}
          />
        </label>

        <label 
          className="option-btn" 
          style={{ 
            padding: '0.65rem 1rem', 
            fontSize: '0.95rem', 
            borderRadius: 'var(--radius-md)', 
            cursor: 'pointer',
            transform: 'none',
            justifyContent: 'center',
            gap: '0.5rem',
            background: showOnlyMistakes ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
            borderColor: showOnlyMistakes ? '#ef4444' : 'var(--border-glass)'
          }}
        >
          <AlertCircle size={16} style={{ color: showOnlyMistakes ? '#ef4444' : 'var(--text-secondary)' }} />
          <span>只看错题本</span>
          <input 
            type="checkbox"
            checked={showOnlyMistakes}
            onChange={(e) => {
              setShowOnlyMistakes(e.target.checked);
              if (e.target.checked) setShowOnlyBookmarks(false);
            }}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Words Table representation */}
      {filteredWords.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="word-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>序号</th>
                <th style={{ width: '90px' }}>学段</th>
                <th>英文单词 / 词组</th>
                <th>中文释义</th>
                <th>所属单元</th>
                <th style={{ width: '120px', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((item, idx) => {
                const isStarred = bookmarkedWords.some(w => w.word === item.word && w.grade === item.grade);
                const emoji = getWordEmoji(item.word, item.translation);
                return (
                  <tr key={idx} className="stagger-item" style={{ '--index': Math.min(idx, 15) }}>
                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '12px',
                          background: item.grade.endsWith('a') ? 'rgba(236, 72, 153, 0.15)' : 'rgba(192, 132, 252, 0.15)',
                          color: item.grade.endsWith('a') ? 'var(--accent-pink)' : 'var(--accent-violet)',
                          border: `1px solid ${item.grade.endsWith('a') ? 'var(--accent-pink)' : 'var(--accent-violet)'}`
                        }}
                      >
                        {item.grade.toUpperCase()}
                      </span>
                    </td>
                    <td
                      className="cell-word"
                      style={{ cursor: 'pointer' }}
                      onClick={() => playAudio(item.word)}
                      title="点击发音"
                    >
                      <span style={{ marginRight: '0.45rem', fontSize: '1.2rem' }}>{emoji}</span>
                      <span>{item.word}</span>
                      {mistakes.some(m => m.word === item.word && m.grade === item.grade) && (
                        <span 
                          style={{ 
                            fontSize: '0.7rem', 
                            background: 'rgba(239, 68, 68, 0.15)', 
                            color: '#ef4444', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '8px', 
                            marginLeft: '0.5rem',
                            border: '1px solid #ef4444',
                            fontWeight: 'bold'
                          }}
                          title={`答错次数: ${mistakes.find(m => m.word === item.word && m.grade === item.grade)?.errorCount || 1}次`}
                        >
                          错题
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: '500' }}>{item.translation}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {item.unitName} - {item.unitTitle}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button 
                          className="ctrl-btn" 
                          style={{ width: '36px', height: '36px' }}
                          onClick={() => playAudio(item.word)}
                          title="听发音"
                        >
                          <Volume2 size={16} />
                        </button>
                        <button 
                          className="ctrl-btn" 
                          style={{ width: '36px', height: '36px' }}
                          onClick={() => onToggleBookmark({ word: item.word, translation: item.translation })}
                          title={isStarred ? "取消收藏" : "加入收藏"}
                        >
                          <Star size={16} fill={isStarred ? 'var(--accent-yellow)' : 'transparent'} style={{ color: isStarred ? 'var(--accent-yellow)' : 'var(--text-secondary)' }} />
                        </button>
                        {mistakes.some(m => m.word === item.word && m.grade === item.grade) && (
                          <button 
                            className="ctrl-btn" 
                            style={{ width: '36px', height: '36px', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                            onClick={() => onRemoveMistake(item.word)}
                            title="移出错题本"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          没有找到匹配的词汇。
        </div>
      )}
    </div>
  )
}
