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

    // Patterns
    this.patterns = {
      kick: [],
      snare: [],
      hihat: []
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
    const [bpm, , , kick, snare, hihat] = genreConfig;

    this.patterns.kick = [...kick];
    this.patterns.snare = [...snare];
    this.patterns.hihat = [...hihat];

    this.currentBpm = bpm;
    this.transposition = 0;
    this.scaleModifier = null;
    this.bassGrooveStyle = 'standard';
    this.melodyDensity = 0.35;
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

    // Play drums
    if (this.patterns.kick[s] === 1) this.audioEngine.playKick(time);
    if (this.patterns.snare[s] === 1) this.audioEngine.playSnare(time);
    if (this.patterns.hihat[s] === 1) this.audioEngine.playHihat(time, this.energy);

    // Play synths
    if (s === 0) {
      this.audioEngine.playChord(time, this._genreConfig(), this.currentSection, this.energy);
      if (this.onSchedule) {
        setTimeout(() => this.onSchedule('chord', s), delay);
      }
    }

    if (s % 2 === 0) {
      this.audioEngine.playBass(
        time,
        this._genreConfig(),
        this.energy,
        this.step,
        this.bassGrooveStyle,
        this.transposition
      );
    }

    if (Math.random() < this.melodyDensity) {
      this.audioEngine.playMelodyNote(time, this._genreConfig(), this.currentSection, this.energy);
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
    return [this.currentBpm, 'A', 'minor', [], [], [], 'Saw', 'TB303'];
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