import React, { useState, useEffect } from 'react'
import { ChevronLeft, Volume2, Sparkles, RefreshCw, Lightbulb, Trophy, Flame } from 'lucide-react'
import { getWordEmoji, playCuteEffect } from '../utils/wordVisuals'

export default function Games({
  grade,
  units,
  selectedUnit,
  setSelectedUnit,
  playAudio,
  onAwardStars,
  setActiveView
}) {
  const defaultUnit = selectedUnit || units.find(u => u.isNew) || units[0];
  const [activeUnit, setActiveUnit] = useState(defaultUnit);
  const [gameMode, setGameMode] = useState('bubbles'); // 'bubbles' | 'scramble'

  // --- Bubble Match State ---
  const [bubbles, setBubbles] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [wrongPairIds, setWrongPairIds] = useState([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [bubbleGameWon, setBubbleGameWon] = useState(false);

  // --- Scramble Builder State ---
  const [scramblePool, setScramblePool] = useState([]);
  const [scrambleIdx, setScrambleIdx] = useState(0);
  const [targetChars, setTargetChars] = useState([]);
  const [tilePool, setTilePool] = useState([]);
  const [filledCount, setFilledCount] = useState(0);
  const [wrongTileId, setWrongTileId] = useState(null);
  const [wordSolved, setWordSolved] = useState(false);
  const [scrambleWon, setScrambleWon] = useState(false);

  useEffect(() => {
    if (selectedUnit) {
      setActiveUnit(selectedUnit);
    } else if (units && units.length > 0) {
      setActiveUnit(units.find(u => u.isNew) || units[0]);
    }
  }, [selectedUnit, units]);

  // Timer for Bubble Match
  useEffect(() => {
    if (gameMode !== 'bubbles' || bubbleGameWon || bubbles.length === 0) return;
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameMode, bubbleGameWon, bubbles.length]);

  // Start Bubble Match Round
  const initBubbleGame = (unitObj = activeUnit) => {
    if (!unitObj || !unitObj.words || unitObj.words.length === 0) return;
    const pool = [...unitObj.words].sort(() => Math.random() - 0.5).slice(0, 6);
    const items = [];
    pool.forEach((w, idx) => {
      const emoji = getWordEmoji(w.word, w.translation);
      items.push({
        id: `en-${idx}`,
        pairId: idx,
        type: 'en',
        text: w.word,
        word: w.word,
        emoji
      });
      items.push({
        id: `cn-${idx}`,
        pairId: idx,
        type: 'cn',
        text: w.translation,
        word: w.word,
        emoji
      });
    });

    setBubbles(items.sort(() => Math.random() - 0.5));
    setSelectedBubble(null);
    setMatchedIds([]);
    setWrongPairIds([]);
    setCombo(0);
    setMaxCombo(0);
    setSeconds(0);
    setBubbleGameWon(false);
  };

  // Start Scramble Builder Round
  const initScrambleGame = (unitObj = activeUnit) => {
    if (!unitObj || !unitObj.words || unitObj.words.length === 0) return;
    const pool = [...unitObj.words].sort(() => Math.random() - 0.5).slice(0, 5);
    setScramblePool(pool);
    setScrambleIdx(0);
    setScrambleWon(false);
    setupScrambleWord(pool[0]);
  };

  const setupScrambleWord = (wordObj) => {
    if (!wordObj) return;
    const raw = wordObj.word.trim();
    // If it's a multi-word phrase with >= 3 words, split by words; otherwise split by characters (excluding spaces)
    const isLongPhrase = raw.split(/\s+/).length >= 3;
    const unitsList = isLongPhrase
      ? raw.split(/\s+/)
      : raw.split('').filter(ch => ch !== ' ');

    setTargetChars(unitsList);
    const scrambled = unitsList.map((val, i) => ({
      id: `tile-${i}-${val}`,
      val,
      used: false
    })).sort(() => Math.random() - 0.5);

    setTilePool(scrambled);
    setFilledCount(0);
    setWrongTileId(null);
    setWordSolved(false);
    setTimeout(() => {
      playAudio(wordObj.word);
    }, 250);
  };

  useEffect(() => {
    if (!activeUnit) return;
    if (gameMode === 'bubbles') {
      initBubbleGame(activeUnit);
    } else {
      initScrambleGame(activeUnit);
    }
  }, [activeUnit, gameMode]);

  const handleBubbleClick = (bubble) => {
    if (matchedIds.includes(bubble.pairId) || wrongPairIds.length > 0) return;

    // Speak English word when clicking an English bubble
    if (bubble.type === 'en') {
      playAudio(bubble.word);
    } else {
      playCuteEffect('note', bubble.pairId);
    }

    if (!selectedBubble) {
      setSelectedBubble(bubble);
      return;
    }

    if (selectedBubble.id === bubble.id) {
      setSelectedBubble(null);
      return;
    }

    // Check match
    if (selectedBubble.pairId === bubble.pairId && selectedBubble.type !== bubble.type) {
      const nextMatched = [...matchedIds, bubble.pairId];
      setMatchedIds(nextMatched);
      setSelectedBubble(null);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);
      playCuteEffect('match');
      playAudio(bubble.word);

      // Check win
      const totalPairs = bubbles.length / 2;
      if (nextMatched.length === totalPairs) {
        setTimeout(() => {
          setBubbleGameWon(true);
          if (onAwardStars) onAwardStars(3);
        }, 450);
      }
    } else {
      // Mismatch
      setCombo(0);
      setWrongPairIds([selectedBubble.id, bubble.id]);
      setTimeout(() => {
        setWrongPairIds([]);
        setSelectedBubble(null);
      }, 650);
    }
  };

  const handleTileClick = (tile) => {
    if (tile.used || wordSolved) return;
    const expectedVal = targetChars[filledCount];

    if (tile.val.toLowerCase() === expectedVal.toLowerCase()) {
      const nextFilled = filledCount + 1;
      playCuteEffect('note', nextFilled);
      setTilePool(prev => prev.map(t => t.id === tile.id ? { ...t, used: true } : t));
      setFilledCount(nextFilled);

      if (nextFilled === targetChars.length) {
        setWordSolved(true);
        playCuteEffect('match');
        const currentWordObj = scramblePool[scrambleIdx];
        if (currentWordObj) playAudio(currentWordObj.word);

        setTimeout(() => {
          if (scrambleIdx + 1 < scramblePool.length) {
            const nextIndex = scrambleIdx + 1;
            setScrambleIdx(nextIndex);
            setupScrambleWord(scramblePool[nextIndex]);
          } else {
            setScrambleWon(true);
            if (onAwardStars) onAwardStars(4);
          }
        }, 1300);
      }
    } else {
      setWrongTileId(tile.id);
      setTimeout(() => setWrongTileId(null), 450);
    }
  };

  const handleScrambleHint = () => {
    if (wordSolved || filledCount >= targetChars.length) return;
    const expectedVal = targetChars[filledCount];
    const matchingTile = tilePool.find(t => !t.used && t.val.toLowerCase() === expectedVal.toLowerCase());
    if (matchingTile) {
      handleTileClick(matchingTile);
    }
  };

  if (!activeUnit) return null;
  const currentScrambleWord = scramblePool[scrambleIdx];

  return (
    <div className="games-view" style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          className="ctrl-action-btn"
          onClick={() => setActiveView('dashboard')}
          style={{ padding: '0.5rem 1rem', borderRadius: '20px' }}
        >
          <ChevronLeft size={16} />
          <span>返回学习看板</span>
        </button>

        <select
          className="select-dropdown"
          value={activeUnit.unit}
          onChange={(e) => {
            const found = units.find(u => u.unit === e.target.value);
            if (found) {
              setActiveUnit(found);
              setSelectedUnit(found);
            }
          }}
          style={{ flex: 1, maxWidth: '280px' }}
        >
          {units.map(u => (
            <option key={u.unit} value={u.unit}>
              {u.unit}: {u.title}{u.isNew ? ' ✨ (NEW)' : ''}
            </option>
          ))}
        </select>

        <div className="toggle-group" style={{ margin: 0, padding: '4px', background: 'rgba(0,0,0,0.22)', borderRadius: '999px' }}>
          <button
            className={`toggle-btn ${gameMode === 'bubbles' ? 'active' : ''}`}
            onClick={() => setGameMode('bubbles')}
            style={{ borderRadius: '999px', padding: '0.45rem 1.1rem', fontWeight: 'bold' }}
          >
            🫧 魔法泡泡消消乐
          </button>
          <button
            className={`toggle-btn ${gameMode === 'scramble' ? 'active' : ''}`}
            onClick={() => setGameMode('scramble')}
            style={{ borderRadius: '999px', padding: '0.45rem 1.1rem', fontWeight: 'bold' }}
          >
            🧩 磁力字母拼拼乐
          </button>
        </div>
      </div>

      {/* GAME 1: BUBBLE MATCH MANIA */}
      {gameMode === 'bubbles' && (
        <div className="glass-card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🫧 魔法泡泡配对消消乐</span>
                <span style={{ fontSize: '0.8rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '999px' }}>
                  通关奖励 +3 ⭐
                </span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                点击对应的【英文泡泡】和【中文意思泡泡】，让它们施展魔法消掉吧！
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {combo >= 2 && (
                <div className="combo-pill" style={{
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  color: '#fff',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)',
                  animation: 'pulse 0.8s infinite'
                }}>
                  <Flame size={16} />
                  <span>{combo} 连击!</span>
                </div>
              )}
              <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.4rem 0.85rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                ⏱️ {seconds}秒
              </div>
              <button
                className="ctrl-action-btn"
                onClick={() => initBubbleGame(activeUnit)}
                style={{ padding: '0.4rem 0.85rem', borderRadius: '12px' }}
                title="换一批单词"
              >
                <RefreshCw size={16} />
                <span>换一批</span>
              </button>
            </div>
          </div>

          {!bubbleGameWon ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
              gap: '1rem',
              marginTop: '0.5rem'
            }}>
              {bubbles.map((b) => {
                const isMatched = matchedIds.includes(b.pairId);
                const isSelected = selectedBubble?.id === b.id;
                const isWrong = wrongPairIds.includes(b.id);

                return (
                  <button
                    key={b.id}
                    onClick={() => handleBubbleClick(b)}
                    disabled={isMatched}
                    className={`magic-bubble-card ${isSelected ? 'selected' : ''} ${isWrong ? 'wrong' : ''} ${isMatched ? 'matched' : ''}`}
                    style={{
                      minHeight: '96px',
                      borderRadius: '20px',
                      padding: '0.85rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      cursor: isMatched ? 'default' : 'pointer',
                      border: isSelected
                        ? '2.5px solid var(--accent-pink)'
                        : isWrong
                          ? '2.5px solid #ef4444'
                          : '1.5px solid var(--border-glass)',
                      background: isMatched
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isSelected
                          ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.28), rgba(139, 92, 246, 0.28))'
                          : b.type === 'en'
                            ? 'rgba(139, 92, 246, 0.14)'
                            : 'rgba(236, 72, 153, 0.12)',
                      color: 'var(--text-primary)',
                      opacity: isMatched ? 0.22 : 1,
                      transform: isMatched ? 'scale(0.85)' : isSelected ? 'scale(1.05) translateY(-3px)' : 'scale(1)',
                      boxShadow: isSelected ? '0 8px 20px rgba(236, 72, 153, 0.35)' : '0 4px 12px rgba(0,0,0,0.15)',
                      transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    <span style={{ fontSize: '1.55rem', lineHeight: 1 }}>
                      {isMatched ? '✨' : b.type === 'cn' ? b.emoji : '🔊'}
                    </span>
                    <span style={{
                      fontWeight: b.type === 'en' ? '800' : '600',
                      fontSize: b.type === 'en' ? '1.1rem' : '0.95rem',
                      textAlign: 'center',
                      wordBreak: 'break-word'
                    }}>
                      {b.text}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '4rem', animation: 'bounce 1s infinite' }}>🎉🫧🏆</div>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--accent-pink)' }}>
                太厉害啦！全部泡泡消除成功！
              </h3>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
                用时 <strong>{seconds} 秒</strong> · 最高连击 <strong>🔥 {maxCombo} 连击</strong> · 获得奖励 <strong>+3 颗星星 ⭐</strong>！
              </p>
              <button
                className="action-btn"
                onClick={() => initBubbleGame(activeUnit)}
                style={{ marginTop: '0.5rem', padding: '0.75rem 2rem', borderRadius: '999px', fontSize: '1.05rem' }}
              >
                🔄 再玩一局消消乐
              </button>
            </div>
          )}
        </div>
      )}

      {/* GAME 2: MAGNETIC WORD SCRAMBLE */}
      {gameMode === 'scramble' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🧩 魔法磁力拼词王</span>
                <span style={{ fontSize: '0.8rem', background: 'linear-gradient(135deg, #f59e0b, #10b981)', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '999px' }}>
                  通关奖励 +4 ⭐
                </span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                不用打字！按顺序点击下方的彩色磁力块，拼出正确的英文单词或词组吧！
              </p>
            </div>

            {!scrambleWon && scramblePool.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                  进度: {scrambleIdx + 1} / {scramblePool.length}
                </span>
                <button
                  className="ctrl-action-btn"
                  onClick={handleScrambleHint}
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#1e1b4b',
                    fontWeight: 'bold',
                    border: 'none',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '999px'
                  }}
                >
                  <Lightbulb size={16} />
                  <span>魔法提示</span>
                </button>
              </div>
            )}
          </div>

          {!scrambleWon && currentScrambleWord ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem 0' }}>
              {/* Prompt Card */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1.25rem 2.5rem',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-glass)'
              }}>
                <div style={{ fontSize: '3.5rem', lineHeight: 1.1 }}>
                  {getWordEmoji(currentScrambleWord.word, currentScrambleWord.translation)}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {currentScrambleWord.translation}
                </div>
                <button
                  className="ctrl-action-btn"
                  onClick={() => playAudio(currentScrambleWord.word)}
                  style={{ borderRadius: '999px', padding: '0.35rem 1rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  <Volume2 size={16} />
                  <span>听单词发音</span>
                </button>
              </div>

              {/* Target Slots */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', minHeight: '60px' }}>
                {targetChars.map((ch, idx) => {
                  const isFilled = idx < filledCount;
                  return (
                    <div
                      key={idx}
                      style={{
                        minWidth: ch.length > 1 ? '80px' : '48px',
                        height: '54px',
                        padding: '0 0.75rem',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.35rem',
                        fontWeight: '800',
                        background: isFilled
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'rgba(255,255,255,0.04)',
                        color: isFilled ? '#fff' : 'var(--text-muted)',
                        border: isFilled
                          ? '2px solid #34d399'
                          : idx === filledCount
                            ? '2px dashed var(--accent-pink)'
                            : '2px dashed var(--border-glass)',
                        boxShadow: isFilled ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                        transform: isFilled ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isFilled ? ch : '?'}
                    </div>
                  );
                })}
              </div>

              {wordSolved && (
                <div style={{ color: 'var(--accent-green)', fontWeight: '800', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={20} />
                  <span>Well done! 拼写完全正确：{currentScrambleWord.word}！</span>
                </div>
              )}

              {/* Magnetic Tiles Pool */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                {tilePool.map((tile) => {
                  const isWrong = wrongTileId === tile.id;
                  return (
                    <button
                      key={tile.id}
                      disabled={tile.used}
                      onClick={() => handleTileClick(tile)}
                      style={{
                        minWidth: tile.val.length > 1 ? '88px' : '54px',
                        height: '56px',
                        padding: '0 0.9rem',
                        borderRadius: '16px',
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        cursor: tile.used ? 'default' : 'pointer',
                        background: tile.used
                          ? 'rgba(255,255,255,0.03)'
                          : isWrong
                            ? '#ef4444'
                            : 'linear-gradient(135deg, var(--accent-violet), var(--accent-pink))',
                        color: tile.used ? 'transparent' : '#fff',
                        border: '2px solid rgba(255,255,255,0.25)',
                        opacity: tile.used ? 0.2 : 1,
                        transform: tile.used ? 'scale(0.85)' : isWrong ? 'translateX(-6px)' : 'translateY(0)',
                        boxShadow: tile.used ? 'none' : '0 6px 15px rgba(236, 72, 153, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {tile.val}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '4rem' }}>👑🧩✨</div>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--accent-pink)' }}>
                太棒啦！你完成了本轮全部单词拼写！
              </h3>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
                成功拼出 <strong>{scramblePool.length} 个单词/短语</strong> · 获得奖励 <strong>+4 颗星星 ⭐</strong>！
              </p>
              <button
                className="action-btn"
                onClick={() => initScrambleGame(activeUnit)}
                style={{ marginTop: '0.5rem', padding: '0.75rem 2rem', borderRadius: '999px', fontSize: '1.05rem' }}
              >
                🔄 再挑战一轮拼词
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
