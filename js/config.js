// Genre definitions: [BPM, Key, Scale, KickPattern, SnarePattern, HihatPattern, Synth1, Synth2]
export const GENRES = {
  techno:     [130, 'A', 'minor',   [1,0,0,0,1,0,0,0], [0,0,1,0,0,0,1,0], [0,1,0,1,0,1,0,1], 'Saw', 'TB303'],
  dnb:        [172, 'E', 'minor',   [1,0,0,1,0,0,0,0], [0,0,0,0,1,0,0,0], [1,1,1,1,1,1,1,1], 'Prophet', 'Subpulse'],
  ambient:    [70,  'C', 'major',   [1,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], 'Hollow', 'FM'],
  lofi:       [85,  'D', 'minor',   [1,0,0,0,1,0,0,0], [0,0,0,0,1,0,0,0], [0,0,1,0,0,0,1,0], 'Blade', 'Chipbass'],
  trance:     [140, 'F', 'minor',   [1,0,0,0,1,0,0,0], [0,0,0,0,1,0,0,0], [1,1,1,1,1,1,1,1], 'Prophet', 'Saw'],
  deep_house: [120, 'G', 'dorian',  [1,0,0,0,1,0,0,0], [0,0,0,0,1,0,0,0], [0,1,0,1,0,1,0,1], 'Saw', 'FM'],
  synthwave:  [110, 'C', 'minor',   [1,0,0,0,1,0,0,0], [0,0,1,0,0,0,1,0], [0,0,0,0,1,1,1,1], 'Prophet', 'FM'],
  reggaeton:  [95,  'A', 'minor',   [1,0,1,0,1,0,0,0], [0,0,0,1,0,0,1,0], [1,1,1,1,1,1,1,1], 'Prophet', 'Chipbass'],
  garage:     [135, 'E', 'minor',   [1,0,0,0,0,0,1,0], [0,0,0,0,1,0,0,0], [0,1,0,1,0,1,0,1], 'Blade', 'TB303'],
  trap:       [140, 'C', 'minor',   [1,0,0,0,1,0,0,0], [0,0,0,1,0,0,0,0], [1,1,1,1,1,1,1,1], 'Saw', 'Subpulse'],
  disco:      [122, 'C', 'major',   [1,0,0,1,1,0,0,1], [0,0,1,0,0,0,1,0], [1,0,1,0,1,0,1,0], 'Saw', 'FM'],
  dubstep:    [140, 'C', 'minor',   [1,0,0,0,1,0,0,0], [0,0,0,0,1,0,0,0], [0,0,0,0,1,1,1,1], 'Prophet', 'Subpulse'],
  funk:       [110, 'E', 'dorian',  [1,0,1,0,0,0,1,0], [0,0,0,0,1,0,0,0], [0,1,0,1,0,1,0,1], 'TB303', 'Chipbass'],
  drumstep:   [160, 'F', 'minor',   [1,0,0,0,1,0,0,0], [0,0,0,0,1,0,0,0], [0,1,1,1,0,1,1,1], 'Saw', 'Subpulse'],
  chill_trap: [70,  'C', 'minor',   [1,0,0,0,1,0,0,0], [0,0,0,1,0,0,0,0], [0,0,1,1,0,0,1,1], 'Hollow', 'FM'],
  minimal:    [128, 'A', 'minor',   [1,0,0,1,0,0,0,0], [0,0,0,0,1,0,0,0], [0,0,0,0,0,0,0,0], 'TB303', 'Blade'],
  classical:  [70,  'C', 'major',   [1,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], 'Hollow', 'FM'],
  rock:       [110, 'E', 'minor',   [1,0,0,0,1,0,0,0], [0,0,1,0,0,0,1,0], [1,0,1,0,1,0,1,0], 'Saw', 'Prophet']
};

export const SCALES = {
  major:  [0,2,4,5,7,9,11],
  minor:  [0,2,3,5,7,8,10],
  dorian: [0,2,3,5,7,9,10]
};

export const ROOT_MIDI = { 
  C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71 
};

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export const SECTIONS = ['intro', 'groove', 'build', 'drop'];

export const SECTION_ENERGY = { 
  intro: 0.3, 
  groove: 0.6, 
  build: 0.6, 
  drop: 1.0 
};

export const AUDIO_PARAMS = {
  LOOKAHEAD_MS: 25,
  SCHEDULE_AHEAD_TIME: 0.1,
  KICK_DURATION: 0.26,
  SNARE_DURATION: 0.13,
  HIHAT_DURATION: 0.05,
  SYNTH_NOTE_DURATION: 0.15,
  BASS_NOTE_DURATION: 0.2,
  CHORD_DURATION: 0.7,
  MIN_BPM: 50,
  MAX_BPM: 220,
  DEFAULT_BPM: 130
};

export const RHYTHM_ARCHETYPES = {
  slow_techno: {
    kick: [1, 0, 0, 1, 0, 0, 1, 0],
    snare: [0, 0, 1, 0, 0, 1, 0, 1],
    hihat: [1, 0, 1, 0, 1, 1, 0, 1]
  },
  fast_dnb: {
    kick: [1, 0, 1, 0, 0, 1, 0, 0],
    snare: [0, 0, 1, 0, 1, 0, 1, 0],
    hihat: [1, 1, 0, 1, 1, 0, 1, 1]
  },
  minimal: {
    kick: [1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    hihat: [0, 0, 0, 0, 0, 0, 0, 0]
  },
  punchy: {
    kick: [1, 0, 0, 0, 0, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 1]
  }
};

export const TRANSPOSITION_OPTIONS = [-5, -2, 0, 2, 3, 5, 7];

export const SCALE_OPTIONS = ['minor', 'major', 'dorian'];

export const BASS_GROOVE_STYLES = ['standard', 'straight', 'walking'];

export const MELODY_DENSITY_RANGE = { min: 0.1, max: 0.7 };

export const BPM_VARIATION_RANGE = 15; // ±15 BPM

export const MAX_LOG_LINES = 20;

export const STORAGE_KEYS = {
  STATE: 'beatforge-state',
  PRESET_PREFIX: 'beatforge-preset-',
  THEME: 'beatforge-theme'
};