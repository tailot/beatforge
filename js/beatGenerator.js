import { SECTIONS, SECTION_ENERGY, AUDIO_PARAMS } from './config.js';

export class BeatGenerator {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.playing = false;
    this.step = 0;
    this.directorCount = 0;
    this.nextNoteTime = 0;
    this.timerId = null;

    // State
    this.currentGenre = null;
    this.currentSection = 'intro';
    this.energy = 0.3;
    this.root = 'A';
    this.scale = 'minor';
    this.synth1 = 'Saw';
    this.synth2 = 'TB303';

    // Patterns
    this.patterns = {
      kick: [],
      snare: [],
      hihat: [],
      bass: [],
      melody: []
    };

    // Modifiers
    this.transposition = 0;
    this.scaleModifier = null;
    this.bassGrooveStyle = 'standard';
    this.melodyDensity = 0.35;
    this.currentBpm = 130;

    // Callbacks
    this.onSchedule = null;
    this.onStepUpdate = null;
    this.onSectionChange = null;
  }

  /**
   * Load genre patterns and initialize parameters
   */
  loadGenre(genreKey, genreConfig) {
    this.currentGenre = genreKey;
    const [bpm, root, scale, kick, snare, hihat, synth1, synth2] = genreConfig;

    this.patterns.kick = [...kick];
    this.patterns.snare = [...snare];
    this.patterns.hihat = [...hihat];

    this.currentBpm = bpm;
    this.root = root;
    this.scale = scale;
    this.synth1 = synth1;
    this.synth2 = synth2;
    this.transposition = 0;
    this.scaleModifier = null;
    this.bassGrooveStyle = 'standard';
    this.melodyDensity = 0.35;

    this._generateMelodicPatterns();
  }

  /**
   * Start playback
   */
  start(genreKey, genreConfig) {
    if (this.playing) return;

    this.playing = true;
    this.step = 0;
    this.directorCount = 0;
    this.currentSection = 'intro';
    this.energy = SECTION_ENERGY['intro'];

    this.loadGenre(genreKey, genreConfig);
    this.nextNoteTime = this.audioEngine.now() + 0.05;

    this._scheduler();
  }

  /**
   * Stop playback
   */
  stop() {
    this.playing = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Scheduler loop (high-resolution)
   */
  _scheduler() {
    const secondsPerBeat = 60 / this.currentBpm;
    const sixteenthNoteDuration = 0.25 * secondsPerBeat;

    while (this.nextNoteTime < this.audioEngine.now() + AUDIO_PARAMS.SCHEDULE_AHEAD_TIME) {
      this._scheduleNote(this.step, this.nextNoteTime);
      this.nextNoteTime += sixteenthNoteDuration;
      this.step++;
    }

    if (this.playing) {
      this.timerId = setTimeout(() => this._scheduler(), AUDIO_PARAMS.LOOKAHEAD_MS);
    }
  }

  /**
   * Schedule individual note events
   */
  _scheduleNote(stepNumber, time) {
    const s = stepNumber % 8;
    const delay = (time - this.audioEngine.now()) * 1000;

    // "velocità bassa" for specific genres
    const isQuietGenre = ['classical', 'rock'].includes(this.currentGenre);
    const effectiveEnergy = isQuietGenre ? this.energy * 0.6 : this.energy;

    // Play drums
    if (this.patterns.kick[s] === 1) this.audioEngine.playKick(time);
    if (this.patterns.snare[s] === 1) this.audioEngine.playSnare(time);
    if (this.patterns.hihat[s] === 1) this.audioEngine.playHihat(time, effectiveEnergy);

    // Play synths
    if (s === 0) {
      this.audioEngine.playChord(time, this._genreConfig(), this.currentSection, effectiveEnergy);
      if (this.onSchedule) {
        setTimeout(() => this.onSchedule('chord', s), delay);
      }
    }

    const shouldPlayBass = isQuietGenre ? (this.patterns.bass[s] !== null) : (s % 2 === 0);
    if (shouldPlayBass) {
      this.audioEngine.playBass(
        time,
        this._genreConfig(),
        effectiveEnergy,
        this.step,
        this.bassGrooveStyle,
        this.transposition,
        this.bassGrooveStyle === 'standard' ? this.patterns.bass[s] : null
      );
    }

    if (this.patterns.melody[s] !== null) {
      this.audioEngine.playMelodyNote(
        time,
        this._genreConfig(),
        this.currentSection,
        effectiveEnergy,
        this.patterns.melody[s]
      );
    }

    // Section director
    this.directorCount++;
    if (this.directorCount % 32 === 0) {
      const idx = Math.floor(this.directorCount / 32) % SECTIONS.length;
      const newSection = SECTIONS[idx];
      this.currentSection = newSection;
      this.energy = SECTION_ENERGY[newSection];

      if (this.onSectionChange) {
        setTimeout(() => this.onSectionChange(newSection, this.energy), delay);
      }
    }

    // UI update callback
    if (this.onStepUpdate) {
      setTimeout(() => this.onStepUpdate(s), delay);
    }
  }

  /**
   * Get current genre config from state
   */
  _genreConfig() {
    return [
      this.currentBpm,
      this.root,
      this.scaleModifier || this.scale,
      [], [], [],
      this.synth1,
      this.synth2
    ];
  }

  /**
   * Apply rhythm variation
   */
  applyVariation(rhythmArchetype) {
    if (rhythmArchetype) {
      this.patterns.kick = [...rhythmArchetype.kick];
      this.patterns.snare = [...rhythmArchetype.snare];
      this.patterns.hihat = [...rhythmArchetype.hihat];
    }
    this._generateMelodicPatterns();
  }

  /**
   * Generate coherent 8-step patterns for bass and melody
   */
  _generateMelodicPatterns() {
    this.patterns.bass = Array(8).fill(null);
    this.patterns.melody = Array(8).fill(null);

    if (['classical', 'rock'].includes(this.currentGenre)) {
      const groupCounts = [2, 3, 4];
      const count = groupCounts[Math.floor(Math.random() * groupCounts.length)];
      let steps = [0, 4]; // 2 groups
      if (count === 3) steps = [0, 3, 6];
      if (count === 4) steps = [0, 2, 4, 6];

      steps.forEach(s => {
        this.patterns.bass[s] = Math.floor(Math.random() * 2);
        this.patterns.melody[s] = Math.floor(Math.random() * 7);
      });
    } else {
      for (let i = 0; i < 8; i++) {
        // Bass pattern (indices 0 or 1 of the scale)
        this.patterns.bass[i] = Math.floor(Math.random() * 2);

        // Melody pattern (note index or null)
        if (Math.random() < this.melodyDensity) {
          this.patterns.melody[i] = Math.floor(Math.random() * 7);
        }
      }
    }
  }

  /**
   * Update BPM
   */
  setBpm(bpm) {
    this.currentBpm = Math.max(AUDIO_PARAMS.MIN_BPM, Math.min(AUDIO_PARAMS.MAX_BPM, bpm));
  }

  /**
   * Set transposition (semitones)
   */
  setTransposition(semitones) {
    this.transposition = semitones;
  }

  /**
   * Set scale modifier
   */
  setScaleModifier(scale) {
    this.scaleModifier = scale;
  }

  /**
   * Set bass groove style
   */
  setBassGrooveStyle(style) {
    this.bassGrooveStyle = style;
  }

  /**
   * Set melody density
   */
  setMelodyDensity(density) {
    this.melodyDensity = Math.max(0.1, Math.min(0.7, density));
  }

  /**
   * Update pattern (for editing)
   */
  updatePattern(type, index, value) {
    if (this.patterns[type] && index < 8) {
      this.patterns[type][index] = value ? 1 : 0;
    }
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return {
      currentGenre: this.currentGenre,
      currentBpm: this.currentBpm,
      transposition: this.transposition,
      scaleModifier: this.scaleModifier,
      bassGrooveStyle: this.bassGrooveStyle,
      melodyDensity: this.melodyDensity,
      patterns: JSON.parse(JSON.stringify(this.patterns))
    };
  }

  /**
   * Restore state
   */
  restoreState(state) {
    if (state.currentBpm) this.currentBpm = state.currentBpm;
    if (state.transposition !== undefined) this.transposition = state.transposition;
    if (state.scaleModifier) this.scaleModifier = state.scaleModifier;
    if (state.bassGrooveStyle) this.bassGrooveStyle = state.bassGrooveStyle;
    if (state.melodyDensity) this.melodyDensity = state.melodyDensity;
    if (state.patterns) {
      this.patterns = JSON.parse(JSON.stringify(state.patterns));
    }
  }
}