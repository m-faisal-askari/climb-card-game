// Web Audio API Sound System for Climb Card Game
// Synthesizes tactile, responsive card game audio effects with zero external file dependencies.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;

    // Load persisted mute preference
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("climb_sound_muted");
        if (stored !== null) {
          this.muted = stored === "true";
        }
      } catch {
        // ignore
      }
    }
  }

  initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("climb_sound_muted", String(this.muted));
      } catch {
        // ignore
      }
    }

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime, 0.02);
    }

    if (!this.muted) {
      this.initContext();
      this.playButtonClick();
    }
  }

  // --------------------------------------------------------------------------
  // Core Sound Generators
  // --------------------------------------------------------------------------

  // Button clicked: crisp, tactile UI button click sound
  playButtonClick() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. High transient mechanical click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();

    clickOsc.type = "sine";
    clickOsc.frequency.setValueAtTime(1750, t);
    clickOsc.frequency.exponentialRampToValueAtTime(550, t + 0.022);

    clickGain.gain.setValueAtTime(0.22, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);

    clickOsc.start(t);
    clickOsc.stop(t + 0.028);

    // 2. Warm tactile pop
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();

    popOsc.type = "triangle";
    popOsc.frequency.setValueAtTime(300, t);
    popOsc.frequency.exponentialRampToValueAtTime(80, t + 0.035);

    popGain.gain.setValueAtTime(0.18, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

    popOsc.connect(popGain);
    popGain.connect(this.masterGain);

    popOsc.start(t);
    popOsc.stop(t + 0.04);
  }

  // Card select: crisp tactile tap
  playCardSelect() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.035);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // Card deselect: slightly lower, softer tap
  playCardDeselect() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.03);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Card placement: realistic card(s) landing firmly on felt table
  playCardPlacement(cardCount = 1, isJoker = false) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    if (isJoker) {
      this.playJoker();
      return;
    }

    const t = this.ctx.currentTime;
    const count = Math.min(Math.max(1, Number(cardCount) || 1), 5);

    for (let c = 0; c < count; c++) {
      const offset = c * 0.024;
      const time = t + offset;

      // 1. Paper snap transient
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.025);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2700 + c * 160, time);
      filter.Q.setValueAtTime(3.5, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      whiteNoise.start(time);
      whiteNoise.stop(time + 0.03);

      // 2. Felt surface thud
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(215 + c * 15, time);
      osc.frequency.exponentialRampToValueAtTime(60, time + 0.075);

      oscGain.gain.setValueAtTime(0.24, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.085);
    }
  }

  // Alias
  playCardPlay(isJoker = false) {
    this.playCardPlacement(1, isJoker);
  }

  // Turn pass: distinctive smooth air slide / pass sound
  playTurnPass() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.16;

    // 1. Air swoosh
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(160, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + duration + 0.01);

    // 2. Subtle descending tone to accentuate passing turn
    const toneOsc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();

    toneOsc.type = "sine";
    toneOsc.frequency.setValueAtTime(360, t);
    toneOsc.frequency.exponentialRampToValueAtTime(180, t + 0.13);

    toneGain.gain.setValueAtTime(0.12, t);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    toneOsc.connect(toneGain);
    toneGain.connect(this.masterGain);

    toneOsc.start(t);
    toneOsc.stop(t + 0.15);
  }

  // Alias
  playPass() {
    this.playTurnPass();
  }

  // Turn alert: friendly two-tone bell chime when it's the human's turn
  playYourTurn() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { freq: 659.25, time: 0, dur: 0.22, vol: 0.22 },     // E5
      { freq: 880.0, time: 0.09, dur: 0.35, vol: 0.25 },   // A5
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + time);

      gain.gain.setValueAtTime(0, t + time);
      gain.gain.linearRampToValueAtTime(vol, t + time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + time + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + time);
      osc.stop(t + time + dur + 0.01);
    });
  }

  // Error / Invalid play: gentle low negative thud
  playError() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.setValueAtTime(120, t + 0.06);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Joker play: magical shimmering chime
  playJoker() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

    arpeggio.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, t + i * 0.045);

      gain.gain.setValueAtTime(0, t + i * 0.045);
      gain.gain.linearRampToValueAtTime(0.2, t + i * 0.045 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.045);
      osc.stop(t + i * 0.045 + 0.3);
    });
  }

  // Player finished hand: bright celebration chime
  playPlayerFinished() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { freq: 783.99, time: 0, dur: 0.2 },       // G5
      { freq: 1046.5, time: 0.07, dur: 0.35 },    // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + time);

      gain.gain.setValueAtTime(0.22, t + time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + time + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + time);
      osc.stop(t + time + dur + 0.02);
    });
  }

  // Game over fanfare
  playGameOver(isWinner = false) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (isWinner) {
      // Triumphant victory fanfare: C4, G4, C5, E5, G5
      const fanfare = [
        { freq: 261.63, time: 0, dur: 0.16 },
        { freq: 392.0, time: 0.14, dur: 0.16 },
        { freq: 523.25, time: 0.28, dur: 0.22 },
        { freq: 659.25, time: 0.44, dur: 0.24 },
        { freq: 783.99, time: 0.65, dur: 0.8 },
      ];

      fanfare.forEach(({ freq, time, dur }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + time);

        gain.gain.setValueAtTime(0, t + time);
        gain.gain.linearRampToValueAtTime(0.3, t + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + time + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t + time);
        osc.stop(t + time + dur + 0.05);
      });
    } else {
      // Gentle game-complete resolution
      const notes = [
        { freq: 440.0, time: 0, dur: 0.25 },
        { freq: 349.23, time: 0.18, dur: 0.35 },
        { freq: 261.63, time: 0.36, dur: 0.6 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + time);

        gain.gain.setValueAtTime(0, t + time);
        gain.gain.linearRampToValueAtTime(0.2, t + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + time + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t + time);
        osc.stop(t + time + dur + 0.05);
      });
    }
  }
}

export const soundManager = new SoundManager();
export default soundManager;
