import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, GitBranch, Target, CheckCircle, AlertTriangle, HelpCircle, Sparkles, ArrowRight, RotateCcw, Award } from 'lucide-react'
import mathData from '../data/mathGrade2.json'
import { playCuteEffect } from '../utils/wordVisuals'

const STORAGE_KEY = 'oxford_math_g2_mastery';

const DIFF_LABEL = {
  basic: { text: '基础确认题', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  standard: { text: '标准过关题', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  challenge: { text: '思维拓展题', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
};

const STATUS_META = {
  mastered: { label: '🏆 已掌握', color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.5)' },
  shaky: { label: '🟡 巩固中(不稳)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(245, 158, 11, 0.5)' },
  weak: { label: '🔴 待加强(薄弱)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.16)', border: 'rgba(239, 68, 68, 0.5)' },
  untested: { label: '⚪ 未挑战', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.03)', border: 'var(--border-glass)' }
};

export default function MathArena({ onAwardStars, onAddStudyRecord, setActiveView }) {
  // Persistent mastery status per topicId: { [id]: 'mastered' | 'shaky' | 'weak' }
  const [masteryMap, setMasteryMap] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(masteryMap));
  }, [masteryMap]);

  // Build DAG structures (mirroring cn-math-taxonomy's buildGraph)
  const graph = useMemo(() => {
    const byId = {};
    const index = {};
    const prereqs = {};
    const dependents = {};
    const bank = {};

    mathData.topics.forEach((t, i) => {
      byId[t.id] = t;
      index[t.id] = i;
      prereqs[t.id] = [];
      dependents[t.id] = [];
      bank[t.id] = {};
    });

    mathData.dependencies.forEach(d => {
      if (!byId[d.topicId] || !byId[d.prerequisiteId]) return;
      prereqs[d.topicId].push({ id: d.prerequisiteId, strength: d.strength, reason: d.reason });
      dependents[d.prerequisiteId].push({ id: d.topicId, strength: d.strength, reason: d.reason });
    });

    // Sort hard prerequisites before soft prerequisites
    Object.keys(prereqs).forEach(id => {
      prereqs[id].sort((a, b) => {
        const sa = a.strength === 'hard' ? 0 : 1;
        const sb = b.strength === 'hard' ? 0 : 1;
        return sa !== sb ? sa - sb : index[a.id] - index[b.id];
      });
    });

    mathData.questions.forEach(q => {
      if (bank[q.topicId]) {
        bank[q.topicId][q.difficulty] = q;
      }
    });

    return { topics: mathData.topics, byId, index, prereqs, dependents, bank };
  }, []);

  const [semesterFilter, setSemesterFilter] = useState('all'); // 'all' | '2a' | '2b' | '1'
  const [inspectedId, setInspectedId] = useState('m_g2b_rem_intro');
  const [session, setSession] = useState(null); // Active adaptive diagnostic session

  // Filtered topics for map view
  const visibleTopics = useMemo(() => {
    return graph.topics.filter(t => {
      if (semesterFilter === '2a') return t.grade === 2 && t.semester === '上';
      if (semesterFilter === '2b') return t.grade === 2 && t.semester === '下';
      if (semesterFilter === '1') return t.grade === 1;
      return true;
    });
  }, [graph.topics, semesterFilter]);

  const stats = useMemo(() => {
    const g2Topics = graph.topics.filter(t => t.grade === 2);
    const mastered = g2Topics.filter(t => masteryMap[t.id] === 'mastered').length;
    const shaky = g2Topics.filter(t => masteryMap[t.id] === 'shaky').length;
    const weak = g2Topics.filter(t => masteryMap[t.id] === 'weak').length;
    return { total: g2Topics.length, mastered, shaky, weak };
  }, [graph.topics, masteryMap]);

  // Topological sort for learning path (lowest prerequisite first -> target)
  const topoSortIds = (ids) => {
    const set = new Set(ids);
    const indeg = {};
    set.forEach(id => {
      indeg[id] = graph.prereqs[id].filter(p => set.has(p.id)).length;
    });
    const ready = Array.from(set).filter(id => indeg[id] === 0);
    const order = [];
    while (ready.length > 0) {
      ready.sort((a, b) => graph.index[a] - graph.index[b]);
      const curr = ready.shift();
      order.push(curr);
      graph.dependents[curr].forEach(d => {
        if (!set.has(d.id)) return;
        indeg[d.id] -= 1;
        if (indeg[d.id] === 0) ready.push(d.id);
      });
    }
    return order;
  };

  // Start an adaptive backtracking diagnostic session on targetId
  const startDiagnosis = (targetId) => {
    playCuteEffect('note', 3);
    setSession({
      targetId,
      queue: [targetId],
      visited: new Set([targetId]),
      currentTopicId: targetId,
      stage: 'standard', // 'standard' -> 'challenge' (if right) OR 'basic' (if wrong)
      selectedOption: null,
      feedback: null, // { isCorrect, explanation }
      results: {}, // { [topicId]: 'mastered' | 'shaky' | 'weak' }
      traceLog: [], // [{ topicId, stage, isCorrect }]
      starsEarned: 0,
      finished: false
    });
  };

  const currentTopic = session ? graph.byId[session.currentTopicId] : null;
  const currentQuestion = session && currentTopic ? graph.bank[session.currentTopicId]?.[session.stage] : null;

  const handleAnswer = (opt) => {
    if (!session || session.feedback || !currentQuestion) return;
    const isCorrect = opt === currentQuestion.answer;

    if (isCorrect) {
      playCuteEffect('match');
    } else {
      playCuteEffect('wrong');
    }

    setSession(prev => ({
      ...prev,
      selectedOption: opt,
      feedback: {
        isCorrect,
        explanation: currentQuestion.explanation
      }
    }));
  };

  const handleNextStep = () => {
    if (!session || !session.feedback) return;
    const { isCorrect } = session.feedback;
    const tid = session.currentTopicId;
    const stage = session.stage;

    const nextResults = { ...session.results };
    const nextVisited = new Set(session.visited);
    let nextQueue = [...session.queue];
    let nextStars = session.starsEarned;
    const nextTrace = [...session.traceLog, { topicId: tid, stage, isCorrect }];

    // State machine mirroring cn-math-taxonomy:
    // standard (right) -> challenge
    // challenge (right) -> mastered!
    // standard/challenge (wrong) -> basic confirmation
    // basic (right) -> shaky (no backtrack)
    // basic (wrong) -> weak! Backtrack to unvisited prerequisites (hard first)
    if (stage === 'standard' && isCorrect && graph.bank[tid]?.challenge) {
      setSession(prev => ({
        ...prev,
        stage: 'challenge',
        selectedOption: null,
        feedback: null,
        traceLog: nextTrace
      }));
      return;
    }

    let topicOutcome = null;
    if ((stage === 'challenge' || stage === 'standard') && isCorrect) {
      topicOutcome = 'mastered';
      nextStars += 3;
      if (onAwardStars) onAwardStars(3);
    } else if ((stage === 'standard' || stage === 'challenge') && !isCorrect && graph.bank[tid]?.basic) {
      // Downgrade to basic confirmation question
      setSession(prev => ({
        ...prev,
        stage: 'basic',
        selectedOption: null,
        feedback: null,
        traceLog: nextTrace
      }));
      return;
    } else if (stage === 'basic' && isCorrect) {
      topicOutcome = 'shaky';
      nextStars += 1;
      if (onAwardStars) onAwardStars(1);
    } else {
      // basic wrong -> weak! Backtrack along prerequisite edges
      topicOutcome = 'weak';
      const prereqEdges = graph.prereqs[tid] || [];
      const toAdd = prereqEdges
        .map(e => e.id)
        .filter(pid => !nextVisited.has(pid) && masteryMap[pid] !== 'mastered');
      toAdd.forEach(pid => nextVisited.add(pid));
      // Insert prerequisites right after current item (DFS-like root-cause tracing, hard first)
      nextQueue = [nextQueue[0], ...toAdd, ...nextQueue.slice(1)];
    }

    if (topicOutcome) {
      nextResults[tid] = topicOutcome;
      setMasteryMap(prev => ({ ...prev, [tid]: topicOutcome }));
    }

    // Pop current topic and move to next in queue
    nextQueue.shift();

    if (nextQueue.length === 0) {
      playCuteEffect('win');
      const totalTested = Object.keys(nextResults).length;
      const masteredCount = Object.values(nextResults).filter(v => v === 'mastered').length;
      if (onAddStudyRecord) {
        onAddStudyRecord({
          date: new Date().toISOString().split('T')[0],
          grade: '2a',
          unitTitle: `数学小关: ${graph.byId[session.targetId].name}`,
          mode: '数学先修诊断',
          score: totalTested > 0 ? Math.round((masteredCount / totalTested) * 100) : 100,
          correctCount: masteredCount,
          totalCount: totalTested
        });
      }
      setSession(prev => ({
        ...prev,
        queue: [],
        visited: nextVisited,
        results: nextResults,
        traceLog: nextTrace,
        starsEarned: nextStars,
        selectedOption: null,
        feedback: null,
        finished: true
      }));
    } else {
      setSession(prev => ({
        ...prev,
        queue: nextQueue,
        visited: nextVisited,
        currentTopicId: nextQueue[0],
        stage: 'standard',
        results: nextResults,
        traceLog: nextTrace,
        starsEarned: nextStars,
        selectedOption: null,
        feedback: null
      }));
    }
  };

  // Render Active Adaptive Diagnostic Session
  if (session) {
    const targetTopic = graph.byId[session.targetId];

    if (session.finished) {
      const testedIds = Object.keys(session.results);
      const weakAndShakyIds = testedIds.filter(id => session.results[id] === 'weak' || session.results[id] === 'shaky');
      const studyPath = topoSortIds(weakAndShakyIds);
      const isAllMastered = weakAndShakyIds.length === 0;

      return (
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem', border: '2px solid var(--accent-pink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.8rem' }}>{isAllMastered ? '🏆' : '🧭'}</span>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>
                    {isAllMastered ? `太棒了！《${targetTopic.name}》一次通关！` : `诊断完成！已为您找到《${targetTopic.name}》的补学路径`}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                    本次共检测 {testedIds.length} 个知识点 · 累计获得 <strong>+{session.starsEarned} 颗星星 ⭐</strong>
                  </p>
                </div>
              </div>

              <button
                className="ctrl-action-btn"
                onClick={() => setSession(null)}
                style={{ borderRadius: '999px', padding: '0.5rem 1.2rem' }}
              >
                <ChevronLeft size={16} /> 返回数学小关地图
              </button>
            </div>

            {/* Tested Nodes Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {testedIds.map(id => {
                const t = graph.byId[id];
                const status = session.results[id];
                const meta = STATUS_META[status];
                return (
                  <div key={id} style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: meta.bg,
                    border: `1.5px solid ${meta.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: meta.color }}>{meta.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.grade}年级{t.semester}</span>
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '1rem' }}>{t.emoji} {t.name}</div>
                  </div>
                );
              })}
            </div>

            {/* Topological Remedial Learning Path */}
            {!isAllMastered && (
              <div style={{
                padding: '1.25rem',
                borderRadius: '14px',
                background: 'rgba(0,0,0,0.22)',
                border: '1px dashed var(--accent-cyan)'
              }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GitBranch size={18} /> 建议补学顺序（按先修关系从基础到高阶排列）：
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {studyPath.map((id, idx) => {
                    const t = graph.byId[id];
                    const st = session.results[id];
                    return (
                      <div key={id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.6rem',
                        padding: '0.7rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.04)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: 'var(--accent-pink)',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: '700' }}>
                              {t.emoji} {t.name} <span style={{ fontSize: '0.78rem', color: STATUS_META[st].color }}>({STATUS_META[st].label})</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.description}</div>
                          </div>
                        </div>

                        <button
                          className="action-btn"
                          onClick={() => startDiagnosis(id)}
                          style={{ padding: '0.35rem 0.9rem', borderRadius: '999px', fontSize: '0.82rem' }}
                        >
                          <RotateCcw size={13} /> 专项重练
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    const diffInfo = DIFF_LABEL[session.stage] || DIFF_LABEL.standard;
    const isBacktracking = session.currentTopicId !== session.targetId;

    return (
      <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            className="ctrl-action-btn"
            onClick={() => setSession(null)}
            style={{ borderRadius: '20px', padding: '0.45rem 1rem' }}
          >
            <ChevronLeft size={16} /> 退出本次诊断
          </button>

          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            目标关卡：{targetTopic.emoji} {targetTopic.name} · 剩余队列 {session.queue.length} 个点
          </div>
        </div>

        {/* Backtracking Notice */}
        {isBacktracking && (
          <div style={{
            padding: '0.8rem 1.1rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(239, 68, 68, 0.14))',
            border: '1.5px solid rgba(245, 158, 11, 0.5)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <span style={{ fontSize: '1.3rem' }}>🧭</span>
            <div>
              <strong>正在沿着先修图谱往回追溯根因：</strong>
              刚才那一步没过关，咱们先检查它的前置基础 <strong>【{currentTopic.grade}年级{currentTopic.semester} · {currentTopic.name}】</strong> 掌握得稳不稳！
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{currentTopic.emoji}</span>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{currentTopic.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentTopic.chapter}</div>
              </div>
            </div>

            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: '800',
              color: diffInfo.color,
              background: diffInfo.bg,
              border: `1px solid ${diffInfo.color}`
            }}>
              {diffInfo.text}
            </span>
          </div>

          <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1.6, marginBottom: '1.25rem', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
            {currentQuestion?.prompt}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {currentQuestion?.options.map((opt, idx) => {
              const isChosen = session.selectedOption === opt;
              const isRight = opt === currentQuestion.answer;
              let bg = 'rgba(255,255,255,0.04)';
              let border = 'var(--border-glass)';
              let color = 'var(--text-primary)';

              if (session.feedback) {
                if (isRight) {
                  bg = 'rgba(16, 185, 129, 0.2)';
                  border = '#10b981';
                  color = '#10b981';
                } else if (isChosen && !isRight) {
                  bg = 'rgba(239, 68, 68, 0.2)';
                  border = '#ef4444';
                  color = '#ef4444';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt)}
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${border}`,
                    background: bg,
                    color,
                    textAlign: 'left',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    cursor: session.feedback ? 'default' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                </button>
              );
            })}
          </div>

          {session.feedback && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: session.feedback.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderLeft: `4px solid ${session.feedback.isCorrect ? '#10b981' : '#ef4444'}`
            }}>
              <div style={{ fontWeight: '800', fontSize: '1.02rem', color: session.feedback.isCorrect ? '#10b981' : '#ef4444', marginBottom: '0.35rem' }}>
                {session.feedback.isCorrect
                  ? (session.stage === 'standard' ? '✅ 答对啦！再来一道【思维拓展题】确认彻底掌握！'
                    : session.stage === 'challenge' ? '🏆 太厉害了！连续答对，本知识点判定【已掌握 +3⭐】！'
                    : '🟡 基础确认题答对啦！本知识点记为【巩固中 +1⭐】！')
                  : (session.stage === 'basic'
                    ? '🔴 哎呀基础确认题也错了！系统将自动沿着先修图谱往回检查前置基础～'
                    : '💡 没关系！先看看解析，接下来系统会降级出一道【基础确认题】帮你找准卡点：')}
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
                {session.feedback.explanation}
              </div>

              <button
                className="action-btn"
                onClick={handleNextStep}
                style={{ borderRadius: '999px', padding: '0.55rem 1.5rem', fontWeight: '800' }}
              >
                <span>继续下一步</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inspected Topic for Prerequisite Graph Viewer
  const inspectedTopic = graph.byId[inspectedId] || graph.topics[0];
  const inspectedPrereqs = graph.prereqs[inspectedTopic.id] || [];
  const inspectedDependents = graph.dependents[inspectedTopic.id] || [];

  return (
    <div className="math-arena-view" style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          className="ctrl-action-btn"
          onClick={() => setActiveView('dashboard')}
          style={{ borderRadius: '20px', padding: '0.5rem 1rem' }}
        >
          <ChevronLeft size={16} />
          <span>返回学习看板</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: '全部图谱 (17点)' },
            { id: '2a', label: '二年级上册 (2A)' },
            { id: '2b', label: '二年级下册 (2B)' },
            { id: '1', label: '一年级前置基础' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`toggle-btn ${semesterFilter === tab.id ? 'active' : ''}`}
              onClick={() => setSemesterFilter(tab.id)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '999px',
                border: '1px solid var(--border-glass)',
                background: semesterFilter === tab.id ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255,255,255,0.04)',
                color: semesterFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Header */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(139, 92, 246, 0.14))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#fff',
                padding: '0.2rem 0.7rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: '800'
              }}>
                参考 cn-math-taxonomy 先修图谱架构
              </span>
            </div>
            <h1 style={{ fontSize: '1.7rem', marginBottom: '0.3rem' }}>🧮 二年级数学先修小关</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              答对直通拓展拿 3⭐；答错会自动沿 <strong>先修关系边 (hard/soft)</strong> 往回追溯，帮你找到真正没学会的那一步！
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.6rem 1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#10b981' }}>{stats.mastered}/{stats.total}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🏆 已掌握</div>
            </div>
            <div style={{ padding: '0.6rem 1rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f59e0b' }}>{stats.shaky}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🟡 巩固中</div>
            </div>
            <div style={{ padding: '0.6rem 1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#ef4444' }}>{stats.weak}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🔴 待加强</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Prerequisite Tree Inspector */}
      <div className="glass-card" style={{ padding: '1.35rem 1.5rem', border: '1.5px solid var(--accent-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <GitBranch size={18} /> 知识图谱关联透视：{inspectedTopic.emoji} {inspectedTopic.name}
          </h3>
          <button
            className="action-btn"
            onClick={() => startDiagnosis(inspectedTopic.id)}
            style={{ borderRadius: '999px', padding: '0.45rem 1.2rem', fontSize: '0.88rem' }}
          >
            <Target size={15} /> 对此知识点开始自适应诊断
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Prerequisites */}
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              ⬆️ 先修基础（不会下面这些，当前关容易卡壳）：
            </div>
            {inspectedPrereqs.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🌱 它是基础起点知识点，无前置依赖！</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {inspectedPrereqs.map(edge => {
                  const pt = graph.byId[edge.id];
                  return (
                    <div
                      key={edge.id}
                      onClick={() => setInspectedId(edge.id)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        border: edge.strength === 'hard' ? '1px solid rgba(236, 72, 153, 0.5)' : '1px dashed rgba(148, 163, 184, 0.4)',
                        cursor: 'pointer',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        {pt.emoji} {pt.name}
                        <span style={{
                          marginLeft: '0.4rem',
                          fontSize: '0.7rem',
                          padding: '0.05rem 0.4rem',
                          borderRadius: '999px',
                          background: edge.strength === 'hard' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                          color: edge.strength === 'hard' ? 'var(--accent-pink)' : 'var(--text-muted)'
                        }}>
                          {edge.strength === 'hard' ? '硬先修' : '软关联'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{edge.reason}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Center Current Node */}
          <div style={{
            padding: '1rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.18), rgba(139, 92, 246, 0.18))',
            border: '2px solid var(--accent-pink)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>{inspectedTopic.emoji}</div>
            <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>{inspectedTopic.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', margin: '0.2rem 0 0.4rem' }}>{inspectedTopic.chapter}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{inspectedTopic.description}</div>
          </div>

          {/* Dependents */}
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              ⬇️ 学会它能解锁的后续关卡：
            </div>
            {inspectedDependents.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🏁 本册压轴综合应用关卡！</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {inspectedDependents.map(edge => {
                  const dt = graph.byId[edge.id];
                  return (
                    <div
                      key={edge.id}
                      onClick={() => setInspectedId(edge.id)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border-glass)',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {dt.emoji} {dt.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({dt.grade}年级{dt.semester})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topic Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
        {visibleTopics.map(t => {
          const st = masteryMap[t.id] || 'untested';
          const meta = STATUS_META[st];
          const isInspected = inspectedId === t.id;
          const prereqCount = (graph.prereqs[t.id] || []).length;

          return (
            <div
              key={t.id}
              className="glass-card"
              onClick={() => setInspectedId(t.id)}
              style={{
                padding: '1.15rem',
                borderRadius: '16px',
                cursor: 'pointer',
                border: isInspected ? '2px solid var(--accent-cyan)' : `1.5px solid ${meta.border}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                transition: 'transform 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    background: meta.bg,
                    color: meta.color
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    {t.grade}年级{t.semester} · {t.domain}
                  </span>
                </div>

                <div style={{ fontSize: '1.12rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                  {t.emoji} {t.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', marginBottom: '0.35rem' }}>
                  {t.chapter}
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {t.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  🔗 先修前置: {prereqCount} 项
                </span>
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    startDiagnosis(t.id);
                  }}
                  style={{ padding: '0.38rem 0.9rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: '800' }}
                >
                  {st === 'untested' ? '开始闯关 🎯' : '重新诊断 🔄'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
