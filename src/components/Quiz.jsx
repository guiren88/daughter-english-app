import React, { useState, useEffect } from 'react'
import { Check, X, Award, RefreshCw, Volume2, HelpCircle, ChevronLeft, AlertCircle } from 'lucide-react'

export default function Quiz({ grade, units, selectedUnit, setSelectedUnit, playAudio, setActiveView, mistakes, onAddMistake, onRemoveMistake, onAwardStars, onAddStudyRecord }) {
  const activeUnit = selectedUnit || null;

  const [quizMode, setQuizMode] = useState('eng-to-chi'); // 'eng-to-chi', 'chi-to-eng', 'spelling'
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // for multiple choice
  const [typedAnswer, setTypedAnswer] = useState(''); // for spelling
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answeredList, setAnsweredList] = useState([]); // track user answers for review
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [activeSongName, setActiveSongName] = useState('');
  const [initialMistakesCount, setInitialMistakesCount] = useState(0);
  const [starsAwarded, setStarsAwarded] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState(''); // 'correct', 'wrong', or ''
  const [recognizedText, setRecognizedText] = useState('');

  const celebrationCtxRef = React.useRef(null);
  const celebrationTimerRef = React.useRef(null);
  const celebrationStopTimerRef = React.useRef(null);

  function stopCelebrationMusic() {
    setActiveSongName('');
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = null;
    }
    if (celebrationStopTimerRef.current) {
      clearTimeout(celebrationStopTimerRef.current);
      celebrationStopTimerRef.current = null;
    }
    if (celebrationCtxRef.current) {
      celebrationCtxRef.current.close().catch(() => {});
      celebrationCtxRef.current = null;
    }
  }

  // Generate questions list
  const startQuiz = (customWords = null, targetUnit = null) => {
    stopCelebrationMusic();
    const currentGradeMistakes = mistakes.filter(m => m.grade === grade).length;
    setInitialMistakesCount(currentGradeMistakes);
    // Gather vocabulary pool
    let pool = [];
    const activeUnitForQuiz = targetUnit !== null ? targetUnit : activeUnit;
    if (customWords) {
      pool = customWords;
    } else if (activeUnitForQuiz) {
      pool = [...activeUnitForQuiz.words];
    } else {
      units.forEach(unit => {
        pool = [...pool, ...unit.words];
      });
    }

    if (pool.length === 0) {
      alert("无可用的单词以生成测试卷！");
      return;
    }

    const generalPool = units.flatMap(unit => unit.words);

    if (quizMode !== 'spelling' && generalPool.length < 4) {
      alert("词库词量不足以生成测试卷的的干扰选项！");
      return;
    }

    // Shuffle and pick words (use all words in the pool, no longer restricted to 10)
    const selectedWords = [...pool].sort(() => Math.random() - 0.5);
    
    // Build questions structure
    const generatedQuestions = selectedWords.map(wordObj => {
      // Pick 3 wrong options from the general pool of current grade
      const wrongOptions = generalPool
        .filter(w => w.word !== wordObj.word)
        .filter((v, i, a) => a.findIndex(t => t.word === v.word) === i)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const options = [wordObj, ...wrongOptions].sort(() => Math.random() - 0.5);

      return {
        wordObj,
        options,
        correctIndex: options.findIndex(opt => opt.word === wordObj.word)
      }
    });

    setQuestions(generatedQuestions);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setAnsweredList([]);
    setQuizFinished(false);
    setShowConfetti(false);
    setStarsAwarded(false);
    setHistorySaved(false);
    setQuizStarted(true);
  }



  // Play audio automatically when question loads
  useEffect(() => {
    if (quizStarted && !quizFinished && questions.length > 0) {
      const q = questions[currentQIndex];
      // In spelling mode or eng-to-chi, play the audio automatically
      if (quizMode === 'eng-to-chi' || quizMode === 'spelling') {
        setTimeout(() => {
          playAudio(q.wordObj.word);
        }, 300);
      }
    }
  }, [quizStarted, currentQIndex, quizMode, questions, quizFinished])

  // Play quiz sound effects (synthesized)
  const playQuizSFX = (isCorrect) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const volSaved = localStorage.getItem('oxford_volume');
      const volumeVal = volSaved !== null ? parseFloat(volSaved) : 1.0;
      if (volumeVal === 0) return; // Muted

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (isCorrect) {
        // Correct SFX: A cheerful "ding-ding" (E6 -> G6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12 * volumeVal, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.12);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        gain2.gain.setValueAtTime(0.001, now + 0.12);
        gain2.gain.linearRampToValueAtTime(0.12 * volumeVal, now + 0.17);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.start(now);
        osc.stop(now + 0.16);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.33);

        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 400);
      } else {
        // Incorrect SFX: A low-pitched sliding "womp" (F3 -> C3)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.25);
        
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15 * volumeVal, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        
        osc.start(now);
        osc.stop(now + 0.30);

        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 400);
      }
    } catch (err) {
      console.warn("SFX playback failed:", err);
    }
  };

  // Play ticking sound for the last 3 seconds
  const playTickSFX = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const volSaved = localStorage.getItem('oxford_volume');
      const volumeVal = volSaved !== null ? parseFloat(volSaved) : 1.0;
      if (volumeVal === 0) return; // Muted

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05 * volumeVal, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.06);

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 100);
    } catch (err) {}
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的浏览器或设备目前不支持语音识别功能。请使用电脑端的 Google Chrome 浏览器或苹果 Safari 浏览器访问！");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechResult('');
        setRecognizedText('');
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert("麦克风权限被拒绝，请在浏览器地址栏左侧（通常是锁形图标）允许网页使用您的麦克风。");
        } else if (event.error === 'no-speech') {
          alert("好像没有听到声音哦，请靠近麦克风再试一次！");
        } else {
          alert("录音发生了一些小状况，请重试！");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        const cleanUser = result.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const targetWord = questions[currentQIndex].wordObj.word.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
        
        setRecognizedText(result);
        
        // Match conditions: exact match, or user transcription includes the target word, or vice versa
        const isMatched = cleanUser === targetWord || 
                          cleanUser.split(' ').includes(targetWord) || 
                          targetWord.split(' ').includes(cleanUser);
        
        if (isMatched) {
          setSpeechResult('correct');
          setSelectedAnswer(1); // lock answer input
          setScore(prev => prev + 1);
          playQuizSFX(true);
          if (onRemoveMistake) {
            onRemoveMistake(questions[currentQIndex].wordObj.word);
          }
          
          setAnsweredList(prev => [...prev, {
            word: questions[currentQIndex].wordObj.word,
            translation: questions[currentQIndex].wordObj.translation,
            userAnswer: `🗣️ 跟读正确 (您读的是: "${result}")`,
            correctAnswer: questions[currentQIndex].wordObj.word,
            isCorrect: true
          }]);

          setTimeout(() => {
            setSelectedAnswer(null);
            setSpeechResult('');
            setRecognizedText('');
            proceedToNext();
          }, 2200);
        } else {
          setSpeechResult('wrong');
          setSelectedAnswer(0); // lock answer input
          onAddMistake(questions[currentQIndex].wordObj);
          playQuizSFX(false);

          setAnsweredList(prev => [...prev, {
            word: questions[currentQIndex].wordObj.word,
            translation: questions[currentQIndex].wordObj.translation,
            userAnswer: `🗣️ 跟读错误 (您读的是: "${result || '未听清'}")`,
            correctAnswer: questions[currentQIndex].wordObj.word,
            isCorrect: false
          }]);

          setTimeout(() => {
            setSelectedAnswer(null);
            setSpeechResult('');
            setRecognizedText('');
            proceedToNext();
          }, 2700);
        }
      };

      recognition.start();
    } catch (e) {
      console.error("Speech recognition initiation failed:", e);
      setIsRecording(false);
    }
  };

  // Handle choice submission
  const handleAnswerClick = (index) => {
    if (selectedAnswer !== null) return; // prevent double clicks
    
    setSelectedAnswer(index);
    const q = questions[currentQIndex];
    const isCorrect = index === q.correctIndex;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      playQuizSFX(true);
      if (onRemoveMistake) {
        onRemoveMistake(q.wordObj.word);
      }
    } else {
      onAddMistake(q.wordObj);
      playQuizSFX(false);
    }

    setAnsweredList(prev => [...prev, {
      word: q.wordObj.word,
      translation: q.wordObj.translation,
      userAnswer: q.options[index].translation,
      correctAnswer: q.wordObj.translation,
      isCorrect
    }]);

    // Play pronunciation slightly delayed to reinforce
    setTimeout(() => {
      playAudio(q.wordObj.word);
    }, 350);

    // Auto proceed after 1.5 seconds
    setTimeout(() => {
      proceedToNext();
    }, 1500);
  }

  // Handle spelling submission
  const handleSpellingSubmit = (e) => {
    e.preventDefault();
    if (selectedAnswer !== null) return; // already submitted

    const q = questions[currentQIndex];
    const cleanUser = typedAnswer.trim().toLowerCase();
    const cleanCorrect = q.wordObj.word.trim().toLowerCase();
    const isCorrect = cleanUser === cleanCorrect;

    setSelectedAnswer(isCorrect ? 1 : 0); // use index 1 for correct, 0 for wrong in state tracking
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      playQuizSFX(true);
      if (onRemoveMistake) {
        onRemoveMistake(q.wordObj.word);
      }
    } else {
      onAddMistake(q.wordObj);
      playQuizSFX(false);
    }

    setAnsweredList(prev => [...prev, {
      word: q.wordObj.word,
      translation: q.wordObj.translation,
      userAnswer: typedAnswer,
      correctAnswer: q.wordObj.word,
      isCorrect
    }]);

    // Play pronunciation slightly delayed to reinforce
    setTimeout(() => {
      playAudio(q.wordObj.word);
    }, 350);

    setTimeout(() => {
      proceedToNext();
    }, 1800);
  }

  const proceedToNext = () => {
    setSelectedAnswer(null);
    setTypedAnswer('');
    
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // Quiz finished
      setQuizFinished(true);
    }
  }

  // Handle quiz timeout
  const handleTimeout = () => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(-1);
    const q = questions[currentQIndex];
    onAddMistake(q.wordObj);
    playQuizSFX(false);

    setAnsweredList(prev => [...prev, {
      word: q.wordObj.word,
      translation: q.wordObj.translation,
      userAnswer: '超时未答',
      correctAnswer: quizMode === 'spelling' ? q.wordObj.word : q.wordObj.translation,
      isCorrect: false
    }]);

    // Play pronunciation slightly delayed to reinforce
    setTimeout(() => {
      playAudio(q.wordObj.word);
    }, 350);

    setTimeout(() => {
      proceedToNext();
    }, 1800);
  }

  // Reset timer on new question
  useEffect(() => {
    if (quizStarted && !quizFinished && selectedAnswer === null) {
      setTimeLeft(10);
    }
  }, [quizStarted, currentQIndex, selectedAnswer, quizFinished]);

  // Quiz countdown timer effect
  useEffect(() => {
    if (!quizStarted || quizFinished || selectedAnswer !== null || isRecording) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        const nextTime = prev - 1;
        if (nextTime <= 3 && nextTime > 0) {
          playTickSFX();
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizFinished, selectedAnswer, isRecording]);

  // Award stars and save study record when quiz completes
  useEffect(() => {
    if (quizFinished && !starsAwarded && questions.length > 0) {
      setStarsAwarded(true);
      let count = 1; // 1 star for completion
      if (score === questions.length) {
        count = 3; // 3 stars for perfect score
      }
      if (onAwardStars) {
        onAwardStars(count);
      }

      if (onAddStudyRecord && !historySaved) {
        setHistorySaved(true);
        const record = {
          date: new Date().toISOString().split('T')[0],
          unitTitle: activeUnit ? activeUnit.unit : '全量测试',
          score: Math.round((score / questions.length) * 100),
          correctCount: score,
          totalCount: questions.length,
          mode: quizMode,
          grade: grade
        };
        onAddStudyRecord(record);
      }
    }
  }, [quizFinished, score, questions.length, starsAwarded, onAwardStars, historySaved, onAddStudyRecord, activeUnit, quizMode, grade]);

  // Play celebration music using Web Audio API oscillators (Rotating 10 children's nursery rhymes)
  const playCelebrationMusic = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      
      // Stop any existing music first
      stopCelebrationMusic();

      const ctx = new AudioContextClass();
      celebrationCtxRef.current = ctx;

      const volSaved = localStorage.getItem('oxford_volume');
      const volumeVal = volSaved !== null ? parseFloat(volSaved) : 1.0;
      if (volumeVal === 0) return; // Muted

      // Database of 10 classic kids songs
      const songs = [
        {
          name: "《玛丽有只小羔羊》 (Mary Had a Little Lamb)",
          loopInterval: 8000,
          melody: [
            { note: 659.25, time: 0.0, dur: 0.45 }, { note: 587.33, time: 0.5, dur: 0.45 },
            { note: 523.25, time: 1.0, dur: 0.45 }, { note: 587.33, time: 1.5, dur: 0.45 },
            { note: 659.25, time: 2.0, dur: 0.45 }, { note: 659.25, time: 2.5, dur: 0.45 },
            { note: 659.25, time: 3.0, dur: 0.90 }, { note: 587.33, time: 4.0, dur: 0.45 },
            { note: 587.33, time: 4.5, dur: 0.45 }, { note: 587.33, time: 5.0, dur: 0.90 },
            { note: 659.25, time: 6.0, dur: 0.45 }, { note: 783.99, time: 6.5, dur: 0.45 },
            { note: 783.99, time: 7.0, dur: 0.90 }
          ],
          bass: [
            { note: 261.63, time: 0.0, dur: 0.90 }, { note: 261.63, time: 2.0, dur: 0.90 },
            { note: 196.00, time: 4.0, dur: 0.90 }, { note: 261.63, time: 6.0, dur: 0.90 }
          ]
        },
        {
          name: "《小星星》 (Twinkle Twinkle Little Star)",
          loopInterval: 8000,
          melody: [
            { note: 523.25, time: 0.0, dur: 0.45 }, { note: 523.25, time: 0.5, dur: 0.45 },
            { note: 783.99, time: 1.0, dur: 0.45 }, { note: 783.99, time: 1.5, dur: 0.45 },
            { note: 880.00, time: 2.0, dur: 0.45 }, { note: 880.00, time: 2.5, dur: 0.45 },
            { note: 783.99, time: 3.0, dur: 0.90 }, { note: 698.46, time: 4.0, dur: 0.45 },
            { note: 698.46, time: 4.5, dur: 0.45 }, { note: 659.25, time: 5.0, dur: 0.45 },
            { note: 659.25, time: 5.5, dur: 0.45 }, { note: 587.33, time: 6.0, dur: 0.45 },
            { note: 587.33, time: 6.5, dur: 0.45 }, { note: 523.25, time: 7.0, dur: 0.90 }
          ],
          bass: [
            { note: 261.63, time: 0.0, dur: 0.90 }, { note: 349.23, time: 2.0, dur: 0.90 },
            { note: 261.63, time: 4.0, dur: 0.90 }, { note: 196.00, time: 6.0, dur: 0.90 }
          ]
        },
        {
          name: "《王老先生有块地》 (Old MacDonald Had a Farm)",
          loopInterval: 6000,
          melody: [
            { note: 783.99, time: 0.0, dur: 0.35 }, { note: 783.99, time: 0.4, dur: 0.35 },
            { note: 783.99, time: 0.8, dur: 0.35 }, { note: 587.33, time: 1.2, dur: 0.35 },
            { note: 659.25, time: 1.6, dur: 0.35 }, { note: 659.25, time: 2.0, dur: 0.35 },
            { note: 587.33, time: 2.4, dur: 0.75 }, { note: 987.77, time: 3.2, dur: 0.35 },
            { note: 987.77, time: 3.6, dur: 0.35 }, { note: 880.00, time: 4.0, dur: 0.35 },
            { note: 880.00, time: 4.4, dur: 0.35 }, { note: 783.99, time: 4.8, dur: 0.75 }
          ],
          bass: [
            { note: 261.63, time: 0.0, dur: 0.80 }, { note: 261.63, time: 1.6, dur: 0.80 },
            { note: 196.00, time: 3.2, dur: 0.80 }, { note: 261.63, time: 4.8, dur: 0.80 }
          ]
        },
        {
          name: "《划船歌》 (Row, Row, Row Your Boat)",
          loopInterval: 8000,
          melody: [
            { note: 523.25, time: 0.0, dur: 0.45 }, { note: 523.25, time: 0.5, dur: 0.45 },
            { note: 523.25, time: 1.0, dur: 0.30 }, { note: 587.33, time: 1.3, dur: 0.15 },
            { note: 659.25, time: 1.5, dur: 0.45 }, { note: 659.25, time: 2.0, dur: 0.30 },
            { note: 587.33, time: 2.3, dur: 0.15 }, { note: 659.25, time: 2.5, dur: 0.30 },
            { note: 698.46, time: 2.8, dur: 0.15 }, { note: 783.99, time: 3.0, dur: 0.90 },
            { note: 1046.50, time: 4.0, dur: 0.15 }, { note: 1046.50, time: 4.15, dur: 0.15 },
            { note: 1046.50, time: 4.30, dur: 0.15 }, { note: 783.99, time: 4.45, dur: 0.15 },
            { note: 783.99, time: 4.60, dur: 0.15 }, { note: 783.99, time: 4.75, dur: 0.15 },
            { note: 659.25, time: 4.90, dur: 0.15 }, { note: 659.25, time: 5.05, dur: 0.15 },
            { note: 659.25, time: 5.20, dur: 0.15 }, { note: 523.25, time: 5.35, dur: 0.15 },
            { note: 523.25, time: 5.50, dur: 0.15 }, { note: 523.25, time: 5.65, dur: 0.15 },
            { note: 783.99, time: 6.0, dur: 0.30 }, { note: 698.46, time: 6.3, dur: 0.15 },
            { note: 659.25, time: 6.5, dur: 0.30 }, { note: 587.33, time: 6.8, dur: 0.15 },
            { note: 523.25, time: 7.0, dur: 0.90 }
          ],
          bass: [
            { note: 261.63, time: 0.0, dur: 0.90 }, { note: 261.63, time: 2.0, dur: 0.90 },
            { note: 261.63, time: 4.0, dur: 0.90 }, { note: 196.00, time: 6.0, dur: 0.90 }
          ]
        },
        {
          name: "《两只老虎》 (Brother John)",
          loopInterval: 8000,
          melody: [
            { note: 523.25, time: 0.0, dur: 0.40 }, { note: 587.33, time: 0.5, dur: 0.40 },
            { note: 659.25, time: 1.0, dur: 0.40 }, { note: 523.25, time: 1.5, dur: 0.40 },
            { note: 523.25, time: 2.0, dur: 0.40 }, { note: 587.33, time: 2.5, dur: 0.40 },
            { note: 659.25, time: 3.0, dur: 0.40 }, { note: 523.25, time: 3.5, dur: 0.40 },
            { note: 659.25, time: 4.0, dur: 0.40 }, { note: 698.46, time: 4.5, dur: 0.40 },
            { note: 783.99, time: 5.0, dur: 0.80 }, { note: 659.25, time: 6.0, dur: 0.40 },
            { note: 698.46, time: 6.5, dur: 0.40 }, { note: 783.99, time: 7.0, dur: 0.80 }
          ],
          bass: [
            { note: 261.63, time: 0.0, dur: 0.90 }, { note: 261.63, time: 2.0, dur: 0.90 },
            { note: 261.63, time: 4.0, dur: 0.90 }, { note: 261.63, time: 6.0, dur: 0.90 }
          ]
        },
        {
          name: "《祝你生日快乐》 (Happy Birthday to You)",
          loopInterval: 8000,
          melody: [
            { note: 392.00, time: 0.0, dur: 0.30 }, { note: 392.00, time: 0.3, dur: 0.15 },
            { note: 440.00, time: 0.5, dur: 0.45 }, { note: 392.00, time: 1.0, dur: 0.45 },
            { note: 523.25, time: 1.5, dur: 0.45 }, { note: 493.88, time: 2.0, dur: 0.90 },
            { note: 392.00, time: 3.0, dur: 0.30 }, { note: 392.00, time: 3.3, dur: 0.15 },
            { note: 440.00, time: 3.5, dur: 0.45 }, { note: 392.00, time: 4.0, dur: 0.45 },
            { note: 587.33, time: 4.5, dur: 0.45 }, { note: 523.25, time: 5.0, dur: 0.90 },
            { note: 392.00, time: 6.0, dur: 0.30 }, { note: 392.00, time: 6.3, dur: 0.15 },
            { note: 783.99, time: 6.5, dur: 0.45 }, { note: 659.25, time: 7.0, dur: 0.45 },
            { note: 523.25, time: 7.5, dur: 0.45 }
          ],
          bass: [
            { note: 196.00, time: 0.0, dur: 0.90 }, { note: 261.63, time: 1.5, dur: 0.90 },
            { note: 196.00, time: 3.0, dur: 0.90 }, { note: 261.63, time: 5.0, dur: 0.90 }
          ]
        },
        {
          name: "《铃儿响叮当》 (Jingle Bells)",
          loopInterval: 8000,
          melody: [
            { note: 659.25, time: 0.0, dur: 0.40 }, { note: 659.25, time: 0.5, dur: 0.40 },
            { note: 659.25, time: 1.0, dur: 0.80 }, { note: 659.25, time: 2.0, dur: 0.40 },
            { note: 659.25, time: 2.5, dur: 0.40 }, { note: 659.25, time: 3.0, dur: 0.80 },
            { note: 659.25, time: 4.0, dur: 0.40 }, { note: 783.99, time: 4.5, dur: 0.40 },
            { note: 523.25, time: 5.0, dur: 0.60 }, { note: 587.33, time: 5.6, dur: 0.20 },
            { note: 659.25, time: 6.0, dur: 1.50 }
          ],
          bass: [
            { note: 261.63, time: 0.0, dur: 0.90 }, { note: 261.63, time: 2.0, dur: 0.90 },
            { note: 261.63, time: 4.0, dur: 0.90 }, { note: 261.63, time: 6.0, dur: 0.90 }
          ]
        },
        {
          name: "《伦敦大桥垮下来》 (London Bridge is Falling Down)",
          loopInterval: 9500,
          melody: [
            { note: 783.99, time: 0.0, dur: 0.40 }, { note: 880.00, time: 0.4, dur: 0.20 },
            { note: 783.99, time: 0.6, dur: 0.40 }, { note: 698.46, time: 1.0, dur: 0.20 },
            { note: 659.25, time: 1.2, dur: 0.40 }, { note: 698.46, time: 1.6, dur: 0.20 },
            { note: 783.99, time: 1.8, dur: 0.60 }, { note: 587.33, time: 2.5, dur: 0.40 },
            { note: 659.25, time: 2.9, dur: 0.20 }, { note: 698.46, time: 3.1, dur: 0.60 },
            { note: 659.25, time: 3.8, dur: 0.40 }, { note: 698.46, time: 4.2, dur: 0.20 },
            { note: 783.99, time: 4.4, dur: 0.60 }, { note: 783.99, time: 5.0, dur: 0.40 },
            { note: 880.00, time: 5.4, dur: 0.20 }, { note: 783.99, time: 5.6, dur: 0.40 },
            { note: 698.46, time: 6.0, dur: 0.20 }, { note: 659.25, time: 6.2, dur: 0.40 },
            { note: 698.46, time: 6.6, dur: 0.20 }, { note: 783.99, time: 6.8, dur: 0.60 },
            { note: 587.33, time: 7.4, dur: 0.40 }, { note: 783.99, time: 7.8, dur: 0.40 },
            { note: 659.25, time: 8.2, dur: 0.40 }, { note: 523.25, time: 8.6, dur: 0.80 }
          ],
          bass: [
            { note: 261.63, time: 0.0, dur: 0.80 }, { note: 196.00, time: 2.5, dur: 0.80 },
            { note: 261.63, time: 5.0, dur: 0.80 }, { note: 261.63, time: 7.4, dur: 0.80 }
          ]
        },
        {
          name: "《如果感到幸福你就拍拍手》 (If You're Happy and You Know It)",
          loopInterval: 8000,
          melody: [
            { note: 523.25, time: 0.0, dur: 0.20 }, { note: 523.25, time: 0.2, dur: 0.20 },
            { note: 698.46, time: 0.4, dur: 0.30 }, { note: 698.46, time: 0.7, dur: 0.15 },
            { note: 698.46, time: 0.85, dur: 0.15 }, { note: 698.46, time: 1.0, dur: 0.15 },
            { note: 698.46, time: 1.15, dur: 0.15 }, { note: 698.46, time: 1.3, dur: 0.30 },
            { note: 523.25, time: 1.6, dur: 0.20 }, { note: 587.33, time: 1.8, dur: 0.20 },
            { note: 783.99, time: 2.0, dur: 0.30 }, { note: 783.99, time: 2.3, dur: 0.15 },
            { note: 783.99, time: 2.45, dur: 0.15 }, { note: 783.99, time: 2.60, dur: 0.15 },
            { note: 783.99, time: 2.75, dur: 0.15 }, { note: 783.99, time: 2.9, dur: 0.30 },
            { note: 659.25, time: 3.2, dur: 0.20 }, { note: 698.46, time: 3.4, dur: 0.20 },
            { note: 783.99, time: 3.6, dur: 0.30 }, { note: 783.99, time: 3.9, dur: 0.15 },
            { note: 783.99, time: 4.05, dur: 0.15 }, { note: 783.99, time: 4.20, dur: 0.15 },
            { note: 783.99, time: 4.35, dur: 0.15 }, { note: 880.00, time: 4.5, dur: 0.30 },
            { note: 698.46, time: 4.8, dur: 0.30 }, { note: 880.00, time: 5.1, dur: 0.30 },
            { note: 783.99, time: 5.4, dur: 0.30 }, { note: 783.99, time: 5.7, dur: 0.15 },
            { note: 783.99, time: 5.85, dur: 0.15 }, { note: 698.46, time: 6.0, dur: 0.15 },
            { note: 659.25, time: 6.15, dur: 0.15 }, { note: 587.33, time: 6.3, dur: 0.30 },
            { note: 659.25, time: 6.6, dur: 0.30 }, { note: 587.33, time: 6.9, dur: 0.30 },
            { note: 523.25, time: 7.2, dur: 0.80 }
          ],
          bass: [
            { note: 261.63, time: 0.4, dur: 0.80 }, { note: 196.00, time: 2.0, dur: 0.80 },
            { note: 261.63, time: 3.6, dur: 0.80 }, { note: 261.63, time: 5.4, dur: 0.80 }
          ]
        },
        {
          name: "《宾果游戏》 (Bingo)",
          loopInterval: 8000,
          melody: [
            { note: 392.00, time: 0.0, dur: 0.30 }, { note: 523.25, time: 0.3, dur: 0.30 },
            { note: 523.25, time: 0.6, dur: 0.30 }, { note: 392.00, time: 0.9, dur: 0.30 },
            { note: 392.00, time: 1.2, dur: 0.30 }, { note: 440.00, time: 1.5, dur: 0.30 },
            { note: 440.00, time: 1.8, dur: 0.30 }, { note: 392.00, time: 2.1, dur: 0.60 },
            { note: 392.00, time: 2.7, dur: 0.30 }, { note: 523.25, time: 3.0, dur: 0.30 },
            { note: 523.25, time: 3.3, dur: 0.30 }, { note: 523.25, time: 3.6, dur: 0.30 },
            { note: 493.88, time: 3.9, dur: 0.30 }, { note: 523.25, time: 4.2, dur: 0.30 },
            { note: 587.33, time: 4.5, dur: 0.30 }, { note: 659.25, time: 4.8, dur: 0.30 },
            { note: 523.25, time: 5.1, dur: 0.60 }, { note: 659.25, time: 5.7, dur: 0.30 },
            { note: 659.25, time: 6.0, dur: 0.30 }, { note: 587.33, time: 6.3, dur: 0.30 },
            { note: 587.33, time: 6.6, dur: 0.30 }, { note: 523.25, time: 6.9, dur: 0.90 }
          ],
          bass: [
            { note: 261.63, time: 0.3, dur: 0.80 }, { note: 349.23, time: 1.5, dur: 0.80 },
            { note: 261.63, time: 3.0, dur: 0.80 }, { note: 196.00, time: 4.5, dur: 0.80 },
            { note: 261.63, time: 6.9, dur: 0.80 }
          ]
        }
      ];

      // Choose a random starting song index
      let currentSongIndex = Math.floor(Math.random() * songs.length);

      const playNextSong = (startTime) => {
        const volSaved = localStorage.getItem('oxford_volume');
        const volumeVal = volSaved !== null ? parseFloat(volSaved) : 1.0;
        
        const song = songs[currentSongIndex];
        setActiveSongName(song.name);

        if (volumeVal > 0) {
          // Schedule melody with warm triangle waves (music box plucks)
          song.melody.forEach(item => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.note, startTime + item.time);
            
            gain.gain.setValueAtTime(0.001, startTime + item.time);
            gain.gain.linearRampToValueAtTime(0.20 * volumeVal, startTime + item.time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + item.time + item.dur);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime + item.time);
            osc.stop(startTime + item.time + item.dur);
          });

          // Schedule bass with sweet sine waves
          song.bass.forEach(item => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(item.note, startTime + item.time);
            
            gain.gain.setValueAtTime(0.001, startTime + item.time);
            gain.gain.linearRampToValueAtTime(0.12 * volumeVal, startTime + item.time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + item.time + item.dur);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime + item.time);
            osc.stop(startTime + item.time + item.dur);
          });
        }

        const songDurationSec = song.loopInterval / 1000;
        currentSongIndex = (currentSongIndex + 1) % songs.length;

        // Schedule next song in queue
        celebrationTimerRef.current = setTimeout(() => {
          playNextSong(startTime + songDurationSec);
        }, song.loopInterval);
      };

      // Play immediately
      playNextSong(ctx.currentTime);

      // Automatically stop after 3 minutes (180000ms)
      celebrationStopTimerRef.current = setTimeout(() => {
        stopCelebrationMusic();
      }, 180000);

    } catch (e) {
      console.warn("Celebration music playback failed:", e);
    }
  };

  // Celebration trigger effect
  useEffect(() => {
    if (quizFinished && score === questions.length && questions.length > 0) {
      setShowConfetti(true);
      playCelebrationMusic();
    }
  }, [quizFinished, score, questions.length]);

  // Clean up celebration music on unmount
  useEffect(() => {
    return () => {
      stopCelebrationMusic();
    };
  }, []);

  // Confetti generator cells (Sprinkling flower emojis)
  const renderConfetti = () => {
    if (!showConfetti) return null;
    const flowers = ['🌸', '🌹', '🌺', '🌻', '🌼', '💐', '🌷'];
    return Array.from({ length: 60 }).map((_, idx) => {
      const left = Math.random() * 100;
      const animationDelay = Math.random() * 3;
      const size = 1.2 + Math.random() * 1.5;
      const flower = flowers[idx % flowers.length];
      return (
        <div 
          key={idx} 
          className="flower-confetti" 
          style={{ 
            left: `${left}%`, 
            animationDelay: `${animationDelay}s`,
            fontSize: `${size}rem`,
            animationDuration: `${3 + Math.random() * 3}s`
          }}
        >
          {flower}
        </div>
      );
    });
  }

  const timerCircle = (
    <div 
      style={{ 
        fontSize: '2rem', 
        fontWeight: '800', 
        color: timeLeft <= 3 ? '#ef4444' : 'var(--accent-yellow)',
        fontFamily: 'monospace, var(--font-title)',
        width: '54px',
        height: '54px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: timeLeft <= 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '50%',
        border: `2px solid ${timeLeft <= 3 ? '#ef4444' : 'var(--border-glass)'}`,
        animation: timeLeft <= 3 ? 'pulse 1s infinite' : 'none',
        flexShrink: 0,
        boxShadow: timeLeft <= 3 ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
        lineHeight: 1
      }} 
      title="剩余时间"
    >
      {timeLeft}
    </div>
  );

  return (
    <div className="quiz-container">
      {renderConfetti()}

      {/* Mode settings layout */}
      {!quizStarted ? (
        <div className="glass-card stagger-item" style={{ padding: '2.5rem', textAlign: 'center', '--index': 0 }}>
          <HelpCircle size={48} style={{ color: 'var(--accent-violet)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>
            随堂测验 & 词汇打卡
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px', margin: '0 auto 2.5rem auto' }}>
            <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>选择测验形式:</div>
            
            <label className="option-btn" style={{ cursor: 'pointer', transform: 'none' }}>
              <span>🇬🇧 英文 ➜ 🇨🇳 中文 (多选一)</span>
              <input 
                type="radio" 
                name="quizMode" 
                checked={quizMode === 'eng-to-chi'} 
                onChange={() => setQuizMode('eng-to-chi')}
                style={{ cursor: 'pointer' }}
              />
            </label>

            <label className="option-btn" style={{ cursor: 'pointer', transform: 'none' }}>
              <span>🇨🇳 中文 ➜ 🇬🇧 英文 (多选一)</span>
              <input 
                type="radio" 
                name="quizMode" 
                checked={quizMode === 'chi-to-eng'} 
                onChange={() => setQuizMode('chi-to-eng')}
                style={{ cursor: 'pointer' }}
              />
            </label>

            <label className="option-btn" style={{ cursor: 'pointer', transform: 'none' }}>
              <span>✏️ 英文拼写挑战 (看中文手写拼入)</span>
              <input 
                type="radio" 
                name="quizMode" 
                checked={quizMode === 'spelling'} 
                onChange={() => setQuizMode('spelling')}
                style={{ cursor: 'pointer' }}
              />
            </label>

            <label className="option-btn" style={{ cursor: 'pointer', transform: 'none' }}>
              <span>🗣️ 语音跟读挑战 (大声读词跟评)</span>
              <input 
                type="radio" 
                name="quizMode" 
                checked={quizMode === 'speech'} 
                onChange={() => setQuizMode('speech')}
                style={{ cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {activeUnit ? `测验范围: ${activeUnit.unit} - ${activeUnit.title}` : `测验范围: 全量词库 (共 ${units.reduce((acc,u)=>acc+u.words.length,0)} 个单词)`}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="action-btn" onClick={() => startQuiz()} style={{ padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}>
              开始测试 (共{activeUnit ? activeUnit.words.length : units.reduce((acc, u) => acc + u.words.length, 0)}题)
            </button>
            <button 
              className="ctrl-action-btn"
              onClick={() => {
                setActiveView('dashboard');
                setSelectedUnit(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.9rem 2.5rem', borderRadius: '30px' }}
            >
              <ChevronLeft size={18} />
              <span>返回目录</span>
            </button>
          </div>
        </div>
      ) : quizFinished ? (
        /* Results summary */
        <div className="glass-card results-screen stagger-item" style={{ '--index': 0 }}>
          <Award size={64} style={{ color: score === questions.length ? 'var(--accent-yellow)' : 'var(--accent-violet)' }} />
          <h2>测试报告</h2>
          
          <div className="score-badge">
            {Math.round((score / questions.length) * 100)}分
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            您一共答对了 <strong>{score}</strong> 题 / 满分 {questions.length} 题
          </p>

          {(() => {
            const currentGradeMistakesCount = mistakes.filter(m => m.grade === grade).length;
            const clearedAllMistakes = initialMistakesCount > 0 && currentGradeMistakesCount === 0;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', width: '100%' }}>
                {clearedAllMistakes && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(236, 72, 153, 0.15))',
                    border: '2px dashed var(--accent-pink)',
                    padding: '1.2rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    margin: '1rem 0',
                    width: '100%',
                    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.2)',
                    animation: 'pulse 2s infinite'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>⚔️ 🏆 ⚔️</div>
                    <div style={{ color: 'var(--accent-pink)', fontWeight: '800', fontSize: '1.3rem' }}>
                      恭喜获得【消灭错题勇士】勋章！
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      你太厉害了，已经清空了本册的所有错题！
                    </div>
                  </div>
                )}

                {score === questions.length && questions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                    {!clearedAllMistakes && (
                      <div style={{ color: 'var(--accent-pink)', fontWeight: 'bold', fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>
                        🎉 太棒了！拿到满分！
                      </div>
                    )}
                    {activeSongName && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>🎵 正在播放童谣: {activeSongName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* User Answers details listing */}
          <div style={{ width: '100%', marginTop: '2rem', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              答题详情回顾:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {answeredList.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${item.isCorrect ? 'var(--accent-green)' : '#ef4444'}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.word}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.translation}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: item.isCorrect ? 'var(--accent-green)' : '#ef4444' }}>
                      您的回答: {item.userAnswer}
                    </span>
                    {item.isCorrect ? <Check size={18} style={{ color: 'var(--accent-green)' }} /> : <X size={18} style={{ color: '#ef4444' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {answeredList.some(item => !item.isCorrect) && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              color: '#f87171',
              fontSize: '0.9rem',
              marginTop: '1.5rem',
              textAlign: 'left',
              width: '100%'
            }} className="no-print">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>答错的单词已自动加入【错题本】。你可以在首页【错题本】或【词汇看板】中专门复习它们。</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {activeUnit !== null && (() => {
              const currentIdx = units.findIndex(u => u.unit === activeUnit.unit);
              const hasNext = currentIdx !== -1 && currentIdx < units.length - 1;
              if (!hasNext) return null;
              
              const nextUnit = units[currentIdx + 1];
              return (
                <>
                  <button 
                    className="action-btn"
                    onClick={() => {
                      setSelectedUnit(nextUnit);
                      setActiveView('flashcards');
                    }}
                    style={{ background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-pink))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>📖 学习下一课 ({nextUnit.unit})</span>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => {
                      setSelectedUnit(nextUnit);
                      startQuiz(null, nextUnit);
                    }}
                    style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>➡️ 测试下一课 ({nextUnit.unit})</span>
                  </button>
                </>
              );
            })()}

            <button className="action-btn" onClick={() => startQuiz()}>
              <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
              重新测试
            </button>

            {answeredList.some(item => !item.isCorrect) && (
              <button 
                className="action-btn" 
                onClick={() => {
                  const wrongWords = answeredList
                    .filter(item => !item.isCorrect)
                    .map(item => {
                      const found = units.flatMap(u => u.words).find(w => w.word === item.word);
                      return found || { word: item.word, translation: item.correctAnswer };
                    });
                  startQuiz(wrongWords);
                }}
                style={{ background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-violet))' }}
              >
                📋 重新挑战错题
              </button>
            )}

            <button 
              className="action-btn" 
              onClick={() => {
                stopCelebrationMusic();
                setQuizStarted(false);
              }}
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-glass)', border: '1px solid' }}
            >
              返回大纲
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Gameplay Stage */
        <div className="glass-card stagger-item" style={{ '--index': 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }} className="no-print">
            <button 
              onClick={() => {
                if (window.confirm("确定要退出本次测试吗？当前进度将不会被保存。")) {
                  setQuizStarted(false);
                }
              }}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer',
                fontSize: '0.85rem',
                textDecoration: 'underline'
              }}
            >
              退出测试
            </button>
          </div>

          <div className="quiz-header">
            <span>题库进度: {currentQIndex + 1} / {questions.length}</span>
            <div className="quiz-progress-track">
              <div 
                className="quiz-progress-fill" 
                style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
              ></div>
            </div>
            <span>得分: {Math.round((score / questions.length) * 100)}分</span>
          </div>

          {/* Question Text display */}
          <div className="question-text">
            {quizMode === 'eng-to-chi' && (
              <>
                请选择正确的中文释义：
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                  {selectedAnswer === null ? timerCircle : <div style={{ width: '54px', height: '54px', flexShrink: 0 }}></div>}
                  <span className="question-word" style={{ margin: 0 }}>
                    {questions[currentQIndex].wordObj.word}
                  </span>
                  <div style={{ width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <button 
                      onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                      className="ctrl-btn" 
                      style={{ width: '42px', height: '42px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)', borderRadius: '50%' }}
                      title="重播发音"
                      type="button"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {quizMode === 'chi-to-eng' && (
              <>
                请选择正确的英文单词：
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                  {selectedAnswer === null ? timerCircle : <div style={{ width: '54px', height: '54px', flexShrink: 0 }}></div>}
                  <span className="question-word" style={{ color: 'var(--accent-pink)', margin: 0 }}>
                    {questions[currentQIndex].wordObj.translation}
                  </span>
                  <div style={{ width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <button 
                      onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                      className="ctrl-btn" 
                      style={{ width: '42px', height: '42px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)', borderRadius: '50%' }}
                      title="播放发音"
                      type="button"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {quizMode === 'spelling' && (
              <>
                请拼写此英文单词：
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                  {selectedAnswer === null ? timerCircle : <div style={{ width: '54px', height: '54px', flexShrink: 0 }}></div>}
                  <span className="question-word" style={{ color: 'var(--accent-yellow)', margin: 0 }}>
                    {questions[currentQIndex].wordObj.translation}
                  </span>
                  <div style={{ width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <button 
                      onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                      className="ctrl-btn" 
                      style={{ width: '42px', height: '42px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)', borderRadius: '50%' }}
                      title="播放发音"
                      type="button"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {quizMode === 'speech' && (
              <>
                请听发音并大声读出英文单词：
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                  {selectedAnswer === null ? timerCircle : <div style={{ width: '54px', height: '54px', flexShrink: 0 }}></div>}
                  <span className="question-word" style={{ color: 'var(--accent-violet)', margin: 0 }}>
                    {questions[currentQIndex].wordObj.word}
                  </span>
                  <div style={{ width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <button 
                      onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                      className="ctrl-btn" 
                      style={{ width: '42px', height: '42px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)', borderRadius: '50%' }}
                      title="重播发音"
                      type="button"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 600 }}>
                  💡 中文意思: {questions[currentQIndex].wordObj.translation}
                </div>
              </>
            )}
          </div>

          {/* Form Option choice lists */}
          {quizMode === 'eng-to-chi' || quizMode === 'chi-to-eng' ? (
            <div className="options-list">
              {questions[currentQIndex].options.map((opt, idx) => {
                let statusClass = '';
                const isSelected = selectedAnswer === idx;
                
                if (selectedAnswer !== null) {
                  if (idx === questions[currentQIndex].correctIndex) {
                    statusClass = 'correct';
                  } else if (isSelected) {
                    statusClass = 'wrong';
                  }
                }

                return (
                  <button 
                    key={idx}
                    className={`option-btn ${statusClass}`}
                    onClick={() => handleAnswerClick(idx)}
                    disabled={selectedAnswer !== null}
                  >
                    <span>{quizMode === 'eng-to-chi' ? opt.translation : opt.word}</span>
                    {selectedAnswer !== null && idx === questions[currentQIndex].correctIndex && (
                      <Check size={18} />
                    )}
                    {selectedAnswer !== null && isSelected && idx !== questions[currentQIndex].correctIndex && (
                      <X size={18} />
                    )}
                  </button>
                );
              })}
            </div>
          ) : quizMode === 'spelling' ? (
            /* Spelling form */
            <form onSubmit={handleSpellingSubmit} className="spelling-box">
              <input 
                type="text"
                className="spelling-input"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="在此输入拼写..."
                disabled={selectedAnswer !== null}
                autoFocus
                autoComplete="off"
              />

              {/* Character Hints */}
              <div className="spelling-hints">
                {questions[currentQIndex].wordObj.word.split('').map((char, index) => {
                  const isSpace = char === ' ';
                  const isFirst = index === 0;
                  const isLast = index === questions[currentQIndex].wordObj.word.length - 1;
                  
                  if (isSpace) return <span key={index} style={{ width: '12px' }}></span>;
                  
                  // Provide first and last letters as helper hints for spelling
                  const showHint = isFirst || isLast;
                  
                  return (
                    <span 
                      key={index} 
                      className={`hint-letter ${showHint ? 'filled' : ''}`}
                    >
                      {showHint ? char : ''}
                    </span>
                  );
                })}
              </div>

              {selectedAnswer === null ? (
                <button type="submit" className="action-btn" style={{ padding: '0.6rem 2rem' }}>
                  提交答案
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginTop: '1rem' }}>
                  {selectedAnswer === 1 ? (
                    <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓ 拼写正确！</span>
                  ) : selectedAnswer === -1 ? (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                      ⏱️ 答题超时！正确拼写为: {questions[currentQIndex].wordObj.word}
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                      ✗ 拼写错误。正确拼写为: {questions[currentQIndex].wordObj.word}
                    </span>
                  )}
                </div>
              )}
            </form>
          ) : (
            /* Speech Mode Form */
            <div className="spelling-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
              {selectedAnswer === null ? (
                <button 
                  type="button" 
                  onClick={startSpeechRecognition} 
                  disabled={isRecording}
                  className="action-btn"
                  style={{ 
                    padding: '1rem 2.5rem', 
                    fontSize: '1.15rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    background: isRecording ? 'linear-gradient(135deg, #ef4444, #ec4899)' : 'linear-gradient(135deg, var(--accent-violet), var(--accent-pink))',
                    animation: isRecording ? 'pulse 1s infinite' : 'none',
                    borderColor: 'transparent',
                    boxShadow: isRecording ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
                  }}
                >
                  <span>{isRecording ? '🎙️ 正在录音，请大声朗读...' : '🎙️ 点击录音并跟读'}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {speechResult === 'correct' ? (
                    <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>✓ 读得非常标准！</span>
                    </div>
                  ) : (
                    <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>✗ 没听清，再接再厉！</span>
                    </div>
                  )}
                  {recognizedText && (
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                      您读的是: <span style={{ fontWeight: 'bold', color: speechResult === 'correct' ? 'var(--accent-green)' : '#ef4444', textDecoration: 'underline' }}>"{recognizedText}"</span>
                    </div>
                  )}
                </div>
              )}
              {isRecording && (
                <div style={{ fontSize: '0.9rem', color: 'var(--accent-pink)', animation: 'pulse 1.5s infinite' }}>
                  💡 读完后系统会自动识别并提交答案，请大声且清晰地朗读。
                </div>
              )}
            </div>
          )}

          {/* Quick Voice pronouncer helper */}
          {(quizMode === 'chi-to-eng' || quizMode === 'spelling' || quizMode === 'speech') && selectedAnswer !== null && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => playAudio(questions[currentQIndex].wordObj.word)}
                className="ctrl-btn" 
                style={{ width: '40px', height: '40px' }}
                title="重播发音"
              >
                <Volume2 size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
