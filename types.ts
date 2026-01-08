export interface Mission {
  name: string;
  objective: string;
}

export interface HandCursor {
  x: number;
  y: number;
  visible: boolean;
  pinched: boolean;
  id: number;
}

export interface PinchTrigger {
  x: number;
  y: number;
  active: boolean;
  id: number;
}

export interface HitText {
  x: number;
  y: number;
  text: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type ControlMode = 'one-hand' | 'two-hands';
export type ShootStyle = 'pinch' | 'gun' | 'tap';

declare global {
  interface Window {
    THREE: any;
    Hands: any;
    Camera: any;
    webkitAudioContext: any;
  }
}