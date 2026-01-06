
export class SoundSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private menuAudio: HTMLAudioElement | null = null;
  private gameAudio: HTMLAudioElement | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn("AudioContext initialization failed:", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(err => console.error("Could not resume AudioContext", err));
    }
    this.isUnlocked = true;
  }

  private setupAudioElement(url: string): HTMLAudioElement {
    const audio = new Audio(url);
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    
    // Only attempt to create media element source if context is valid
    if (this.ctx && this.masterGain) {
      try {
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.masterGain);
      } catch (e) {
        console.warn("BGM routing failed (CORS or already connected), playing via direct output.", e);
      }
    }
    return audio;
  }

  public async loadMenuBGM(url: string) {
    if (this.menuAudio) this.menuAudio.pause();
    this.menuAudio = this.setupAudioElement(url);
    return this.waitForLoad(this.menuAudio);
  }

  public async loadGameBGM(url: string) {
    if (this.gameAudio) this.gameAudio.pause();
    this.gameAudio = this.setupAudioElement(url);
    return this.waitForLoad(this.gameAudio);
  }

  private waitForLoad(audio: HTMLAudioElement): Promise<boolean> {
    return new Promise((resolve) => {
      audio.oncanplaythrough = () => resolve(true);
      audio.onerror = () => resolve(false);
      setTimeout(() => resolve(true), 3000);
    });
  }

  startMenuBGM() {
    this.resume();
    if (this.gameAudio) this.gameAudio.pause();
    if (this.menuAudio) {
      this.menuAudio.volume = 0.5;
      this.menuAudio.play().catch(e => console.warn("Menu BGM play failed:", e));
    }
  }

  startBGM() {
    this.resume();
    if (this.menuAudio) this.menuAudio.pause();
    if (this.gameAudio) {
      this.gameAudio.volume = 0.8;
      this.gameAudio.play().catch(e => console.warn("Game BGM play failed:", e));
    }
  }

  stopBGM() {
    if (this.menuAudio) this.menuAudio.pause();
    if (this.gameAudio) this.gameAudio.pause();
  }

  playClick() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playHover() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.03);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  playMenuMove() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playLaser() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playHit() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playExplosion() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    noise.connect(noiseFilter);
    noiseFilter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playStart() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}
