
import React, { useEffect, useRef } from 'react';
import { SoundSynth } from '../services/soundService';
import { PinchTrigger, Difficulty, ControlMode } from '../types';

interface GameProps {
  onScore: (position: any) => void;
  onMiss: () => void;
  onGameOver: () => void;
  isActive: boolean;
  externalTriggers: PinchTrigger[];
  difficulty: Difficulty;
  controlMode: ControlMode;
  combo: number;
}

const Game: React.FC<GameProps> = ({ onScore, onMiss, onGameOver, isActive, externalTriggers, difficulty, controlMode, combo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SoundSynth | null>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const targetsRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const motesRef = useRef<any[]>([]);
  const frameIdRef = useRef<number | null>(null);
  const raycasterRef = useRef<any>(null);
  const mouseRef = useRef<any>(null);
  const lastSpawnRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const slowMoEndTimeRef = useRef<number>(0);
  const SLOW_MO_DURATION = 2000;
  const SLOW_MO_MIN_SCALE = 0.25;

  const activeRef = useRef(isActive);
  const onScoreRef = useRef(onScore);
  const onMissRef = useRef(onMiss);
  const comboRef = useRef(combo);
  const prevTriggersRef = useRef<Record<number, boolean>>({});

  useEffect(() => { activeRef.current = isActive; }, [isActive]);
  useEffect(() => { onScoreRef.current = onScore; }, [onScore]);
  useEffect(() => { onMissRef.current = onMiss; }, [onMiss]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  useEffect(() => {
    externalTriggers.forEach(trigger => {
      const wasActive = prevTriggersRef.current[trigger.id] || false;
      if (trigger.active && !wasActive) {
        handleFire(trigger.x, trigger.y);
      }
      prevTriggersRef.current[trigger.id] = trigger.active;
    });
  }, [externalTriggers]);

  const createExplosion = (position: any, scale: number = 1) => {
    const THREE = window.THREE;
    if (!THREE || !sceneRef.current) return;
    
    const particleCount = Math.floor(15 * scale);
    const geo = new THREE.PlaneGeometry(0.5, 0.5);
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 25, 
        (Math.random() - 0.5) * 25, 
        (Math.random() - 0.5) * 25
      );
      sceneRef.current.add(mesh);
      particlesRef.current.push({ mesh, velocity, life: 1.0 });
    }
  };

  const handleFire = (screenX: number, screenY: number) => {
    const THREE = window.THREE;
    if (!THREE || !activeRef.current || !sceneRef.current || !cameraRef.current || !mouseRef.current || !raycasterRef.current) return;

    if (synthRef.current) synthRef.current.playLaser();
    
    mouseRef.current.x = (screenX * 2) - 1;
    mouseRef.current.y = -(screenY * 2) + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const ray = raycasterRef.current.ray;
    let bestHit: any = null;
    let minDistance = Infinity;

    const baseHitRadius = 5.0; 

    targetsRef.current.forEach((group, index) => {
      const targetPos = new THREE.Vector3();
      group.getWorldPosition(targetPos);
      
      const vecToTarget = new THREE.Vector3().subVectors(targetPos, ray.origin);
      const directionDistance = vecToTarget.dot(ray.direction);
      
      if (directionDistance > 0) {
        const closestPointOnRay = new THREE.Vector3().copy(ray.origin).add(ray.direction.clone().multiplyScalar(directionDistance));
        const distToRay = closestPointOnRay.distanceTo(targetPos);
        
        const targetScale = group.scale.x;
        const distToCam = Math.abs(targetPos.z - cameraRef.current.position.z);
        
        const scaledHitRadius = baseHitRadius * (Math.max(10, distToCam) / 50) * targetScale * 2.0;
        
        if (distToRay < scaledHitRadius) {
          if (directionDistance < minDistance) {
            minDistance = directionDistance;
            bestHit = { object: group, index: index };
          }
        }
      }
    });

    if (bestHit) {
      if (comboRef.current > 0) {
        slowMoEndTimeRef.current = Date.now() + SLOW_MO_DURATION;
      }

      createExplosion(bestHit.object.position, bestHit.object.scale.x);
      sceneRef.current.remove(bestHit.object);
      targetsRef.current.splice(bestHit.index, 1);
      onScoreRef.current(bestHit.object.position);
      if (synthRef.current) synthRef.current.playExplosion();
      lastSpawnRef.current = Date.now();
    }
  };

  useEffect(() => {
    const THREE = window.THREE;
    if (!containerRef.current || !THREE) return;

    synthRef.current = new SoundSynth();
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(85, width / height, 1, 1000);
    camera.position.set(0, 0, 50); 
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1.0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const createMote = () => {
      const moteGeo = new THREE.PlaneGeometry(0.15, 0.15);
      const moteMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.15
      });
      const mote = new THREE.Mesh(moteGeo, moteMat);
      mote.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 120,
        Math.random() * 100 - 50
      );
      scene.add(mote);
      motesRef.current.push({
          mesh: mote,
          velocity: new THREE.Vector3((Math.random()-0.5)*0.02, 0.01 + Math.random()*0.02, (Math.random()-0.5)*0.02),
          life: Math.random() * Math.PI * 2
      });
    };
    for(let i=0; i<60; i++) createMote();

    const spawnTarget = () => {
      const group = new THREE.Group();
      const bodyGroup = new THREE.Group();
      group.add(bodyGroup);

      const geo = new THREE.IcosahedronGeometry(4, 0);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.6 });
      const core = new THREE.Mesh(geo, coreMat);
      
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
      const wireframe = new THREE.LineSegments(edgeGeo, edgeMat);
      
      bodyGroup.add(core);
      bodyGroup.add(wireframe);

      const speedLinesGroup = new THREE.Group();
      group.add(speedLinesGroup);

      for (let i = 0; i < 6; i++) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, -12) 
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
        const line = new THREE.Line(lineGeo, lineMat);
        const radius = 6 + (Math.random() - 0.5) * 2;
        const angle = (i / 6) * Math.PI * 2;
        line.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -2);
        speedLinesGroup.add(line);
      }

      let minScale = 0.6, maxScale = 1.8;
      let minTime = 1.8, maxTime = 3.3;

      if (difficulty === 'medium') {
        minScale = 0.4; maxScale = 1.2;
        minTime = 1.2; maxTime = 2.2;
      } else if (difficulty === 'hard') {
        minScale = 0.12; maxScale = 0.25;
        minTime = 1.8; maxTime = 2.8; 
      }

      const randomScale = minScale + Math.random() * (maxScale - minScale);
      group.scale.set(randomScale, randomScale, randomScale);

      const startZ = -50 - Math.random() * 40;
      
      const vFOV = (camera.fov * Math.PI) / 180;
      const hAtZ = 2 * Math.tan(vFOV / 2) * Math.abs(startZ - camera.position.z);
      const wAtZ = hAtZ * camera.aspect;
      
      const startX = (Math.random() - 0.5) * wAtZ * 0.8;
      const startY = (Math.random() - 0.5) * hAtZ * 0.8;

      group.position.set(startX, startY, startZ);
      
      const distToTravel = 50 - startZ;
      const targetTime = minTime + Math.random() * (maxTime - minTime);
      const velocityZ = distToTravel / targetTime;

      group.userData = {
        velocity: new THREE.Vector3(
          -startX * (1 / targetTime), 
          -startY * (1 / targetTime), 
          velocityZ
        ),
        life: 0,
        rotateSpeed: (Math.random() - 0.5) * 0.15,
        secondaryRotateSpeed: (Math.random() - 0.5) * 0.1,
        bodyGroup: bodyGroup
      };
      
      scene.add(group);
      targetsRef.current.push(group);
    };

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = 0.016; 
      timeRef.current += delta;

      let currentTimeScale = 1.0;
      const now = Date.now();
      if (now < slowMoEndTimeRef.current) {
        const remaining = slowMoEndTimeRef.current - now;
        const progress = 1 - (remaining / SLOW_MO_DURATION);
        currentTimeScale = SLOW_MO_MIN_SCALE + (1 - SLOW_MO_MIN_SCALE) * progress;
      }
      const effectiveDelta = delta * currentTimeScale;

      if (activeRef.current) {
        const spawnDelay = (difficulty === 'easy' ? 1200 : difficulty === 'medium' ? 800 : 400);
        if (targetsRef.current.length === 0 && Date.now() - lastSpawnRef.current > spawnDelay) {
          spawnTarget();
          if (controlMode === 'two-hands') {
            spawnTarget();
          }
          lastSpawnRef.current = Date.now();
        }

        for (let i = targetsRef.current.length - 1; i >= 0; i--) {
          const target = targetsRef.current[i];
          const data = target.userData;
          data.life += effectiveDelta;
          
          target.position.x += data.velocity.x * effectiveDelta;
          target.position.y += data.velocity.y * effectiveDelta;
          target.position.z += data.velocity.z * effectiveDelta; 

          if (data.bodyGroup) {
            data.bodyGroup.rotation.z += data.rotateSpeed * currentTimeScale;
            data.bodyGroup.rotation.y += data.secondaryRotateSpeed * currentTimeScale;
            data.bodyGroup.rotation.x += (data.rotateSpeed * 0.5) * currentTimeScale;
          }
          
          if (target.position.z > 45) {
            scene.remove(target);
            targetsRef.current.splice(i, 1);
            onMissRef.current(); 
            lastSpawnRef.current = Date.now();
          }
        }
      }

      for(let mote of motesRef.current) {
          mote.mesh.position.add(mote.velocity.clone().multiplyScalar(currentTimeScale));
          mote.life += effectiveDelta;
          mote.mesh.material.opacity = (Math.sin(mote.life) + 1.2) * 0.05;
          if(mote.mesh.position.z > 60) mote.mesh.position.z = -100;
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.mesh.position.add(p.velocity.clone().multiplyScalar(effectiveDelta));
        p.life -= effectiveDelta * 1.5;
        p.mesh.material.opacity = Math.max(0, p.life);
        p.mesh.scale.multiplyScalar(0.95);
        
        if (p.life <= 0) {
          scene.remove(p.mesh);
          particlesRef.current.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      if (containerRef.current && rendererRef.current && rendererRef.current.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      targetsRef.current = [];
      particlesRef.current = [];
      motesRef.current = [];
    };
  }, [difficulty, controlMode]); 

  return <div ref={containerRef} className="absolute inset-0 pointer-events-auto z-0" id="canvas-container" />;
};

export default Game;
