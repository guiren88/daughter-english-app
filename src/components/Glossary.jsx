import React, { useState, useEffect } from 'react'
import { Volume2, Star, Search, Filter, AlertCircle, Check, ChevronLeft } from 'lucide-react'

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
  const [gradeFilter, setGradeFilter] = useState(currentGrade || 'all'); // 'all', '1a', '1b'
  const [unitFilter, setUnitFilter] = useState('all');

  // Sync gradeFilter with currentGrade when currentGrade changes
  useEffect(() => {
    if (currentGrade) {
      setGradeFilter(currentGrade);
    }
  }, [currentGrade]);

  // Reset unit filter when grade filter changes
  useEffect(() => {
    setUnitFilter('all');
  }, [gradeFilter])

  // Get units list for the Unit dropdown based on selected grade
  const getDropdownUnits = () => {
    if (gradeFilter === 'all') return [];
    return vocabData[`grade_${gradeFilter}`] || [];
  }

  // Compile words database based on Grade filter
  let allWords = [];
  
  Object.keys(vocabData).forEach(key => {
    const gradeVal = key.replace('grade_', '');
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

  // Filter words based on search term, unit, bookmarks, and mistakes
  const filteredWords = allWords.filter(wordObj => {
    const isBookmarked = bookmarkedWords.some(w => w.word === wordObj.word && w.grade === wordObj.grade);
    const isMistake = mistakes.some(m => m.word === wordObj.word && m.grade === wordObj.grade);
    
    // Search match
    const matchesSearch = 
      wordObj.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wordObj.translation.includes(searchTerm);
      
    // Unit match
    const matchesUnit = unitFilter === 'all' || wordObj.unitName === unitFilter;
    
    // Bookmarks match
    const matchesBookmark = !showOnlyBookmarks || isBookmarked;

    // Mistakes match
    const matchesMistake = !showOnlyMistakes || isMistake;
    
    return matchesSearch && matchesUnit && matchesBookmark && matchesMistake;
  });



  const dropdownUnits = getDropdownUnits();

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)', marginBottom: 0 }}>
          🔍 核心词汇索引大纲 (全量 1A - 5B 词库)
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
        {/* 1. Search Query Input */}
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

        {/* 2. Grade Filter Select */}
        <select 
          className="select-dropdown"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          <option value="all">全套词库 (1A - 5B)</option>
          {Object.keys(vocabData).map(key => {
            const val = key.replace('grade_', '');
            const display = val.toUpperCase();
            return (
              <option key={val} value={val}>
                {display.replace('A', 'A (上册)').replace('B', 'B (下册)')}
              </option>
            );
          })}
        </select>

        {/* 3. Unit Filter Select (Disabled when All Grades selected) */}
        <select 
          className="select-dropdown"
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          disabled={gradeFilter === 'all'}
          style={{ opacity: gradeFilter === 'all' ? 0.6 : 1 }}
        >
          <option value="all">所有单元</option>
          {dropdownUnits.map(u => (
            <option key={u.unit} value={u.unit}>{u.unit}: {u.title}</option>
          ))}
        </select>

        {/* 4. Only Bookmarks Toggle */}
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

        {/* 5. Only Mistakes Toggle */}
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
                    <td className="cell-word">
                      {item.word}
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
