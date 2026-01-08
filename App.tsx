import React, { useState, useEffect, useRef, useCallback } from 'react';
import Game from './components/Game';
import { SoundSynth } from './services/soundService';
import { HandCursor, PinchTrigger, Difficulty, ControlMode, ShootStyle } from './types';
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

  return <div ref={containerRef} className="pointer-events-none origin-center" />;
};

const GestureIllustration: React.FC<{ style: ShootStyle; isMouse: boolean; scale?: string }> = ({ style, isMouse, scale = "w-[min(550px,75vw)]" }) => {
  if (style === 'tap') {
    const imgUrl = isMouse 
      ? "https://res.cloudinary.com/dumwsdo42/image/upload/v1767881454/2_gimhen.png"
      : "https://res.cloudinary.com/dumwsdo42/image/upload/v1767881455/1_dg6lzf.png";
    
    return (
      <div className={`flex flex-col items-center justify-center pointer-events-none transition-all duration-300 ${scale} h-auto`}>
        <img 
          src={imgUrl} 
          alt={`${isMouse ? 'Click' : 'Tap'} Tutorial`} 
          className="w-full h-full object-contain opacity-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"
        />
        <div className="text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-lg mt-2 text-center whitespace-nowrap drop-shadow-lg">
          {isMouse ? 'CLICK' : 'TAP'} ON TARGETS TO ELIMINATE
        </div>
      </div>
    );
  }

  const imgUrl = style === 'pinch' 
    ? "https://res.cloudinary.com/dumwsdo42/image/upload/v1767719161/Frame_13_nptunk.png"
    : "https://res.cloudinary.com/dumwsdo42/image/upload/v1767719163/Frame_14_mbxzv7.png";

  return (
    <div className={`flex flex-col items-center justify-center pointer-events-none transition-all duration-300 ${scale} h-auto`}>
      <img 
        src={imgUrl} 
        alt={`${style === 'pinch' ? 'Pinch' : 'Gun Sign'} Tutorial`} 
        className="w-full h-full object-contain opacity-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"
      />
      <div className="text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-lg mt-2 text-center whitespace-nowrap drop-shadow-lg">
        {style === 'pinch' ? 'PINCH GESTURE ACTIVE' : 'GUN SIGN GESTURE ACTIVE'}
      </div>
    </div>
  );
};

const TutorialOverlay: React.FC<{ onClose: (finishedAll: boolean) => void, onNav: () => void, currentStyle: ShootStyle, isMouse: boolean }> = ({ onClose, onNav, currentStyle, isMouse }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { 
      title: "UI NAVIGATION", 
      desc: "MOVE YOUR HAND TO CONTROL THE CROSSHAIR. PINCH CURSOR USES A CIRCULAR RING. GUN SIGN USES A PRECISION CROSSHAIR. HOVER OVER BUTTONS AND GESTURE TO CLICK." 
    },
    { 
      title: "HAND GESTURES", 
      desc: "PINCH: CLOSE THUMB AND INDEX TO TRIGGER A CLICK OR FIRE. GUN SIGN: EXTEND INDEX AND THUMB, THEN CURL MIDDLE FINGERS TO FIRE." 
    },
    { 
      title: "EMERGENCY PAUSE", 
      desc: "HOLD AN OPEN PALM STEADY FOR 2 SECONDS TO PAUSE THE ENGAGEMENT. THIS ALLOWS FOR TACTICAL RE-CALIBRATION." 
    }
  ];
  
  const next = () => { onNav(); setStep(step + 1); };
  const prev = () => { onNav(); setStep(step - 1); };

  return (
    <div className="absolute inset-0 bg-black/95 z-[150] flex items-center justify-center p-8 backdrop-blur-xl">
      <div className="glass-ui edge-glow p-6 md:p-12 max-w-2xl w-full text-center relative flex flex-col items-center">
        <button 
          data-hand-action="close-tut" 
          onClick={() => { onNav(); onClose(false); }} 
          className="absolute top-4 right-4 md:top-8 md:right-8 text-white/40 hover:text-white uppercase text-[10px] font-black border border-white/20 px-4 py-2"
        >
          CLOSE
        </button>
        
        <div className="text-[10px] uppercase text-white/40 mb-2 font-black tracking-widest">TUTORIAL MODE</div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-6">{steps[step].title}</h2>
        
        <div className="mb-8 w-full flex justify-center items-center h-[200px] md:h-[280px]">
           {step === 0 && (
              <div className="flex gap-12 items-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"/></div>
                  <span className="text-[8px] font-black uppercase text-white/40">PINCH RING</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border border-white relative"><div className="absolute inset-0 border-t border-white top-1/2"/><div className="absolute inset-0 border-l border-white left-1/2"/></div>
                  <span className="text-[8px] font-black uppercase text-white/40">GUN CROSSHAIR</span>
                </div>
              </div>
           )}
           {step === 1 && (
             <div className="flex gap-4 md:gap-8 items-center justify-center scale-75 md:scale-100">
               <div className="flex flex-col items-center gap-2">
                 <img src="https://res.cloudinary.com/dumwsdo42/image/upload/v1767719161/Frame_13_nptunk.png" className="h-32 object-contain" alt="Pinch" />
                 <span className="text-[10px] font-black uppercase">PINCH</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                 <img src="https://res.cloudinary.com/dumwsdo42/image/upload/v1767719163/Frame_14_mbxzv7.png" className="h-32 object-contain" alt="Gun" />
                 <span className="text-[10px] font-black uppercase">GUN SIGN</span>
               </div>
             </div>
           )}
           {step === 2 && (
             <img src="https://res.cloudinary.com/dumwsdo42/image/upload/v1767888231/Frame_15_qfqn5a.png" className="h-32 md:h-48 object-contain" alt="Pause Gesture" />
           )}
        </div>

        <div className="mb-8 min-h-[60px]">
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-lg mx-auto">{steps[step].desc}</p>
        </div>
        
        <div className="flex justify-between items-center w-full mt-auto">
          <button data-hand-action="tut-prev" onClick={() => step > 0 ? prev() : null} className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-white/40 hover:text-white'}`}>PREV</button>
          <div className="flex gap-2">
            {steps.map((_, i) => <div key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-none rotate-45 ${i === step ? 'bg-white' : 'bg-white/10'}`} />)}
          </div>
          {step < steps.length - 1 ? (
            <button data-hand-action="tut-next" onClick={() => next()} className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white hover:text-white/70">NEXT</button>
          ) : (
            <button data-hand-action="tut-finish" onClick={() => { onNav(); onClose(true); }} className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white border-b border-white hover:border-transparent transition-all">FINISH</button>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardModal: React.FC<{ onClose: () => void, onAction: () => void, currentUserScore?: number, currentUserName?: string }> = ({ onClose, onAction, currentUserScore, currentUserName }) => {
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

  const formatEliteName = (name: string) => {
    return name.replace(/[_-]?\d+$/, '').trim();
  };

  let userRank = -1;
  if (currentUserScore !== undefined && currentUserName !== undefined) {
    userRank = entries.findIndex(e => e.player_name === currentUserName && e.score === currentUserScore) + 1;
    if (userRank <= 0) {
      userRank = entries.findIndex(e => currentUserScore >= e.score) + 1;
      if (userRank === 0) userRank = entries.length + 1;
    }
  }

  const isUserInTop7 = userRank > 0 && userRank <= 7;
  const top7 = entries.slice(0, 7);

  return (
    <div className="absolute inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 backdrop-blur-md">
      <div className="glass-ui edge-glow p-8 md:p-10 max-w-lg w-full">
        <div className="flex justify-between items-center mb-8 md:mb-10 border-b border-white/10 pb-4">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest">ELITE VANGUARD</h2>
          <button data-hand-action="close-board" onClick={() => { onAction(); onClose(); }} className="text-white/40 hover:text-white uppercase text-[10px] md:text-xs font-bold border border-white/10 px-4 py-2">CLOSE</button>
        </div>
        <div className="flex flex-col gap-4 md:gap-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-white/20 animate-pulse font-black uppercase tracking-widest">SYNCING DATA...</div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {top7.map((d, i) => {
                  const isCurrent = (userRank === i + 1);
                  return (
                    <div key={i} className={`flex justify-between items-center border-b border-white/5 pb-2 px-1 transition-all ${isCurrent ? 'bg-white/10' : ''}`}>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm md:text-lg font-black w-8 ${i < 3 ? 'text-white' : 'text-white/30'}`}>#{i + 1}</span>
                        <div>
                          <div className="font-bold text-xs md:text-base uppercase tracking-widest truncate max-w-[140px] md:max-w-[220px]">
                            {formatEliteName(d.player_name)}
                          </div>
                          <div className="text-[8px] md:text-[9px] uppercase text-white/30 tracking-tighter">{d.difficulty} / {d.control_mode === 'one-hand' ? '1H' : '2H'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm md:text-lg font-black text-white/90">{d.score.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isUserInTop7 && userRank > 0 && currentUserScore !== undefined && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-center text-[10px] text-white/10 mb-4 tracking-[0.8em]">YOUR PERFORMANCE RECORD</div>
                  <div className="flex justify-between items-center bg-white/5 border border-white/20 p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm md:text-lg font-black w-8 text-white/30">#{userRank}</span>
                      <div>
                        <div className="font-bold text-xs md:text-base uppercase tracking-widest text-white">{currentUserName} (YOU)</div>
                        <div className="text-[8px] md:text-[10px] uppercase text-white/30">OPERATOR VERIFIED</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm md:text-lg font-black text-white">{currentUserScore.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {entries.length === 0 && !loading && (
                <div className="text-center py-10 text-white/20 font-black uppercase tracking-widest">NO RECORDS FOUND</div>
              )}
            </>
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
  const [shootStyle, setShootStyle] = useState<ShootStyle>('pinch');
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
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isMouse, setIsMouse] = useState(false);
  
  const [rankInfo, setRankInfo] = useState<{ rank: number, pointsToTarget: number, targetRank: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const cameraUtilRef = useRef<any>(null);
  const synthRef = useRef<SoundSynth | null>(null);
  
  const gameStateRef = useRef(gameState);
  const prevGameStateRef = useRef(gameState);
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
    const checkMouse = () => {
      setIsMouse(window.matchMedia('(pointer: fine)').matches);
    };
    checkMouse();
    window.addEventListener('resize', checkMouse);
    return () => window.removeEventListener('resize', checkMouse);
  }, []);

  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new SoundSynth();
      const menuMusicUrl = 'https://res.cloudinary.com/dumwsdo42/video/upload/v1767713278/Gaming_Excitement_Music_iz5rm3.mp3';
      const gameMusicUrl = 'https://res.cloudinary.com/dumwsdo42/video/upload/v1767714453/Game_Battle_Music_Soundtrack_sounat.mp3';
      
      Promise.all([
        synthRef.current.loadMenuBGM(menuMusicUrl),
        synthRef.current.loadGameBGM(gameMusicUrl)
      ]);
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
    const prev = prevGameStateRef.current;
    gameStateRef.current = gameState;
    bgmEnabledRef.current = bgmEnabled;
    if (!synthRef.current) return;
    if (!bgmEnabled) { 
        synthRef.current.stopBGM(); 
        prevGameStateRef.current = gameState;
        return; 
    }
    if (gameState === 'menu' || gameState === 'starting') {
        const returnedFromGame = prev !== 'menu' && prev !== 'starting';
        synthRef.current.startMenuBGM(returnedFromGame);
    } else {
        synthRef.current.startBGM();
    }
    prevGameStateRef.current = gameState;
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

  useEffect(() => {
    if (gameState === 'gameover') {
      const calculateRank = async () => {
        const entries = await fetchLeaderboard();
        let currentRank = entries.findIndex(e => score >= e.score) + 1;
        if (currentRank === 0) currentRank = entries.length + 1;
        
        let targetRank = Math.max(1, currentRank - 5);
        let targetScore = entries[targetRank - 1]?.score || 0;
        
        if (currentRank <= 5) targetRank = 1;
        
        let pointsToTarget = Math.max(0, targetScore - score);
        if (currentRank === 1) pointsToTarget = 0;

        setRankInfo({ rank: currentRank, pointsToTarget, targetRank });
      };
      calculateRank();
    } else {
      setRankInfo(null);
    }
  }, [gameState, score]);

  const handleHandUIAction = useCallback((action: string, value?: string) => {
    if ((gameStateRef.current === 'playing' || gameStateRef.current === 'starting') && 
        action !== 'pause-game' && action !== 'resume-game' && action !== 'quit-game' && action !== 'show-tutorial' && action !== 'close-tut') return;
    if (synthRef.current) synthRef.current.playClick();
    switch (action) {
      case 'set-difficulty': if (value) setDifficulty(value as Difficulty); break;
      case 'set-mode': if (value) setControlMode(value as ControlMode); break;
      case 'set-style': if (value) setShootStyle(value as ShootStyle); break;
      case 'start-game': setScore(0); setCombo(0); setLives(3); setCountdown(8); setGameState('starting'); setHasSubmitted(false); setPlayerName(''); if (synthRef.current) synthRef.current.playStart(); break;
      case 'show-tutorial': setShowTutorial(true); break;
      case 'close-tut': setShowTutorial(false); break;
      case 'show-leaderboard': setShowLeaderboard(true); break;
      case 'visit-linkedin': window.open('https://linkedin.com/in/lavankit-dariwal-3baa39242', '_blank'); break;
      case 'close-board': setShowLeaderboard(false); break;
      case 'pause-game': setGameState('paused'); break;
      case 'resume-game': setCountdown(3); setGameState('starting'); break;
      case 'quit-game': setGameState('menu'); break;
      case 'restart': setScore(0); setCombo(0); setLives(3); setCountdown(8); setGameState('starting'); setHasSubmitted(false); setPlayerName(''); if (synthRef.current) synthRef.current.playStart(); break;
      case 'toggle-bgm': setBgmEnabled(!bgmEnabled); break;
      case 'submit-score': handleSaveScore(); break;
    }
  }, [bgmEnabled, playerName, score, difficulty, controlMode]);

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
        const isTapMode = shootStyleRef.current === 'tap';
        
        document.querySelectorAll('.hand-hover').forEach(el => el.classList.remove('hand-hover'));

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const interactiveElements = Array.from(document.querySelectorAll('[data-hand-action]')) as HTMLElement[];
          results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const wrist = landmarks[0], thumbTip = landmarks[4], indexMcp = landmarks[5], indexTip = landmarks[8], middleTip = landmarks[12], ringTip = landmarks[16], pinkyTip = landmarks[20];
            const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            const handScale = dist(indexMcp, wrist), pinchDistance = dist(thumbTip, indexTip), key = results.multiHandedness?.[index]?.label || `hand-${index}`;
            let isActionActive = false, trackingTarget = indexTip;
            
            if (shootStyleRef.current === 'pinch' || isTapMode) {
              trackingTarget = thumbTip;
              const threshold = handScale * 0.22;
              let isPinched = wasPinchedRefs.current[key] || false;
              if (isPinched) { if (pinchDistance > threshold * 1.5) isPinched = false; } else { if (pinchDistance < threshold) isPinched = true; }
              isActionActive = isPinched;
            } else if (shootStyleRef.current === 'gun') {
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
                            el.click(); // BROAD CLICK TO TRIGGER COMPONENT-INTERNAL ACTIONS
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
      cameraUtilRef.current = camera;
      await camera.start(); setCameraAllowed(true);
    } catch (e: any) { setCameraError("Initialization failed. Please reload."); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => initCamera(), 1200);
    return () => clearTimeout(timer);
  }, [initCamera]);

  const handleScore = useCallback(() => setCombo(prev => { const newCombo = prev + 1; setScore(s => s + Math.floor(100 * (1 + (newCombo * 0.15)))); return newCombo; }), []);
  const handleMiss = useCallback(() => { setCombo(0); setShowFlicker(true); setTimeout(() => setShowFlicker(false), 400); setLives(prev => { if (prev <= 1) setGameState('gameover'); return prev - 1; }); }, []);

  const handleSaveScore = async () => {
    if (isSubmitting || !playerName.trim() || hasSubmitted) return;
    setIsSubmitting(true);
    const sanitizedName = playerName.trim();
    const success = await submitScore({
      player_name: sanitizedName,
      score: score,
      difficulty: difficulty,
      control_mode: controlMode
    });
    if (success) { 
      setHasSubmitted(true);
      if (synthRef.current) synthRef.current.playClick();
      setShowLeaderboard(true);
    }
    setIsSubmitting(false);
  };

  if (!isSecure) return <div className="w-full h-full bg-black flex items-center justify-center p-10 text-center"><h1 className="text-4xl font-black mb-6 text-red-500 uppercase">Secure Context Required</h1></div>;

  return (
    <div className="w-full h-[100dvh] relative text-white overflow-hidden bg-black font-['Orbitron'] touch-none">
      {showFlicker && <div className="absolute inset-0 z-[100] bg-red-600/30 pointer-events-none animate-flicker" />}
      {cameraError && (
        <div className="absolute inset-0 bg-black/98 z-[200] flex items-center justify-center p-10 backdrop-blur-3xl">
          <div className="glass-ui edge-glow p-10 md:p-14 max-w-xl w-full text-center">
            <div className="w-16 h-16 border border-red-500 flex items-center justify-center mx-auto mb-8 rotate-45"><span className="text-red-500 font-black text-2xl -rotate-45">!</span></div>
            <h2 className="text-2xl md:text-3xl font-black uppercase mb-6 text-white">SIGNAL FAILURE</h2>
            <p className="text-white/50 text-xs md:text-sm mb-12 uppercase">{cameraError}</p>
            <button onClick={() => window.location.reload()} className="px-12 py-5 bg-white text-black font-black uppercase text-xs">RELOAD FEED</button>
          </div>
        </div>
      )}
      {showLeaderboard && (
        <LeaderboardModal 
          onClose={() => setShowLeaderboard(false)} 
          onAction={() => handleHandUIAction('close-board')} 
          currentUserScore={hasSubmitted ? score : undefined}
          currentUserName={hasSubmitted ? playerName : undefined}
        />
      )}
      {showTutorial && <TutorialOverlay onClose={(fin) => { if (fin) localStorage.setItem('void_recon_tutorial_v1', 'true'); setShowTutorial(false); }} onNav={() => synthRef.current?.playMenuMove()} currentStyle={shootStyle} isMouse={isMouse} />}
      
      {shootStyle !== 'tap' && handCursors.map(cursor => <div key={cursor.id} className={`hand-cursor ${cursor.pinched ? 'pinched' : ''} style-${shootStyle}`} style={{ left: cursor.x + '%', top: cursor.y + '%' }} />)}
      
      {(gameState === 'playing' || gameState === 'paused') && (
        <Game 
          isActive={gameState === 'playing'} 
          onScore={handleScore} 
          onMiss={handleMiss} 
          onGameOver={() => setGameState('gameover')} 
          externalTriggers={shootStyle === 'tap' ? [] : pinchTriggers} 
          difficulty={difficulty} 
          controlMode={controlMode} 
          combo={combo} 
        />
      )}
      
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 md:p-8 z-20 h-full w-full">
        <div className="w-full flex-shrink-0">
            {(gameState === 'playing' || gameState === 'paused') && (
                <div className="w-full flex justify-between items-start">
                    <div className="glass-ui px-4 py-3 md:px-8 md:py-5 min-w-[110px] md:min-w-[180px]">
                        <div className="text-[8px] md:text-[10px] uppercase text-white/40 mb-1 font-black">INTEGRITY</div>
                        <div className="text-lg md:text-4xl font-black">{score.toLocaleString()}</div>
                        {combo > 1 && <div className="text-white/60 text-[8px] md:text-xs font-bold mt-1">x{combo} COMBO</div>}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 md:gap-3">
                      <div className="flex gap-4 md:gap-6 items-center">
                        {(gameState === 'playing' || gameState === 'paused') && (
                          <button 
                            data-hand-action={gameState === 'playing' ? 'pause-game' : 'resume-game'}
                            onClick={() => handleHandUIAction(gameState === 'playing' ? 'pause-game' : 'resume-game')}
                            className="pointer-events-auto bg-white/10 p-2 border border-white/20 hover:bg-white/20 transition-all"
                            aria-label={gameState === 'playing' ? "Pause Game" : "Resume Game"}
                          >
                            {gameState === 'playing' ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                            )}
                          </button>
                        )}
                        <div className="flex gap-2 md:gap-4">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className={`w-2.5 h-2.5 md:w-4 md:h-4 rounded-none rotate-45 transition-all duration-500 ${i < lives ? 'bg-white shadow-[0_0_15px_white]' : 'bg-white/10 scale-50 opacity-20'}`} />
                          ))}
                        </div>
                      </div>
                      {gameState === 'playing' && shootStyle !== 'tap' && (
                        <span className="text-[7px] md:text-[9px] uppercase text-white/40 font-black animate-pulse tracking-[0.2em] whitespace-nowrap">OPEN PALM TO PAUSE</span>
                      )}
                    </div>
                </div>
            )}
        </div>

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black z-50 pointer-events-auto flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 edge-glow h-full w-full overflow-hidden">
            <div className="w-full flex justify-between items-start flex-shrink-0 relative z-10 mb-4">
              <div className="flex flex-col items-start gap-1 cursor-pointer group" data-hand-action="visit-linkedin" onClick={() => handleHandUIAction('visit-linkedin')}>
                <span className="text-white/40 text-[7px] md:text-[8px] uppercase font-bold tracking-widest group-hover:text-white">CREATED BY</span>
                <div className="text-white/80 group-hover:text-white underline decoration-white/20 group-hover:decoration-white font-medium uppercase text-[9px] md:text-sm">LAVANKIT DARIWAL</div>
              </div>
              <div className="flex gap-2">
                <button data-hand-action="show-tutorial" onClick={() => handleHandUIAction('show-tutorial')} className="text-white/40 hover:text-white uppercase text-[8px] md:text-xs font-black border border-white/20 px-2 py-1 md:px-4 md:py-2">HOW TO PLAY</button>
                <button data-hand-action="show-leaderboard" onClick={() => handleHandUIAction('show-leaderboard')} className="text-white/40 hover:text-white uppercase text-[8px] md:text-xs font-black border border-white/20 px-2 py-1 md:px-4 md:py-2">BOARD</button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-start w-full mt-[calc(1vh+40px)] sm:mt-[calc(2vh+40px)]">
              <div className="flex flex-col items-center gap-[30px] mb-[30px]">
                <div className="h-[10vh] sm:h-[15vh] flex items-center justify-center">
                  <div className="scale-[0.26] sm:scale-[0.36] md:scale-[0.54] origin-center">
                    <TargetIllustration />
                  </div>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic text-center flex-shrink-0">VOID RECON</h1>
              </div>
              
              <div className="flex flex-col items-center w-full max-w-7xl flex-shrink-0 scale-[0.98] origin-top">
                <div className="flex flex-col min-[1000px]:flex-row gap-[30px] items-center">
                  <div className="flex flex-col gap-2 md:gap-3 items-center">
                    <span className="text-[7px] md:text-[9px] font-black uppercase text-white/40 tracking-[0.3em]">LEVEL</span>
                    <div className="flex gap-2 sm:gap-3 md:gap-4">
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map(lvl => (
                        <button key={lvl} data-hand-action="set-difficulty" data-hand-value={lvl} onClick={() => handleHandUIAction('set-difficulty', lvl)} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-none border-[1px] md:border-2 text-[9px] md:text-xs font-black uppercase transition-all duration-300 ${difficulty === lvl ? 'bg-white/10 text-white border-white' : 'border-white/20 text-white/50 bg-transparent'}`}>{lvl.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col min-[600px]:flex-row gap-[30px] items-center">
                    <div className="flex flex-col gap-2 md:gap-3 items-center">
                      <span className="text-[7px] md:text-[9px] font-black uppercase text-white/40 tracking-[0.3em]">SHOOT STYLE</span>
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                        <button data-hand-action="set-style" data-hand-value="pinch" onClick={() => handleHandUIAction('set-style', 'pinch')} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-none border-[1px] md:border-2 text-[9px] md:text-xs font-black uppercase transition-all duration-300 ${shootStyle === 'pinch' ? 'bg-white/10 text-white border-white' : 'border-white/20 text-white/50 bg-transparent'}`}>PINCH</button>
                        <button data-hand-action="set-style" data-hand-value="gun" onClick={() => handleHandUIAction('set-style', 'gun')} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-none border-[1px] md:border-2 text-[9px] md:text-xs font-black uppercase transition-all duration-300 ${shootStyle === 'gun' ? 'bg-white/10 text-white border-white' : 'border-white/20 text-white/50 bg-transparent'}`}>GUN SIGN</button>
                        <button data-hand-action="set-style" data-hand-value="tap" onClick={() => handleHandUIAction('set-style', 'tap')} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-none border-[1px] md:border-2 text-[9px] md:text-xs font-black uppercase transition-all duration-300 ${shootStyle === 'tap' ? 'bg-white/10 text-white border-white' : 'border-white/20 text-white/50 bg-transparent'}`}>{isMouse ? 'CLICK' : 'TAP'}</button>
                      </div>
                    </div>

                    <div className={`flex flex-col gap-2 md:gap-3 items-center transition-opacity duration-500 ${shootStyle === 'tap' ? 'opacity-30' : 'opacity-100'}`}>
                      <span className="text-[7px] md:text-[9px] font-black uppercase text-white/40 tracking-[0.3em]">INTERACTION</span>
                      <div className={`flex gap-2 sm:gap-4 ${shootStyle === 'tap' ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                        <button data-hand-action="set-mode" data-hand-value="one-hand" onClick={() => handleHandUIAction('set-mode', 'one-hand')} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-none border-[1px] md:border-2 text-[9px] md:text-xs font-black uppercase transition-all duration-300 ${controlMode === 'one-hand' ? 'bg-white/10 text-white border-white' : 'border-white/20 text-white/50 bg-transparent'}`}>ONE HAND</button>
                        <button data-hand-action="set-mode" data-hand-value="two-hands" onClick={() => handleHandUIAction('set-mode', 'two-hands')} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-none border-[1px] md:border-2 text-[9px] md:text-xs font-black uppercase transition-all duration-300 ${controlMode === 'two-hands' ? 'bg-white/10 text-white border-white' : 'border-white/20 text-white/50 bg-transparent'}`}>TWO HANDS</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row gap-4 items-center mt-12 sm:mt-16">
                  <button data-hand-action="toggle-bgm" onClick={() => handleHandUIAction('toggle-bgm')} className={`px-4 py-2 sm:px-8 sm:py-3 border border-white/20 text-[7px] md:text-[10px] font-black uppercase transition-all duration-300 ${bgmEnabled ? 'bg-white/10 text-white' : 'text-white/30 bg-transparent'}`}>{bgmEnabled ? 'MUSIC: ON' : 'MUSIC: OFF'}</button>
                  <button onClick={() => setHandClickEnabled(!handClickEnabled)} disabled={shootStyle === 'tap'} className={`px-4 py-2 sm:px-8 sm:py-3 border border-white/20 text-[7px] md:text-[10px] font-black uppercase transition-all duration-300 ${shootStyle === 'tap' ? 'opacity-20 pointer-events-none' : ''} ${handClickEnabled ? 'bg-white/10 text-white' : 'text-white/30 bg-transparent'}`}>{handClickEnabled ? 'GESTURES: ON' : 'GESTURES: OFF'}</button>
                </div>

                <button data-hand-action="start-game" onClick={() => handleHandUIAction('start-game')} className="px-16 sm:px-28 md:px-36 py-4 sm:py-6 md:py-8 bg-white text-black font-black text-sm sm:text-lg md:text-xl rounded-none shadow-[0_0_50px_rgba(255,255,255,0.2)] uppercase italic mt-12 flex-shrink-0 active:scale-95 transition-transform">PLAY</button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[70] backdrop-blur-md p-4 h-full">
            <div className="flex flex-col items-center justify-center">
              <GestureIllustration style={shootStyle} isMouse={isMouse} />
              <div className="text-center mt-[20px]">
                <p className="text-white/60 text-[8px] md:text-sm uppercase font-black mb-1 md:mb-2 tracking-widest">
                  {countdown > 3 ? "PREPARE ENGAGEMENT" : "RESUMING ENGAGEMENT"}
                </p>
                <div className="text-5xl md:text-9xl font-black leading-none">{countdown > 0 ? countdown : "GO"}</div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[60] pointer-events-auto backdrop-blur-sm p-4 text-center h-full">
            <div className="w-full max-w-xs md:max-w-md">
              <h2 className="text-3xl md:text-6xl font-black mb-6 md:mb-12 uppercase italic">PAUSED</h2>
              <div className="flex flex-col gap-3 items-center">
                <button data-hand-action="resume-game" onClick={() => handleHandUIAction('resume-game')} className="w-full py-4 bg-white text-black font-black uppercase text-xs md:text-base">RESUME</button>
                <button data-hand-action="show-tutorial" onClick={() => handleHandUIAction('show-tutorial')} className="w-full py-4 border-2 border-white/20 text-white font-black uppercase text-xs md:text-base">HOW TO PLAY</button>
                <button data-hand-action="quit-game" onClick={() => handleHandUIAction('quit-game')} className="w-full py-4 border-2 border-white/10 text-white/40 font-black uppercase text-xs md:text-base">QUIT</button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-[250] pointer-events-auto p-4 text-center backdrop-blur-xl h-full overflow-y-auto">
            <div className="w-full max-w-md glass-ui p-6 sm:p-10 edge-glow my-auto">
              <h2 className="text-xl sm:text-4xl font-black mb-4 uppercase italic tracking-tighter">LETS TRY AGAIN</h2>
              <div className="text-4xl sm:text-6xl font-black mb-2">{score.toLocaleString()}</div>
              
              {rankInfo && (
                <div className="mb-6 pt-4 border-t border-white/10 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] uppercase font-bold text-white/40">CURRENT SECTOR RANK</span>
                    <span className="text-lg font-black text-white">#{rankInfo.rank}</span>
                  </div>
                  {rankInfo.rank > 1 && (
                    <div className="text-[10px] text-white/60 font-medium tracking-tight">
                      <span className="text-white font-black">+{rankInfo.pointsToTarget.toLocaleString()}</span> POINTS NEEDED FOR <span className="text-white font-black italic">RANK #{rankInfo.targetRank}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-8 text-left">
                <div className="text-[10px] uppercase text-white/40 mb-2 font-black tracking-widest">ENTER YOUR NAME TO SAVE SCORE.</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={playerName} 
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 16))}
                    className="flex-grow bg-white/5 border border-white/20 px-4 py-3 text-left text-white font-black tracking-widest focus:border-white focus:outline-none uppercase text-[11px] md:text-sm"
                    placeholder="YOUR GAMING NAME"
                  />
                  {playerName.trim() && !hasSubmitted && (
                    <button 
                      data-hand-action="submit-score"
                      onClick={() => handleHandUIAction('submit-score')}
                      className={`px-4 bg-white text-black font-black transition-all ${isSubmitting ? 'opacity-50' : 'hover:scale-105'}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '...' : '✓'}
                    </button>
                  )}
                  {hasSubmitted && (
                    <div className="px-4 bg-green-500/20 text-green-500 border border-green-500/40 flex items-center font-black">
                      SAVED
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button data-hand-action="restart" onClick={() => handleHandUIAction('restart')} className="w-full py-4 bg-white text-black font-black uppercase text-[11px] md:text-sm hover:scale-105 transition-all">RETRY</button>
                <button data-hand-action="quit-game" onClick={() => handleHandUIAction('quit-game')} className="w-full py-4 border border-white/20 text-white font-black uppercase text-[11px] md:text-sm">GO TO MAIN MENU</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div id="camera-container" className={`${shootStyle === 'tap' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="camera-inner pointer-events-none">
          <video ref={videoRef} id="camera-feed" playsInline muted className={!cameraAllowed ? 'hidden' : 'block'} />
        </div>
      </div>
    </div>
  );
};

export default App;