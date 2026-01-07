
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Game from './components/Game';
import { SoundSynth } from './services/soundService';
import { HandCursor, PinchTrigger, Difficulty, ControlMode } from './types';
import { fetchLeaderboard, submitScore, LeaderboardEntry } from './services/supabaseService';

const TargetIllustration: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const THREE = window.THREE;
    if (!containerRef.current || !THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(400, 400);
    containerRef.current.appendChild(renderer.domElement);

    const geo = new THREE.IcosahedronGeometry(4, 1);
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const target = new THREE.Mesh(geo, mat);
    scene.add(target);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      target.rotation.y += 0.005;
      target.rotation.x += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className="pointer-events-none" />;
};

const GestureIllustration: React.FC<{ style: 'pinch' | 'gun' }> = ({ style }) => {
  const imgUrl = style === 'pinch' 
    ? "https://res.cloudinary.com/dumwsdo42/image/upload/v1767719161/Frame_13_nptunk.png"
    : "https://res.cloudinary.com/dumwsdo42/image/upload/v1767719163/Frame_14_mbxzv7.png";

  return (
    <div className="flex flex-col items-center justify-center pointer-events-none p-4 transition-all duration-300 w-[min(550px,75vw)] h-auto aspect-square">
      <img 
        src={imgUrl} 
        alt={`${style === 'pinch' ? 'Pinch' : 'Gun Sign'} Tutorial`} 
        className="w-full h-full object-contain opacity-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"
      />
      <div className="text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-lg mt-2 text-center whitespace-nowrap drop-shadow-lg">
        Do this gesture to shoot or click
      </div>
    </div>
  );
};

const TutorialOverlay: React.FC<{ onClose: (finishedAll: boolean) => void, onNav: () => void }> = ({ onClose, onNav }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Navigation", desc: "Move your hand in front of the camera to control the crosshair. The UI will highlight when you hover over it." },
    { title: "Selection & Firing", desc: "Use your chosen Gesture (Pinch or Gun Sign) to click UI buttons and shoot targets in-game." },
    { title: "Combat Mechanics", desc: "Targets move toward you. Destroy them before they reach the integrity threshold. High combos trigger slow-motion." },
    { title: "Emergency Pause", desc: "Hold an Open Palm for 2 seconds to pause the engagement at any time." }
  ];
  const next = () => { onNav(); setStep(step + 1); };
  const prev = () => { onNav(); setStep(step - 1); };

  return (
    <div className="absolute inset-0 bg-black/95 z-[150] flex items-center justify-center p-8 backdrop-blur-xl">
      <div className="glass-ui edge-glow p-6 md:p-12 max-w-xl w-full text-center">
        <div className="text-[10px] uppercase text-white/40 mb-2 font-black tracking-widest">Tutorial Mode</div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-6">{steps[step].title}</h2>
        <div className="mb-8 min-h-[80px]">
          <p className="text-white/70 text-sm md:text-base leading-relaxed">{steps[step].desc}</p>
        </div>
        <div className="flex justify-between items-center mt-6 md:mt-10">
          <button data-hand-action="tut-prev" onClick={() => step > 0 ? prev() : null} className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-white/40 hover:text-white'}`}>Prev</button>
          <div className="flex gap-2">
            {steps.map((_, i) => <div key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-none rotate-45 ${i === step ? 'bg-white' : 'bg-white/10'}`} />)}
          </div>
          {step < steps.length - 1 ? (
            <button data-hand-action="tut-next" onClick={() => next()} className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white hover:text-white/70">Next</button>
          ) : (
            <button data-hand-action="tut-finish" onClick={() => { onNav(); onClose(true); }} className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white border-b border-white hover:border-transparent transition-all">Finish</button>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardModal: React.FC<{ onClose: () => void, onAction: () => void }> = ({ onClose, onAction }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchLeaderboard();
      setEntries(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="absolute inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 backdrop-blur-md">
      <div className="glass-ui edge-glow p-8 md:p-10 max-w-lg w-full">
        <div className="flex justify-between items-center mb-8 md:mb-10 border-b border-white/10 pb-4">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest">Global Leadership</h2>
          <button data-hand-action="close-board" onClick={() => { onAction(); onClose(); }} className="text-white/40 hover:text-white uppercase text-[10px] md:text-xs font-bold">Close</button>
        </div>
        <div className="flex flex-col gap-4 md:gap-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-white/20 animate-pulse font-black uppercase tracking-widest">Syncing Data...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 text-white/20 font-black uppercase tracking-widest">No Records Found</div>
          ) : (
            entries.map((d, i) => (
              <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                <div>
                  <div className="text-[10px] text-white/40 mb-1">UNIT_{i+1}</div>
                  <div className="font-bold text-sm md:text-base">{d.player_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg md:text-xl font-black text-white">{d.score.toLocaleString()}</div>
                  <div className="text-[9px] md:text-[10px] uppercase text-white/30">{d.difficulty} / {d.control_mode === 'one-hand' ? '1H' : '2H'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'menu' | 'starting' | 'playing' | 'paused' | 'gameover'>('menu');
  const [countdown, setCountdown] = useState(8);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [controlMode, setControlMode] = useState<ControlMode>('one-hand');
  const [shootStyle, setShootStyle] = useState<'pinch' | 'gun'>('pinch');
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handCursors, setHandCursors] = useState<HandCursor[]>([]);
  const [pinchTriggers, setPinchTriggers] = useState<PinchTrigger[]>([]);
  const [showFlicker, setShowFlicker] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [handClickEnabled, setHandClickEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [playerName, setPlayerName] = useState('RECON_UNIT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const cameraUtilRef = useRef<any>(null);
  const synthRef = useRef<SoundSynth | null>(null);
  
  const gameStateRef = useRef(gameState);
  const shootStyleRef = useRef(shootStyle);
  const handClickEnabledRef = useRef(handClickEnabled);
  const bgmEnabledRef = useRef(bgmEnabled);

  const cursorSmoothRefs = useRef<Record<string, {x: number, y: number}>>({});
  const wasPinchedRefs = useRef<Record<string, boolean>>({});
  const prevMiddleYRefs = useRef<Record<string, number>>({});
  const palmGestureTimer = useRef<number>(0);
  const lastHoveredElementId = useRef<string | null>(null);

  const handleActionRef = useRef<any>(null);

  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new SoundSynth();
      const menuMusicUrl = 'https://res.cloudinary.com/dumwsdo42/video/upload/v1767713278/Gaming_Excitement_Music_iz5rm3.mp3';
      const gameMusicUrl = 'https://res.cloudinary.com/dumwsdo42/video/upload/v1767714453/Game_Battle_Music_Soundtrack_sounat.mp3';
      Promise.all([
        synthRef.current.loadMenuBGM(menuMusicUrl),
        synthRef.current.loadGameBGM(gameMusicUrl)
      ]).then(() => {
        if ((gameStateRef.current === 'menu' || gameStateRef.current === 'starting') && synthRef.current && bgmEnabledRef.current) {
          synthRef.current.startMenuBGM();
        }
      });
    }
    const unlockAudio = () => {
      if (synthRef.current) {
        synthRef.current.resume();
        if (bgmEnabledRef.current) {
          if (gameStateRef.current === 'menu' || gameStateRef.current === 'starting') synthRef.current.startMenuBGM();
          else synthRef.current.startBGM();
        }
      }
    };
    window.addEventListener('click', unlockAudio);
    if (!window.isSecureContext && window.location.hostname !== 'localhost') setIsSecure(false);
    return () => {
      synthRef.current?.stopBGM();
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
    bgmEnabledRef.current = bgmEnabled;
    if (!bgmEnabled) { synthRef.current?.stopBGM(); return; }
    if (gameState === 'menu' || gameState === 'starting') synthRef.current?.startMenuBGM();
    else if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameover') synthRef.current?.startBGM();
  }, [gameState, bgmEnabled]);

  useEffect(() => { shootStyleRef.current = shootStyle; }, [shootStyle]);
  useEffect(() => { handClickEnabledRef.current = handClickEnabled; }, [handClickEnabled]);

  useEffect(() => {
    if (handsRef.current) {
        const maxHands = ((gameState === 'playing' || gameState === 'starting') && controlMode === 'two-hands') ? 2 : 1;
        handsRef.current.setOptions({ maxNumHands: maxHands });
    }
  }, [controlMode, gameState]);

  useEffect(() => {
    let timer: number;
    if (gameState === 'starting' && countdown > 0) {
      timer = window.setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (gameState === 'starting' && countdown === 0) {
      setGameState('playing');
    }
    return () => clearInterval(timer);
  }, [gameState, countdown]);

  const handleHandUIAction = useCallback((action: string, value?: string) => {
    if ((gameStateRef.current === 'playing' || gameStateRef.current === 'starting') && 
        action !== 'pause-game' && action !== 'resume-game' && action !== 'quit-game' && action !== 'show-tutorial') return;
    if (synthRef.current) synthRef.current.playClick();
    switch (action) {
      case 'set-difficulty': if (value) setDifficulty(value as Difficulty); break;
      case 'set-mode': if (value) setControlMode(value as ControlMode); break;
      case 'set-style': if (value) setShootStyle(value as 'pinch' | 'gun'); break;
      case 'start-game': setScore(0); setCombo(0); setLives(3); setCountdown(8); setGameState('starting'); if (synthRef.current) synthRef.current.playStart(); break;
      case 'show-tutorial': setShowTutorial(true); break;
      case 'show-leaderboard': setShowLeaderboard(true); break;
      case 'visit-linkedin': window.open('https://linkedin.com/in/lavankit-dariwal-3baa39242', '_blank'); break;
      case 'close-board': setShowLeaderboard(false); break;
      case 'pause-game': setGameState('paused'); break;
      case 'resume-game': setGameState('playing'); break;
      case 'quit-game': setGameState('menu'); break;
      case 'restart': setScore(0); setCombo(0); setLives(3); setCountdown(8); setGameState('starting'); if (synthRef.current) synthRef.current.playStart(); break;
      case 'toggle-bgm': setBgmEnabled(!bgmEnabled); break;
    }
  }, [bgmEnabled]);

  useEffect(() => { handleActionRef.current = handleHandUIAction; }, [handleHandUIAction]);

  const initCamera = useCallback(async () => {
    const w = window as any;
    if (!w.Hands || !w.Camera || !videoRef.current) return;
    if (cameraUtilRef.current) { try { cameraUtilRef.current.stop(); } catch(e) {} cameraUtilRef.current = null; }
    if (handsRef.current) { try { handsRef.current.close(); } catch(e) {} handsRef.current = null; }
    try {
      setCameraError(null);
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } });
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionErr: any) {
        setCameraError("Camera Access Denied. Allow access and reload.");
        return;
      }
      const hands = new w.Hands({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.75, minTrackingConfidence: 0.75 });
      hands.onResults((results: any) => {
        const newCursors: HandCursor[] = [];
        const newTriggers: PinchTrigger[] = [];
        document.querySelectorAll('.hand-hover').forEach(el => el.classList.remove('hand-hover'));
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const interactiveElements = Array.from(document.querySelectorAll('[data-hand-action]')) as HTMLElement[];
          results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const wrist = landmarks[0], thumbTip = landmarks[4], indexMcp = landmarks[5], indexTip = landmarks[8], middleTip = landmarks[12], ringTip = landmarks[16], pinkyTip = landmarks[20];
            const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            const handScale = dist(indexMcp, wrist), pinchDistance = dist(thumbTip, indexTip), key = results.multiHandedness?.[index]?.label || `hand-${index}`;
            let isActionActive = false, trackingTarget = indexTip;
            if (shootStyleRef.current === 'pinch') {
              trackingTarget = thumbTip;
              const threshold = handScale * 0.22;
              let isPinched = wasPinchedRefs.current[key] || false;
              if (isPinched) { if (pinchDistance > threshold * 1.5) isPinched = false; } else { if (pinchDistance < threshold) isPinched = true; }
              isActionActive = isPinched;
            } else {
              trackingTarget = indexTip;
              const isIndexExtended = dist(indexTip, wrist) > handScale * 1.7, isRingCurled = dist(ringTip, wrist) < handScale * 1.1, isPinkyCurled = dist(pinkyTip, wrist) < handScale * 1.0, isGunPose = isIndexExtended && isRingCurled && isPinkyCurled;
              const currentMiddleY = middleTip.y, prevMiddleY = prevMiddleYRefs.current[key] || currentMiddleY, middleVelocityY = currentMiddleY - prevMiddleY; 
              prevMiddleYRefs.current[key] = currentMiddleY;
              isActionActive = isGunPose && (middleVelocityY < -0.025);
            }
            const actionJustStarted = !wasPinchedRefs.current[key] && isActionActive;
            wasPinchedRefs.current[key] = isActionActive;
            if ([indexTip, middleTip, ringTip, pinkyTip].every(tip => tip && dist(tip, wrist) > handScale * 1.65) && gameStateRef.current === 'playing') {
                palmGestureTimer.current += 1;
                if (palmGestureTimer.current > 20) { if (handleActionRef.current) handleActionRef.current('pause-game'); palmGestureTimer.current = 0; }
            } else palmGestureTimer.current = 0;
            const processedX = 50 + ((1 - trackingTarget.x) * 100 - 50) * Math.min(3.5, Math.max(1.0, 0.18 / handScale));
            const processedY = 50 + (trackingTarget.y * 100 - 50) * Math.min(3.5, Math.max(1.0, 0.18 / handScale));
            if (!cursorSmoothRefs.current[key]) cursorSmoothRefs.current[key] = { x: processedX, y: processedY };
            const smoothRef = cursorSmoothRefs.current[key];
            smoothRef.x += (processedX - smoothRef.x) * 0.45;
            smoothRef.y += (processedY - smoothRef.y) * 0.45;
            const screenX = Math.max(0, Math.min(100, smoothRef.x)), screenY = Math.max(0, Math.min(100, smoothRef.y));
            if (gameStateRef.current !== 'playing' && gameStateRef.current !== 'starting') {
                const pxX = (screenX / 100) * window.innerWidth, pxY = (screenY / 100) * window.innerHeight;
                for (const el of interactiveElements) {
                    const rect = el.getBoundingClientRect();
                    if (pxX >= rect.left && pxX <= rect.right && pxY >= rect.top && pxY <= rect.bottom) {
                        if (handClickEnabledRef.current) el.classList.add('hand-hover');
                        if (lastHoveredElementId.current !== (el.id || el.getAttribute('data-hand-action'))) {
                          lastHoveredElementId.current = el.id || el.getAttribute('data-hand-action');
                          if (synthRef.current) synthRef.current.playHover();
                        }
                        if (actionJustStarted && handClickEnabledRef.current) {
                            const action = el.getAttribute('data-hand-action'), value = el.getAttribute('data-hand-value');
                            if (action && handleActionRef.current) handleActionRef.current(action, value || undefined);
                        }
                        break;
                    }
                }
            }
            newCursors.push({ x: screenX, y: screenY, visible: true, pinched: isActionActive, id: index });
            newTriggers.push({ x: screenX / 100, y: screenY / 100, active: isActionActive, id: index });
          });
        }
        setHandCursors(newCursors); setPinchTriggers(newTriggers);
      });
      handsRef.current = hands;
      const camera = new w.Camera(videoRef.current, { onFrame: async () => { if (handsRef.current && videoRef.current && videoRef.current.readyState >= 2) try { await handsRef.current.send({ image: videoRef.current }); } catch (err) {} }, width: 1280, height: 720 });
      cameraUtilRef.current = camera; await camera.start(); setCameraAllowed(true);
    } catch (e: any) { setCameraError("Initialization failed. Please reload."); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => initCamera(), 1200);
    return () => {
      clearTimeout(timer);
      if (cameraUtilRef.current) try { cameraUtilRef.current.stop(); } catch(e) {}
      if (handsRef.current) try { handsRef.current.close(); } catch(e) {}
    };
  }, [initCamera]);

  const handleScore = useCallback(() => setCombo(prev => { const newCombo = prev + 1; setScore(s => s + Math.floor(100 * (1 + (newCombo * 0.15)))); return newCombo; }), []);
  const handleMiss = useCallback(() => { setCombo(0); setShowFlicker(true); setTimeout(() => setShowFlicker(false), 400); setLives(prev => { if (prev <= 1) setGameState('gameover'); return prev - 1; }); }, []);

  const handleSaveScore = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const success = await submitScore({
      player_name: playerName || 'RECON_UNIT',
      score: score,
      difficulty: difficulty,
      control_mode: controlMode
    });
    if (success) { setGameState('menu'); setShowLeaderboard(true); }
    setIsSubmitting(false);
  };

  if (!isSecure) return <div className="w-full h-full bg-black flex items-center justify-center p-10 text-center"><h1 className="text-4xl font-black mb-6 text-red-500 uppercase">Secure Context Required</h1></div>;

  return (
    <div className="w-full h-full relative text-white overflow-hidden bg-black font-['Orbitron']">
      {showFlicker && <div className="absolute inset-0 z-[100] bg-red-600/30 pointer-events-none animate-flicker" />}
      {cameraError && (
        <div className="absolute inset-0 bg-black/98 z-[200] flex items-center justify-center p-10 backdrop-blur-3xl">
          <div className="glass-ui edge-glow p-10 md:p-14 max-w-xl w-full text-center">
            <div className="w-16 h-16 border border-red-500 flex items-center justify-center mx-auto mb-8 rotate-45"><span className="text-red-500 font-black text-2xl -rotate-45">!</span></div>
            <h2 className="text-2xl md:text-3xl font-black uppercase mb-6 text-white">Signal Failure</h2>
            <p className="text-white/50 text-xs md:text-sm mb-12">{cameraError}</p>
            <button onClick={() => window.location.reload()} className="px-12 py-5 bg-white text-black font-black uppercase text-xs">Reload Feed</button>
          </div>
        </div>
      )}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} onAction={() => handleHandUIAction('close-board')} />}
      {showTutorial && <TutorialOverlay onClose={(fin) => { if (fin) localStorage.setItem('void_recon_tutorial_v1', 'true'); setShowTutorial(false); }} onNav={() => synthRef.current?.playMenuMove()} />}
      {handCursors.map(cursor => <div key={cursor.id} className={`hand-cursor ${cursor.pinched ? 'pinched' : ''} style-${shootStyle}`} style={{ left: cursor.x + '%', top: cursor.y + '%' }} />)}
      {(gameState === 'playing' || gameState === 'paused') && <Game isActive={gameState === 'playing'} onScore={handleScore} onMiss={handleMiss} onGameOver={() => setGameState('gameover')} externalTriggers={pinchTriggers} difficulty={difficulty} controlMode={controlMode} combo={combo} />}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-20">
        {(gameState === 'playing' || gameState === 'paused') && (
            <div className="flex justify-between items-start">
                <div className="glass-ui px-4 py-3 md:px-8 md:py-5 min-w-[120px] md:min-w-[180px]">
                    <div className="text-[8px] md:text-[10px] uppercase text-white/40 mb-1 font-black">Integrity</div>
                    <div className="text-xl md:text-4xl font-black">{score.toLocaleString()}</div>
                    {combo > 1 && <div className="text-white/60 text-[8px] md:text-xs font-bold mt-1">x{combo} Combo</div>}
                </div>
                <div className="flex gap-2 md:gap-4">{[0, 1, 2].map((i) => <div key={i} className={`w-2.5 h-2.5 md:w-4 md:h-4 rounded-none rotate-45 transition-all duration-500 ${i < lives ? 'bg-white shadow-[0_0_15px_white]' : 'bg-white/10 scale-50 opacity-20'}`} />)}</div>
            </div>
        )}
        {gameState === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-[70] backdrop-blur-md p-4">
            <GestureIllustration style={shootStyle} />
            <div className="text-center">
              <p className="text-white/60 text-[8px] md:text-sm uppercase font-black mb-1 md:mb-4">Prepare Engagement</p>
              <div className="text-5xl md:text-9xl font-black">{countdown > 0 ? countdown : "GO"}</div>
            </div>
          </div>
        )}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black z-50 pointer-events-auto flex flex-col items-center justify-center p-4 md:p-8 edge-glow">
            <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col items-start gap-1 cursor-pointer group" data-hand-action="visit-linkedin" onClick={() => handleHandUIAction('visit-linkedin')}>
              <span className="text-white/40 text-[8px] uppercase font-bold tracking-widest group-hover:text-white">Created By</span>
              <div className="text-white/80 group-hover:text-white underline decoration-white/20 group-hover:decoration-white font-medium uppercase text-[10px] md:text-sm">Lavankit Dariwal</div>
            </div>
            <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-2 md:gap-4">
              <button data-hand-action="show-tutorial" onClick={() => handleHandUIAction('show-tutorial')} className="text-white/40 hover:text-white uppercase text-[8px] md:text-xs font-black border border-white/20 px-2 py-1 md:px-4 md:py-2">How to Play</button>
              <button data-hand-action="show-leaderboard" onClick={() => handleHandUIAction('show-leaderboard')} className="text-white/40 hover:text-white uppercase text-[8px] md:text-xs font-black border border-white/20 px-2 py-1 md:px-4 md:py-2">Board</button>
            </div>
            <div className="flex flex-col items-center w-full max-w-5xl py-8 gap-10 md:gap-16">
              <div className="flex flex-col items-center gap-2 md:gap-4">
                <div className="h-[20vh] md:h-[200px] flex items-center justify-center"><div className="scale-[0.3] md:scale-[0.5]"><TargetIllustration /></div></div>
                <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-white uppercase italic text-center">Void Recon</h1>
              </div>
              <div className="flex flex-row flex-wrap gap-10 md:gap-20 items-center justify-center">
                <div className="flex flex-col gap-4 items-center"><span className="text-[8px] md:text-[10px] font-black uppercase text-white/40">Interaction</span>
                  <div className="flex gap-2">
                    <button data-hand-action="set-mode" data-hand-value="one-hand" onClick={() => handleHandUIAction('set-mode', 'one-hand')} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase ${controlMode === 'one-hand' ? 'bg-white text-black border-white' : 'border-white/40'}`}>One Hand</button>
                    <button data-hand-action="set-mode" data-hand-value="two-hands" onClick={() => handleHandUIAction('set-mode', 'two-hands')} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase ${controlMode === 'two-hands' ? 'bg-white text-black border-white' : 'border-white/40'}`}>Two Hands</button>
                  </div>
                </div>
                <div className="flex flex-col gap-4 items-center"><span className="text-[8px] md:text-[10px] font-black uppercase text-white/40">Shoot Style</span>
                  <div className="flex gap-2">
                    <button data-hand-action="set-style" data-hand-value="pinch" onClick={() => handleHandUIAction('set-style', 'pinch')} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase ${shootStyle === 'pinch' ? 'bg-white text-black border-white' : 'border-white/40'}`}>Pinch</button>
                    <button data-hand-action="set-style" data-hand-value="gun" onClick={() => handleHandUIAction('set-style', 'gun')} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase ${shootStyle === 'gun' ? 'bg-white text-black border-white' : 'border-white/40'}`}>Gun Sign</button>
                  </div>
                </div>
                <div className="flex flex-col gap-4 items-center"><span className="text-[8px] md:text-[10px] font-black uppercase text-white/40">Level</span>
                  <div className="flex gap-2">{(['easy', 'medium', 'hard'] as Difficulty[]).map(lvl => <button key={lvl} data-hand-action="set-difficulty" data-hand-value={lvl} onClick={() => handleHandUIAction('set-difficulty', lvl)} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase ${difficulty === lvl ? 'bg-white text-black border-white' : 'border-white/40'}`}>{lvl}</button>)}</div>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-center">
                <button data-hand-action="toggle-bgm" onClick={() => handleHandUIAction('toggle-bgm')} className={`px-6 py-3 border border-white/20 text-[8px] md:text-[10px] font-black uppercase ${bgmEnabled ? 'bg-white/10' : 'text-white/30'}`}>{bgmEnabled ? 'Music: ON' : 'Music: OFF'}</button>
                <button onClick={() => setHandClickEnabled(!handClickEnabled)} className={`px-6 py-3 border border-white/20 text-[8px] md:text-[10px] font-black uppercase ${handClickEnabled ? 'bg-white/10' : 'text-white/30'}`}>{handClickEnabled ? 'Gesture Clicks: ON' : 'Gesture Clicks: OFF'}</button>
              </div>
              <button data-hand-action="start-game" onClick={() => handleHandUIAction('start-game')} className="px-12 md:px-32 py-5 md:py-7 bg-white text-black font-black text-base md:text-xl rounded-none shadow-[0_0_40px_rgba(255,255,255,0.2)] uppercase italic">Play</button>
            </div>
          </div>
        )}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[60] pointer-events-auto backdrop-blur-sm p-4 text-center">
            <div className="w-full max-w-xs md:max-w-md">
              <h2 className="text-3xl md:text-6xl font-black mb-6 md:mb-12 uppercase italic">Paused</h2>
              <div className="flex flex-col gap-3 items-center">
                <button data-hand-action="resume-game" onClick={() => handleHandUIAction('resume-game')} className="w-full py-4 bg-white text-black font-black uppercase text-xs md:text-base">Resume</button>
                <button data-hand-action="quit-game" onClick={() => handleHandUIAction('quit-game')} className="w-full py-4 border-2 border-white/10 text-white/40 font-black uppercase text-xs md:text-base">Quit</button>
              </div>
            </div>
          </div>
        )}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-[250] pointer-events-auto p-4 text-center backdrop-blur-xl">
            <div className="w-full max-w-md glass-ui p-10 edge-glow">
              <h2 className="text-3xl md:text-5xl font-black mb-8 uppercase italic tracking-tighter">Mission End</h2>
              <div className="text-5xl md:text-7xl font-black mb-10">{score.toLocaleString()}</div>
              
              <div className="mb-8">
                <div className="text-[10px] uppercase text-white/40 mb-2 font-black">Identify Operator</div>
                <input 
                  type="text" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 12))}
                  className="w-full bg-white/5 border border-white/20 px-4 py-3 text-center text-white font-black tracking-widest focus:border-white focus:outline-none uppercase"
                  placeholder="UNIT_NAME"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSaveScore} 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-white text-black font-black uppercase text-xs hover:scale-105 disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Transmit Data'}
                </button>
                <button 
                  data-hand-action="restart" 
                  onClick={() => { setGameState('starting'); setScore(0); setLives(3); }} 
                  className="w-full py-4 border border-white/20 text-white font-black uppercase text-xs"
                >
                  Re-deploy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div id="camera-container"><div className="camera-inner"><video ref={videoRef} id="camera-feed" playsInline muted className={!cameraAllowed ? 'hidden' : 'block'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div></div>
    </div>
  );
};

export default App;
