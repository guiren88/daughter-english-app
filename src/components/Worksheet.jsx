import React, { useState, useEffect } from 'react'
import { Printer, RefreshCw, FileText, ChevronLeft } from 'lucide-react'

export default function Worksheet({ grade, units, selectedUnit, setSelectedUnit, setActiveView }) {
  const activeUnit = selectedUnit || units[0];

  const [sheetType, setSheetType] = useState('matching'); // 'matching', 'cards', 'writing'
  const [shuffledWords, setShuffledWords] = useState([]);
  const [shuffledTranslations, setShuffledTranslations] = useState([]);

  // Regenerate/shuffle sheet items when active unit or sheet type changes
  useEffect(() => {
    if (activeUnit) {
      const words = [...activeUnit.words];
      
      // Shuffle words for writing or card printing
      const shuffledW = [...words].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffledW);

      // Shuffle matching column translations separately
      const shuffledT = [...words]
        .map((w, idx) => ({ translation: w.translation, key: idx }))
        .sort(() => Math.random() - 0.5);
      setShuffledTranslations(shuffledT);
    }
  }, [activeUnit, sheetType])

  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="worksheet-view">
      {/* Worksheet Settings Dashboard Bar */}
      <div className="worksheet-toolbar no-print">
        <button 
          className="ctrl-action-btn"
          onClick={() => {
            setActiveView('dashboard');
            setSelectedUnit(null);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '20px' }}
        >
          <ChevronLeft size={16} />
          <span>返回目录</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>选择单元:</span>
          <select 
            className="select-dropdown"
            value={activeUnit.unit}
            onChange={(e) => {
              const found = units.find(u => u.unit === e.target.value);
              if (found) setSelectedUnit(found);
            }}
          >
            {units.map(u => (
              <option key={u.unit} value={u.unit}>{u.unit}: {u.title}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`nav-btn ${sheetType === 'matching' ? 'active' : ''}`}
            onClick={() => setSheetType('matching')}
          >
            连线测试纸
          </button>
          <button 
            className={`nav-btn ${sheetType === 'writing' ? 'active' : ''}`}
            onClick={() => setSheetType('writing')}
          >
            描红写字本
          </button>
          <button 
            className={`nav-btn ${sheetType === 'cards' ? 'active' : ''}`}
            onClick={() => setSheetType('cards')}
          >
            卡片打印版
          </button>
        </div>

        <button className="action-btn" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={18} />
          <span>立即打印</span>
        </button>
      </div>

      {/* Printable Area - Rendered white/black layout */}
      <div className="printable-area">
        {/* Header (Unit metadata) */}
        <div className="print-header">
          <h2>英语作业设计</h2>
          <h3>
            Oxford English {grade.toUpperCase()} — {activeUnit.unit} {activeUnit.title}
          </h3>
          <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '0.25rem' }}>
            类型: {sheetType === 'matching' ? '核心词汇连线训练' : sheetType === 'writing' ? '看中文拼写英文练习' : '单词卡片裁剪打印'}
          </div>
        </div>

        {/* Name / Class input field header */}
        <div className="print-student-info">
          <span>班级: ____________________</span>
          <span>姓名: ____________________</span>
          <span>得分: ____________________</span>
        </div>

        {/* 1. MATCHING COLUMN TEST VIEW */}
        {sheetType === 'matching' && (
          <div>
            <p style={{ fontWeight: 'bold', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
              题目：请将左侧英文单词与其右侧正确的中文意思连线。
            </p>
            <div className="print-matching-container">
              {/* Left column (English words) */}
              <div className="print-col">
                {shuffledWords.map((item, idx) => (
                  <div key={idx} className="matching-item" style={{ height: '35px' }}>
                    <span className="matching-num">{idx + 1}.</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-title)' }}>
                      {item.word}
                    </span>
                    <span className="matching-line-blank"></span>
                  </div>
                ))}
              </div>

              {/* Right column (Chinese translations shuffled) */}
              <div className="print-col" style={{ paddingLeft: '2rem' }}>
                {shuffledTranslations.map((item, idx) => (
                  <div key={idx} className="matching-item" style={{ height: '35px', justifyContent: 'flex-start' }}>
                    <span className="matching-num" style={{ marginRight: '1rem' }}>
                      ({String.fromCharCode(65 + idx)})
                    </span>
                    <span style={{ fontSize: '1.1rem' }}>{item.translation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. SPELLING / WRITING TRAINING SHEET */}
        {sheetType === 'writing' && (
          <div>
            <p style={{ fontWeight: 'bold', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
              题目：请根据左侧中文意思，在右侧格子中拼写出正确的英文单词。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {shuffledWords.map((item, idx) => (
                <div key={idx} className="spelling-grid-item">
                  <span style={{ width: '30px', fontWeight: 'bold' }}>{idx + 1}.</span>
                  <div className="spelling-grid-trans">
                    <strong>{item.translation}</strong>
                  </div>
                  
                  {/* Empty cells grids according to word length */}
                  <div className="spelling-cells">
                    {item.word.split('').map((char, charIdx) => {
                      const isSpace = char === ' ';
                      if (isSpace) {
                        return <span key={charIdx} style={{ width: '15px' }}></span>;
                      }
                      return (
                        <span 
                          key={charIdx} 
                          className="spelling-cell" 
                          style={{ border: '1.5px solid #111827', width: '32px', height: '32px' }}
                        ></span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. CARD CUTOUTS PRINTING VIEW */}
        {sheetType === 'cards' && (
          <div>
            <p className="no-print" style={{ color: '#ef4444', marginBottom: '1.5rem', fontWeight: 'bold' }}>
              温馨提示: 打印后，可沿着虚线裁剪为独立单词记忆卡片。
            </p>
            <div className="print-cards-grid">
              {shuffledWords.map((item, idx) => (
                <div key={idx} className="print-card-cutout">
                  <div className="print-card-eng">{item.word}</div>
                  <div className="print-card-chi">{item.translation}</div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '10px' }}>
                    {grade.toUpperCase()} - {activeUnit.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer print stamp */}
        <div style={{ marginTop: '4rem', textAlign: 'right', fontSize: '0.85rem', color: '#4b5563', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          女儿的英语课 一年级英语组 • 助学看板工具自动生成
        </div>
      </div>
    </div>
  )
}
