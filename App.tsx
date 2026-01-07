
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Game from './components/Game';
import { SoundSynth } from './services/soundService';
import { HandCursor, PinchTrigger, Difficulty, ControlMode } from './types';

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
    {
      title: "Navigation",
      desc: "Move your hand in front of the camera to control the crosshair. The UI will highlight when you hover over it.",
    },
    {
      title: "Selection & Firing",
      desc: "Use your chosen Gesture (Pinch or Gun Sign) to click UI buttons and shoot targets in-game.",
    },
    {
      title: "Combat Mechanics",
      desc: "Targets move toward you. Destroy them before they reach the integrity threshold. High combos trigger slow-motion.",
    },
    {
      title: "Emergency Pause",
      desc: "Hold an Open Palm for 2 seconds to pause the engagement at any time.",
    }
  ];

  const next = () => {
    onNav();
    setStep(step + 1);
  };

  const prev = () => {
    onNav();
    setStep(step - 1);
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-[150] flex items-center justify-center p-8 backdrop-blur-xl">
      <div className="glass-ui edge-glow p-6 md:p-12 max-w-xl w-full text-center">
        <div className="text-[10px] uppercase text-white/40 mb-2 font-black tracking-widest">Tutorial Mode</div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-6">{steps[step].title}</h2>
        <div className="mb-8 min-h-[80px]">
          <p className="text-white/70 text-sm md:text-base leading-relaxed">{steps[step].desc}</p>
        </div>
        <div className="flex justify-between items-center mt-6 md:mt-10">
          <button 
            data-hand-action="tut-prev"
            onClick={() => step > 0 ? prev() : null}
            className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-white/40 hover:text-white'}`}
          >
            Prev
          </button>
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-none rotate-45 ${i === step ? 'bg-white' : 'bg-white/10'}`} />
            ))}
          </div>
          {step < steps.length - 1 ? (
            <button 
              data-hand-action="tut-next"
              onClick={() => next()}
              className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white hover:text-white/70"
            >
              Next
            </button>
          ) : (
            <button 
              data-hand-action="tut-finish"
              onClick={() => { onNav(); onClose(true); }}
              className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white border-b border-white hover:border-transparent transition-all"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardModal: React.FC<{ onClose: () => void, onAction: () => void }> = ({ onClose, onAction }) => {
  const dummyData = [
    { name: 'NEO_01', score: 25400, settings: 'Hard/2-Hands' },
    { name: 'CIPHER', score: 18200, settings: 'Med/1-Hand' },
    { name: 'TRINITY', score: 12100, settings: 'Easy/1-Hand' },
    { name: 'GHOST', score: 9800, settings: 'Hard/1-Hand' },
    { name: 'M0RPH', score: 7500, settings: 'Med/2-Hands' }
  ];

  return (
    <div className="absolute inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 backdrop-blur-md">
      <div className="glass-ui edge-glow p-8 md:p-10 max-w-lg w-full">
        <div className="flex justify-between items-center mb-8 md:mb-10 border-b border-white/10 pb-4">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest">Global Leadership</h2>
          <button data-hand-action="close-board" onClick={() => { onAction(); onClose(); }} className="text-white/40 hover:text-white uppercase text-[10px] md:text-xs font-bold">Close</button>
        </div>
        <div className="flex flex-col gap-4 md:gap-6">
          {dummyData.map((d, i) => (
            <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
              <div>
                <div className="text-[10px] text-white/40 mb-1">UNIT_{i+1}</div>
                <div className="font-bold text-sm md:text-base">{d.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg md:text-xl font-black text-white">{d.score.toLocaleString()}</div>
                <div className="text-[9px] md:text-[10px] uppercase text-white/30">{d.settings}</div>
              </div>
            </div>
          ))}
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
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    return localStorage.getItem('void_recon_tutorial_v1') === 'true';
  });

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

  useEffect(() => {
    const imagesToPreload = [
      "https://res.cloudinary.com/dumwsdo42/image/upload/v1767719161/Frame_13_nptunk.png",
      "https://res.cloudinary.com/dumwsdo42/image/upload/v1767719163/Frame_14_mbxzv7.png"
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });

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
      }).catch(e => console.log("BGM loading error:", e));
    }
    
    const unlockAudio = () => {
      if (synthRef.current) {
        synthRef.current.resume();
        if (bgmEnabledRef.current) {
          if (gameStateRef.current === 'menu' || gameStateRef.current === 'starting') {
            synthRef.current.startMenuBGM();
          } else {
            synthRef.current.startBGM();
          }
        }
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setIsSecure(false);
    }
    
    return () => {
      synthRef.current?.stopBGM();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
    bgmEnabledRef.current = bgmEnabled;

    if (!bgmEnabled) {
      synthRef.current?.stopBGM();
      return;
    }

    if (gameState === 'menu' || gameState === 'starting') {
      synthRef.current?.startMenuBGM();
    } else if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameover') {
      synthRef.current?.startBGM();
    }
  }, [gameState, bgmEnabled]);

  useEffect(() => {
    shootStyleRef.current = shootStyle;
  }, [shootStyle]);

  useEffect(() => {
    handClickEnabledRef.current = handClickEnabled;
  }, [handClickEnabled]);

  useEffect(() => {
    if (handsRef.current) {
        const maxHands = ((gameState === 'playing' || gameState === 'starting') && controlMode === 'two-hands') ? 2 : 1;
        handsRef.current.setOptions({ maxNumHands: maxHands });
    }
  }, [controlMode, gameState]);

  useEffect(() => {
    let timer: number;
    if (gameState === 'starting' && countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
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
      case 'set-difficulty':
        if (value) setDifficulty(value as Difficulty);
        break;
      case 'set-mode':
        if (value) setControlMode(value as ControlMode);
        break;
      case 'set-style':
        if (value) setShootStyle(value as 'pinch' | 'gun');
        break;
      case 'start-game':
        setScore(0); setCombo(0); setLives(3); setCountdown(8);
        setGameState('starting');
        if (synthRef.current) synthRef.current.playStart();
        break;
      case 'show-tutorial':
        setShowTutorial(true);
        break;
      case 'show-leaderboard':
        setShowLeaderboard(true);
        break;
      case 'visit-linkedin':
        window.open('https://linkedin.com/in/lavankit-dariwal-3baa39242', '_blank');
        break;
      case 'close-board':
        setShowLeaderboard(false);
        break;
      case 'pause-game': 
        setGameState('paused'); 
        break;
      case 'resume-game': 
        setGameState('playing'); 
        break;
      case 'quit-game': 
        setGameState('menu'); 
        break;
      case 'restart':
        setScore(0); setCombo(0); setLives(3); setCountdown(8);
        setGameState('starting');
        if (synthRef.current) synthRef.current.playStart();
        break;
      case 'toggle-bgm':
        setBgmEnabled(!bgmEnabled);
        break;
    }
  }, [bgmEnabled]);

  const finishTutorial = (finishedAll: boolean) => {
    if (finishedAll) {
      localStorage.setItem('void_recon_tutorial_v1', 'true');
      setHasCompletedTutorial(true);
    }
    setShowTutorial(false);
  };

  const initCamera = useCallback(async () => {
    const w = window as any;
    if (!w.Hands || !w.Camera || !videoRef.current) return;

    try {
      setCameraError(null);
      
      // Pre-flight check for camera permission to avoid silent failures
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (permissionErr: any) {
        throw permissionErr; // Bubble up to outer catch for UI handling
      }

      const hands = new w.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.8, 
        minTrackingConfidence: 0.8  
      });

      hands.onResults((results: any) => {
        const newCursors: HandCursor[] = [];
        const newTriggers: PinchTrigger[] = [];

        document.querySelectorAll('.hand-hover').forEach(el => el.classList.remove('hand-hover'));

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const interactiveElements = Array.from(document.querySelectorAll('[data-hand-action]')) as HTMLElement[];

          results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            if (!landmarks || landmarks.length < 21) return;

            const wrist = landmarks[0];
            const thumbTip = landmarks[4];
            const indexMcp = landmarks[5];
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const ringTip = landmarks[16];
            const pinkyTip = landmarks[20];

            if (!wrist || !thumbTip || !indexMcp || !indexTip) return;

            const handedness = results.multiHandedness?.[index]?.label || `hand-${index}`;
            const key = handedness;

            const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            const handScale = dist(indexMcp, wrist);
            const pinchDistance = dist(thumbTip, indexTip);
            
            let isActionActive = false;
            let trackingTarget = indexTip;

            if (shootStyleRef.current === 'pinch') {
              trackingTarget = thumbTip;
              const threshold = handScale * 0.22; 
              let isPinched = wasPinchedRefs.current[key] || false;
              if (isPinched) {
                if (pinchDistance > threshold * 1.5) isPinched = false;
              } else {
                if (pinchDistance < threshold) isPinched = true;
              }
              isActionActive = isPinched;
            } else {
              trackingTarget = indexTip;
              const isIndexExtended = dist(indexTip, wrist) > handScale * 1.7;
              const isRingCurled = dist(ringTip, wrist) < handScale * 1.1;
              const isPinkyCurled = dist(pinkyTip, wrist) < handScale * 1.0;
              const isGunPose = isIndexExtended && isRingCurled && isPinkyCurled;
              
              const currentMiddleY = middleTip.y;
              const prevMiddleY = prevMiddleYRefs.current[key] || currentMiddleY;
              const middleVelocityY = currentMiddleY - prevMiddleY; 
              prevMiddleYRefs.current[key] = currentMiddleY;
              
              const upwardForceThreshold = -0.025; 
              isActionActive = isGunPose && (middleVelocityY < upwardForceThreshold);
            }

            if (!trackingTarget) return; 
            
            const actionJustStarted = !wasPinchedRefs.current[key] && isActionActive;
            wasPinchedRefs.current[key] = isActionActive;

            const isOpenPalm = [indexTip, middleTip, ringTip, pinkyTip].every(tip => 
              tip && dist(tip, wrist) > handScale * 1.65
            );

            if (isOpenPalm && gameStateRef.current === 'playing') {
                palmGestureTimer.current += 1;
                if (palmGestureTimer.current > 18) {
                    handleHandUIAction('pause-game');
                    palmGestureTimer.current = 0;
                }
            } else {
                palmGestureTimer.current = 0;
            }

            const rawX = (1 - trackingTarget.x) * 100;
            const rawY = trackingTarget.y * 100;
            
            const sensitivity = Math.min(3.5, Math.max(1.0, 0.18 / handScale));
            const processedX = 50 + (rawX - 50) * sensitivity;
            const processedY = 50 + (rawY - 50) * sensitivity;

            if (!cursorSmoothRefs.current[key]) cursorSmoothRefs.current[key] = { x: processedX, y: processedY };
            const smoothRef = cursorSmoothRefs.current[key];
            if (smoothRef) {
              smoothRef.x += (processedX - smoothRef.x) * 0.35;
              smoothRef.y += (processedY - smoothRef.y) * 0.35;

              const screenX = Math.max(0, Math.min(100, smoothRef.x));
              const screenY = Math.max(0, Math.min(100, smoothRef.y));

              if (gameStateRef.current !== 'playing' && gameStateRef.current !== 'starting') {
                  const pxX = (screenX / 100) * window.innerWidth;
                  const pxY = (screenY / 100) * window.innerHeight;
                  let foundHover = false;
                  for (const el of interactiveElements) {
                      const rect = el.getBoundingClientRect();
                      if (pxX >= rect.left && pxX <= rect.right && pxY >= rect.top && pxY <= rect.bottom) {
                          foundHover = true;
                          if (handClickEnabledRef.current) {
                            el.classList.add('hand-hover');
                          }
                          
                          const elId = el.id || el.getAttribute('data-hand-action') + el.getAttribute('data-hand-value');
                          if (lastHoveredElementId.current !== elId) {
                            lastHoveredElementId.current = elId;
                            if (synthRef.current) synthRef.current.playHover();
                          }

                          if (actionJustStarted && handClickEnabledRef.current) {
                              const action = el.getAttribute('data-hand-action');
                              const value = el.getAttribute('data-hand-value');
                              if (action) handleHandUIAction(action, value || undefined);
                          }
                          break;
                      }
                  }
                  if (!foundHover) {
                    lastHoveredElementId.current = null;
                  }
              }

              newCursors.push({ x: screenX, y: screenY, visible: true, pinched: isActionActive, id: index });
              newTriggers.push({ x: screenX / 100, y: screenY / 100, active: isActionActive, id: index });
            }
          });
        }
        setHandCursors(newCursors);
        setPinchTriggers(newTriggers);
      });
      handsRef.current = hands;

      const camera = new w.Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280, height: 720
      });
      
      cameraUtilRef.current = camera;
      await camera.start();
      setCameraAllowed(true);
    } catch (e: any) {
      console.error("Camera Init Error:", e);
      if (e.name === 'NotAllowedError' || e.message?.includes('Permission denied')) {
        setCameraError("Camera Access Denied. Check your browser settings to allow camera access.");
      } else {
        setCameraError("Failed to initialize camera. Ensure your device is connected and reload.");
      }
    }
  }, [handleHandUIAction]);

  useEffect(() => {
    // Slight delay to ensure DOM is ready and browser has initialized media devices list
    const timer = setTimeout(() => {
      initCamera();
    }, 1500);
    return () => clearTimeout(timer);
  }, [initCamera]);

  const handleScore = useCallback(() => {
    setCombo(prevCombo => {
      const newCombo = prevCombo + 1;
      const points = 100 * (1 + (newCombo * 0.15));
      setScore(prevScore => prevScore + Math.floor(points));
      return newCombo;
    });
  }, []);

  const handleMiss = useCallback(() => {
    setCombo(0);
    setShowFlicker(true);
    setTimeout(() => setShowFlicker(false), 400);
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) setGameState('gameover');
      return newLives;
    });
  }, []);

  if (!isSecure) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-10 text-center">
        <h1 className="text-4xl font-black mb-6 text-red-500 uppercase">Secure Context Required</h1>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative text-white overflow-hidden bg-black font-['Orbitron']">
      
      {showFlicker && <div className="absolute inset-0 z-[100] bg-red-600/30 pointer-events-none animate-flicker" />}
      
      {/* Camera Error / Permission Overlay */}
      {cameraError && (
        <div className="absolute inset-0 bg-black/95 z-[200] flex items-center justify-center p-8 backdrop-blur-3xl">
          <div className="glass-ui edge-glow p-8 md:p-12 max-w-lg w-full text-center border-red-500/20">
            <div className="w-14 h-14 border border-red-500/50 flex items-center justify-center mx-auto mb-6 rotate-45">
              <span className="text-red-500 font-black text-xl -rotate-45">!</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest mb-4 text-white">Signal Failure</h2>
            <p className="text-white/50 text-xs md:text-sm mb-10 leading-relaxed font-medium">{cameraError}</p>
            <button 
              onClick={() => initCamera()}
              className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all text-[10px] md:text-xs"
            >
              Establish Connection
            </button>
            <p className="mt-8 text-[8px] md:text-[10px] text-white/20 uppercase font-black tracking-widest">Tracking requires visual feed</p>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardModal 
          onClose={() => setShowLeaderboard(false)} 
          onAction={() => handleHandUIAction('close-board')}
        />
      )}
      {showTutorial && (
        <TutorialOverlay 
          onClose={finishTutorial} 
          onNav={() => synthRef.current?.playMenuMove()}
        />
      )}

      {handCursors.map(cursor => (
        <div 
          key={cursor.id}
          className={`hand-cursor ${cursor.pinched ? 'pinched' : ''} style-${shootStyle}`}
          style={{ left: cursor.x + '%', top: cursor.y + '%' }}
        />
      ))}

      {(gameState === 'playing' || gameState === 'paused') && (
        <Game 
            isActive={gameState === 'playing'} 
            onScore={handleScore} 
            onMiss={handleMiss} 
            onGameOver={() => setGameState('gameover')}
            externalTriggers={pinchTriggers}
            difficulty={difficulty}
            controlMode={controlMode}
            combo={combo}
        />
      )}

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-20">
        
        {/* HUD */}
        {(gameState === 'playing' || gameState === 'paused') && (
            <div className="flex justify-between items-start">
                <div className="glass-ui px-4 py-3 md:px-8 md:py-5 min-w-[120px] md:min-w-[180px]">
                    <div className="text-[8px] md:text-[10px] uppercase text-white/40 mb-1 font-black tracking-widest">Integrity</div>
                    <div className="text-xl md:text-4xl font-black">{score.toLocaleString()}</div>
                    {combo > 1 && <div className="text-white/60 text-[8px] md:text-xs font-bold mt-1">x{combo} Combo</div>}
                </div>
                <div className="flex gap-2 md:gap-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={`w-2.5 h-2.5 md:w-4 md:h-4 rounded-none rotate-45 transition-all duration-500 ${i < lives ? 'bg-white shadow-[0_0_15px_white]' : 'bg-white/10 scale-50 opacity-20'}`} />
                    ))}
                </div>
            </div>
        )}

        {/* Starting Countdown Overlay */}
        {gameState === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-[70] backdrop-blur-md edge-glow p-4">
            <div className="mb-4 md:mb-8 flex flex-col items-center">
              <GestureIllustration style={shootStyle} />
            </div>
            <div className="text-center">
              <p className="text-white/60 text-[8px] md:text-sm uppercase tracking-widest font-black mb-1 md:mb-4">Prepare Engagement</p>
              <div className="text-5xl md:text-9xl font-black tracking-tighter tabular-nums animate-pulse">
                {countdown > 0 ? countdown : "GO"}
              </div>
              <p className="text-white/40 text-[9px] md:text-xs mt-2 md:mt-8 italic max-w-[200px] md:max-w-xs mx-auto">
                {shootStyle === 'pinch' ? 'Thumb tracks. Pinch index to fire.' : 'Index tracks. Flick middle finger UP to fire.'}
              </p>
            </div>
          </div>
        )}

        {/* Menu */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black z-50 pointer-events-auto flex flex-col items-center justify-center p-4 md:p-8 edge-glow overflow-y-auto">
            
            <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col items-start gap-1 cursor-pointer group"
                 data-hand-action="visit-linkedin"
                 onClick={() => handleHandUIAction('visit-linkedin')}>
              <span className="text-white/40 text-[8px] md:text-[10px] uppercase font-bold tracking-widest group-hover:text-white transition-colors">Created By</span>
              <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                <span className="text-[9px] md:text-sm font-medium uppercase tracking-tight underline underline-offset-4 decoration-white/20 group-hover:decoration-white">Lavankit Dariwal</span>
              </div>
            </div>
            
            <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-2 md:gap-4">
              <button 
                data-hand-action="show-tutorial" 
                onClick={() => handleHandUIAction('show-tutorial')}
                className="text-white/40 hover:text-white uppercase text-[8px] md:text-xs font-black tracking-widest border border-white/20 px-2 py-1 md:px-4 md:py-2 hover:border-white transition-all"
              >
                How to Play
              </button>
              <button 
                data-hand-action="show-leaderboard" 
                onClick={() => handleHandUIAction('show-leaderboard')}
                className="text-white/40 hover:text-white uppercase text-[8px] md:text-xs font-black tracking-widest border border-white/20 px-2 py-1 md:px-4 md:py-2 hover:border-white transition-all"
              >
                Board
              </button>
            </div>

            <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-8 gap-10 md:gap-16">
              <div className="flex flex-col items-center gap-2 md:gap-4">
                <div className="h-[20vh] md:h-[200px] flex items-center justify-center overflow-visible">
                   <div className="scale-[0.3] md:scale-[0.5] flex items-center justify-center">
                    <TargetIllustration />
                   </div>
                </div>
                <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-white uppercase italic text-center leading-none">Void Recon</h1>
              </div>

              <div className="flex flex-row flex-wrap gap-10 md:gap-20 items-center md:items-start justify-center w-full overflow-visible">
                
                <div className="flex flex-col gap-4 md:gap-6 items-center">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40">Interaction</span>
                  <div className="flex gap-2">
                    <button data-hand-action="set-mode" data-hand-value="one-hand" onClick={() => handleHandUIAction('set-mode', 'one-hand')} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase transition-all ${controlMode === 'one-hand' ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/40'}`}>One Hand</button>
                    <button data-hand-action="set-mode" data-hand-value="two-hands" onClick={() => handleHandUIAction('set-mode', 'two-hands')} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase transition-all ${controlMode === 'two-hands' ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/40'}`}>Two Hands</button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:gap-6 items-center">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40">Shoot Style</span>
                  <div className="flex gap-2">
                    <button data-hand-action="set-style" data-hand-value="pinch" onClick={() => handleHandUIAction('set-style', 'pinch')} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase transition-all ${shootStyle === 'pinch' ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/40'}`}>Pinch</button>
                    <button data-hand-action="set-style" data-hand-value="gun" onClick={() => handleHandUIAction('set-style', 'gun')} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase transition-all ${shootStyle === 'gun' ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/40'}`}>Gun Sign</button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:gap-6 items-center">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40">Level</span>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map(lvl => (
                      <button key={lvl} data-hand-action="set-difficulty" data-hand-value={lvl} onClick={() => handleHandUIAction('set-difficulty', lvl)} className={`px-3 md:px-6 py-2 md:py-3 rounded-none border-2 text-[9px] md:text-xs font-black uppercase transition-all ${difficulty === lvl ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/40'}`}>{lvl}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-row gap-6 md:gap-10 items-center">
                <button 
                  data-hand-action="toggle-bgm"
                  onClick={() => handleHandUIAction('toggle-bgm')}
                  className={`px-6 md:px-10 py-3 md:py-4 rounded-none border border-white/20 text-[8px] md:text-[10px] font-black uppercase transition-all ${bgmEnabled ? 'bg-white/10 text-white' : 'bg-transparent text-white/30'}`}
                >
                  {bgmEnabled ? 'Music: ON' : 'Music: OFF'}
                </button>
                <button 
                  onClick={() => { setHandClickEnabled(!handClickEnabled); synthRef.current?.playClick(); }}
                  className={`px-6 md:px-10 py-3 md:py-4 rounded-none border border-white/20 text-[8px] md:text-[10px] font-black uppercase transition-all ${handClickEnabled ? 'bg-white/10 text-white' : 'bg-transparent text-white/30'}`}
                >
                  {handClickEnabled ? 'Gesture Clicks: ON' : 'Gesture Clicks: OFF'}
                </button>
              </div>

              <button data-hand-action="start-game" onClick={() => handleHandUIAction('start-game')} className="px-12 md:px-32 py-5 md:py-7 bg-white text-black font-black text-base md:text-xl rounded-none hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] uppercase italic">Play</button>
            </div>
            
            <div className="mt-8 md:mt-16 text-[7px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex gap-4 md:gap-8">
              <span>Open Palm to Pause</span>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[60] pointer-events-auto backdrop-blur-sm edge-glow p-4">
            <div className="text-center w-full max-w-xs md:max-w-md">
              <h2 className="text-3xl md:text-6xl font-black mb-6 md:mb-12 uppercase italic tracking-tighter">Paused</h2>
              <div className="flex flex-col gap-3 md:gap-4 items-center">
                <button data-hand-action="resume-game" onClick={() => handleHandUIAction('resume-game')} className="w-full py-4 md:py-6 bg-white text-black font-black rounded-none uppercase tracking-widest hover:scale-105 transition-all text-xs md:text-base">Resume</button>
                <button data-hand-action="show-tutorial" onClick={() => handleHandUIAction('show-tutorial')} className="w-full py-4 md:py-6 border-2 border-white/20 text-white font-black rounded-none uppercase tracking-widest hover:bg-white/10 transition-all text-xs md:text-base">How to Play</button>
                <button data-hand-action="quit-game" onClick={() => handleHandUIAction('quit-game')} className="w-full py-4 md:py-6 border-2 border-white/10 text-white/40 font-black rounded-none uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all text-xs md:text-base">Quit</button>
              </div>
            </div>
          </div>
        )}

        {/* GameOver Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 pointer-events-auto edge-glow p-4">
            <div className="text-center p-4 md:p-12 w-full max-w-md">
              <h2 className="text-3xl md:text-6xl font-black mb-6 md:mb-12 uppercase tracking-tighter italic">Lets Try Again</h2>
              <div className="text-5xl md:text-8xl font-black mb-6 md:mb-16 tabular-nums">{score.toLocaleString()}</div>
              <div className="flex flex-col gap-3 md:gap-4 items-center">
                <button data-hand-action="restart" onClick={() => handleHandUIAction('restart')} className="w-full py-4 md:py-6 bg-white text-black font-black rounded-none uppercase tracking-widest hover:scale-105 transition-all text-xs md:text-base">Retry</button>
                <button data-hand-action="quit-game" onClick={() => { handleHandUIAction('quit-game'); setGameState('menu'); }} className="w-full py-4 md:py-6 border-2 border-white/20 text-white font-black rounded-none uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all text-xs md:text-base">Menu</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div id="camera-container">
        <div className="camera-inner">
          <video ref={videoRef} id="camera-feed" playsInline muted className={!cameraAllowed ? 'hidden' : 'block'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
    </div>
  );
};

export default App;
