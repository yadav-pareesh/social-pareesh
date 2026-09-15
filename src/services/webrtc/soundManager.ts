// SoundManager: High-reliability Web Audio API sound synthesizer
// Provides zero-asset-dependency ringing, ringback, connect, and disconnect sounds.

class SoundManager {
  private ctx: AudioContext | null = null;
  private ringOscillators: OscillatorNode[] = [];
  private ringInterval: number | null = null;
  private isRinging = false;
  private isRingbacking = false;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Incoming call ringtone: Melodic dual-frequency pulsing ring
  startRingtone() {
    if (this.isRinging) return;
    this.stopAll();
    this.isRinging = true;

    try {
      const playChime = () => {
        if (!this.isRinging) return;
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;

        const playNote = (freq: number, startOffset: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + startOffset);

          gain.gain.setValueAtTime(0.001, now + startOffset);
          gain.gain.exponentialRampToValueAtTime(0.2, now + startOffset + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + startOffset);
          osc.stop(now + startOffset + duration + 0.05);
        };

        // Two-part ring pattern (440Hz / 554.37Hz / 659.25Hz harmonic major chord)
        playNote(523.25, 0.0, 0.4); // C5
        playNote(659.25, 0.15, 0.4); // E5
        playNote(783.99, 0.3, 0.6); // G5

        playNote(523.25, 0.9, 0.4); // C5
        playNote(659.25, 1.05, 0.4); // E5
        playNote(1046.5, 1.2, 0.8); // C6
      };

      playChime();
      this.ringInterval = window.setInterval(playChime, 2600);
    } catch (e) {
      console.warn('[SoundManager] Could not start ringtone:', e);
    }
  }

  // Outgoing call ringback: Standard telecom ringback (440Hz + 480Hz dual tone)
  startRingback() {
    if (this.isRingbacking) return;
    this.stopAll();
    this.isRingbacking = true;

    try {
      const playTone = () => {
        if (!this.isRingbacking) return;
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;

        [440, 480].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
          gain.gain.setValueAtTime(0.08, now + 1.6);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.85);
        });
      };

      playTone();
      this.ringInterval = window.setInterval(playTone, 4000);
    } catch (e) {
      console.warn('[SoundManager] Could not start ringback:', e);
    }
  }

  // Call connected tone: brief cheerful double-beep
  playConnectedTone() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      [
        { f: 587.33, t: 0 },
        { f: 880, t: 0.12 },
      ].forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.001, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.15, now + note.t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + 0.12);
      });
    } catch {
      // AudioContext might not be ready; ignore
    }
  }

  // Call disconnected / failed tone: brief descending tone
  playEndedTone() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      [
        { f: 440, t: 0 },
        { f: 330, t: 0.14 },
      ].forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.001, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.15, now + note.t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + 0.18);
      });
    } catch {
      // AudioContext might not be ready; ignore
    }
  }

  stopAll() {
    this.isRinging = false;
    this.isRingbacking = false;
    if (this.ringInterval !== null) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    this.ringOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
    });
    this.ringOscillators = [];
  }
}

export const soundManager = new SoundManager();
