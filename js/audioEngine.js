import { AUDIO_PARAMS, ROOT_MIDI, SCALES, NOTE_NAMES } from './config.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.analyser = null;
    this.frequencyData = null;
  }

  /**
   * Initialize Web Audio Context with master chain
   */
  init() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this._setupMasterChain();
      return true;
    } catch (err) {
      console.error('Web Audio Context initialization failed:', err);
      alert('Web Audio API not supported in this browser.');
      return false;
    }
  }

  /**
   * Setup master compression and gain chain
   */
  _setupMasterChain() {
    // Compressor for dynamic range control
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.ratio.value = 4;
    this.compressor.knee.value = 30;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    // Analyser for visualization
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    // Connect chain: masterGain → compressor → analyser → destination
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  /**
   * Get audio output for visualization
   */
  getFrequencyData() {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    return new Uint8Array(128);
  }

  /**
   * Convert MIDI note number to frequency in Hz
   */
  noteFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Get scale notes with transposition applied
   */
  getScaleNotes(root, scale, octave = 4, transposition = 0) {
    const base = ROOT_MIDI[root] + (octave - 4) * 12 + transposition;
    const scaleIntervals = SCALES[scale] || SCALES.minor;
    return scaleIntervals.map(interval => base + interval);
  }

  /**
   * Get transposed key name
   */
  getTransposedKeyName(rootMidi, transposition, scale) {
    const transposedMidi = rootMidi + transposition;
    const noteName = NOTE_NAMES[transposedMidi % 12];
    const scaleSuffix = scale === 'minor' ? 'min' : scale === 'major' ? 'maj' : scale;
    return `${noteName} ${scaleSuffix}`;
  }

  /**
   * Kick drum synth
   */
  playKick(time) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.masterGain);

    o.frequency.setValueAtTime(150, time);
    o.frequency.exponentialRampToValueAtTime(0.01, time + 0.25);
    g.gain.setValueAtTime(1.0, time);
    g.gain.linearRampToValueAtTime(1.0, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    o.start(time);
    o.stop(time + AUDIO_PARAMS.KICK_DURATION);
  }

  /**
   * Snare drum (noise-based)
   */
  playSnare(time) {
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }

    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();

    f.type = 'bandpass';
    f.frequency.value = 1800;
    f.Q.value = 1.0;

    src.buffer = buf;
    src.connect(f);
    f.connect(g);
    g.connect(this.masterGain);

    g.gain.setValueAtTime(0.6, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    src.start(time);
    src.stop(time + AUDIO_PARAMS.SNARE_DURATION);
  }

  /**
   * High-hat (filtered noise)
   */
  playHihat(time, energy = 0.5) {
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }

    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();

    f.type = 'highpass';
    f.frequency.value = 9000;

    src.buffer = buf;
    src.connect(f);
    f.connect(g);
    g.connect(this.masterGain);

    g.gain.setValueAtTime(0.25 * energy, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    src.start(time);
    src.stop(time + AUDIO_PARAMS.HIHAT_DURATION);
  }

  /**
   * Polyphonic synth note
   */
  playSynth(time, freq, duration, type = 'sine', amp = 0.2, cutoff = 800) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();

    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, time);

    o.type = type;
    o.frequency.setValueAtTime(freq, time);

    o.connect(f);
    f.connect(g);
    g.connect(this.masterGain);

    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(amp, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);

    o.start(time);
    o.stop(time + duration + 0.05);
  }

  /**
   * Chord synth with dynamic intervals
   */
  playChord(time, genreConfig, section, energy = 0.5) {
    const [, root, scale] = genreConfig;
    const notes = this.getScaleNotes(root, scale, 3);

    // Dynamic intervals based on section
    const intervals = section === 'drop' 
      ? [0, 3, 7]
      : section === 'build'
      ? [0, 4, 7]
      : [0, 3, 7];

    intervals.forEach(interval => {
      const noteIdx = interval % notes.length;
      this.playSynth(
        time,
        this.noteFreq(notes[noteIdx]),
        AUDIO_PARAMS.CHORD_DURATION,
        'sawtooth',
        0.08 * energy,
        section === 'drop' ? 1400 : 700
      );
    });
  }

  /**
   * Melody note generator
   */
  playMelodyNote(time, genreConfig, section, energy = 0.5, noteIndex = null) {
    const [, root, scale] = genreConfig;
    const notes = this.getScaleNotes(root, scale, 5);
    const note = noteIndex !== null ? notes[noteIndex % notes.length] : notes[Math.floor(Math.random() * notes.length)];
    const type = section === 'drop' ? 'sawtooth' : 'sine';

    this.playSynth(
      time,
      this.noteFreq(note),
      AUDIO_PARAMS.SYNTH_NOTE_DURATION,
      type,
      0.15 * energy,
      1800
    );
  }

  /**
   * Bassline with style variation
   */
  playBass(time, genreConfig, energy = 0.5, step = 0, style = 'standard', transposition = 0, noteIndex = null) {
    const [, root, scale] = genreConfig;
    const notes = this.getScaleNotes(root, scale, 2, transposition);

    let note;
    if (noteIndex !== null) {
      note = notes[noteIndex % notes.length];
    } else if (style === 'straight') {
      note = notes[0];
    } else if (style === 'walking') {
      note = notes[step % notes.length];
    } else {
      note = notes[Math.floor(Math.random() * 2)];
    }

    this.playSynth(
      time,
      this.noteFreq(note),
      AUDIO_PARAMS.BASS_NOTE_DURATION,
      'sawtooth',
      0.35 * energy,
      450
    );
  }

  /**
   * Offline rendering (for export)
   */
  createOfflineContext(duration, sampleRate = 44100) {
    try {
      return new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
        2,
        sampleRate * duration,
        sampleRate
      );
    } catch (err) {
      console.error('Offline audio context creation failed:', err);
      return null;
    }
  }

  /**
   * Get current audio context time
   */
  now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /**
   * Suspend audio context
   */
  suspend() {
    if (this.ctx && this.ctx.suspend) {
      this.ctx.suspend();
    }
  }

  /**
   * Vocal synthesis using Web Speech API
   */
  speak(word, freq) {
    if (!window.speechSynthesis) return;

    // Use a fresh utterance
    const utterance = new SpeechSynthesisUtterance(word);

    // Map frequency to pitch (0.1 - 2.0 range)
    // Assuming 220Hz as a baseline for pitch 1.0
    const baseFreq = 220;
    utterance.pitch = Math.max(0.1, Math.min(2.0, freq / baseFreq));
    utterance.rate = 1.2; // Slightly faster to keep up with tempo
    utterance.volume = 0.7;

    // Note: SpeechSynthesis is not perfectly synced with Web Audio time
    window.speechSynthesis.speak(utterance);
  }
}