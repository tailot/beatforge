import { GENRES, SECTIONS, SECTION_ENERGY, NOTE_NAMES, ROOT_MIDI, MAX_LOG_LINES } from './config.js';

export class UIController {
  constructor(beatGenerator, audioEngine) {
    this.beatGenerator = beatGenerator;
    this.audioEngine = audioEngine;
    this.vizBars = [];
    this.currentGenreKey = 'techno';
    this.sessionStats = {
      notesGenerated: 0,
      totalPlayTime: 0,
      sectionsChanged: 0
    };

    this._initElements();
    this._attachEventListeners();
    this._setupVisualization();
  }

  _initElements() {
    this.elements = {
      playBtn: document.getElementById('play-btn'),
      genreSel: document.getElementById('genre-sel'),
      bpmSpinner: document.getElementById('bpm-spinner'),
      bpmMinus: document.getElementById('bpm-minus'),
      bpmPlus: document.getElementById('bpm-plus'),
      genreDisplay: document.getElementById('genre-display'),
      keyVal: document.getElementById('key-val'),
      synthVal: document.getElementById('synth-val'),
      sectionVal: document.getElementById('section-val'),
      energyFill: document.getElementById('energy-fill'),
      noteLog: document.getElementById('note-log'),
      viz: document.getElementById('viz'),
      exportBtn: document.getElementById('export-btn'),
      durationSel: document.getElementById('duration-sel'),
      regenBtn: document.getElementById('regen-btn'),
      themeToggle: document.getElementById('theme-toggle'),
      presetName: document.getElementById('preset-name'),
      savePresetBtn: document.getElementById('save-preset-btn'),
      loadPresetBtn: document.getElementById('load-preset-btn'),
      statNotes: document.getElementById('stat-notes'),
      statTime: document.getElementById('stat-time'),
      statSections: document.getElementById('stat-sections'),
      midiStatus: document.getElementById('midi-status')
    };

    ['kick', 'snare', 'hi'].forEach(type => {
      this.elements[`beats${type}`] = document.getElementById(`beats-${type}`);
    });

    SECTIONS.forEach(section => {
      this.elements[`s${section}`] = document.getElementById(`s-${section}`);
    });
  }

  _setupVisualization() {
    for (let i = 0; i < 16; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      this.elements.viz.appendChild(bar);
      this.vizBars.push(bar);
    }

    ['kick', 'snare', 'hi'].forEach(type => {
      for (let i = 0; i < 8; i++) {
        const dot = document.createElement('div');
        dot.className = 'beat-dot' + (type === 'kick' ? ' kick' : '');
        dot.dataset.type = type;
        dot.dataset.index = i;
        this.elements[`beats${type}`].appendChild(dot);
      }
    });
  }

  _attachEventListeners() {
    this.elements.playBtn.addEventListener('click', () => this._togglePlay());
    this.elements.genreSel.addEventListener('change', (e) => {
      this.currentGenreKey = e.target.value;
      this._onGenreChange();
    });
    this.elements.bpmSpinner.addEventListener('change', (e) => this._setBpm(parseInt(e.target.value)));
    this.elements.bpmMinus.addEventListener('click', () => this._setBpm(this.beatGenerator.currentBpm - 1));
    this.elements.bpmPlus.addEventListener('click', () => this._setBpm(this.beatGenerator.currentBpm + 1));
    this.elements.exportBtn.addEventListener('click', () => this._triggerExport());
    this.elements.regenBtn.addEventListener('click', () => this._triggerVariation());
    this.elements.themeToggle.addEventListener('click', () => this._toggleTheme());
    this.elements.savePresetBtn.addEventListener('click', () => this._savePreset());
    this.elements.loadPresetBtn.addEventListener('click', () => this._loadPreset());

    ['kick', 'snare', 'hi'].forEach(type => {
      this.elements[`beats${type}`].addEventListener('click', (e) => {
        if (e.target.classList.contains('beat-dot')) {
          const index = parseInt(e.target.dataset.index);
          const currentValue = this.beatGenerator.patterns[type][index];
          this.beatGenerator.updatePattern(type, index, !currentValue);
          this._updateBeatVisuals();
          this.addLog(`✎ Edited ${type} step ${index}`);
        }
      });
    });

    this.beatGenerator.onSchedule = (type, step) => {
      this.sessionStats.notesGenerated++;
      this._updateStats();
    };
    this.beatGenerator.onStepUpdate = (s) => {
      this._updateBeatVisuals();
      this._updateVisualization();
    };
    this.beatGenerator.onSectionChange = (section, energy) => {
      this.beatGenerator.currentSection = section;
      this.sessionStats.sectionsChanged++;
      this._updateUI();
      this.addLog(`→ section: ${section}`);
      this._updateStats();
    };
  }

  _togglePlay() {
    if (!this.audioEngine.init()) return;

    if (this.beatGenerator.playing) {
      this.beatGenerator.stop();
      this.elements.playBtn.textContent = '▶ Play';
      this.elements.playBtn.className = 'play-btn start';
      this.vizBars.forEach(bar => {
        bar.style.height = '4px';
        bar.style.background = 'linear-gradient(180deg, #6060ff, #3030c0)';
      });
    } else {
      const genreConfig = GENRES[this.currentGenreKey];
      this.beatGenerator.start(this.currentGenreKey, genreConfig);
      this.elements.playBtn.textContent = '■ Stop';
      this.elements.playBtn.className = 'play-btn stop';
      this._startSessionTimer();
    }
  }

  _startSessionTimer() {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      if (!this.beatGenerator.playing) {
        clearInterval(timerInterval);
        return;
      }
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      this.elements.statTime.textContent = elapsed + 's';
    }, 100);
  }

  _setBpm(bpm) {
    this.beatGenerator.setBpm(bpm);
    this.elements.bpmSpinner.value = this.beatGenerator.currentBpm;
    this.addLog(`⏱️ Tempo: ${this.beatGenerator.currentBpm} BPM`);
  }

  _onGenreChange() {
    const genreConfig = GENRES[this.currentGenreKey];
    this.beatGenerator.loadGenre(this.currentGenreKey, genreConfig);
    this._updateUI();
    this._updateBeatVisuals();
    this.addLog(`⟳ Selected genre: ${this.currentGenreKey.replace('_', ' ')}`);
  }

  _updateUI() {
    const genreConfig = GENRES[this.currentGenreKey];
    const [, root, scale] = genreConfig;
    const rootMidi = ROOT_MIDI[root];

    const keyName = this.audioEngine.getTransposedKeyName(
      rootMidi,
      this.beatGenerator.transposition,
      this.beatGenerator.scaleModifier || scale
    );

    this.elements.genreDisplay.textContent = this.currentGenreKey.replace('_', ' ');
    this.elements.keyVal.textContent = keyName;
    this.elements.synthVal.textContent = `${genreConfig[6].toLowerCase()} + ${genreConfig[7].toLowerCase()}`;
    this.elements.sectionVal.textContent = this.beatGenerator.currentSection;
    this.elements.energyFill.style.width = (this.beatGenerator.energy * 100) + '%';

    SECTIONS.forEach(section => {
      this.elements[`s${section}`].classList.toggle('active', section === this.beatGenerator.currentSection);
    });

    this.elements.bpmSpinner.value = this.beatGenerator.currentBpm;
  }

  _updateBeatVisuals() {
    const types = ['kick', 'snare', 'hi'];
    const patterns = [
      this.beatGenerator.patterns.kick,
      this.beatGenerator.patterns.snare,
      this.beatGenerator.patterns.hihat
    ];

    types.forEach((type, ri) => {
      const dots = this.elements[`beats${type}`].querySelectorAll('.beat-dot');
      const pattern = patterns[ri];
      dots.forEach((dot, i) => {
        dot.className = 'beat-dot' + (type === 'kick' ? ' kick' : '');
        if (i === this.beatGenerator.step % 8) {
          if (pattern[i] === 1) {
            dot.classList.add(ri === 0 ? 'active-kick' : ri === 1 ? 'active-snare' : 'active-hi');
          } else {
            dot.classList.add('active-beat');
          }
        } else if (pattern[i] === 1) {
          dot.style.background = ri === 0 ? '#4a2222' : ri === 1 ? '#224a22' : '#22224a';
        } else {
          dot.style.background = '#1a1a3a';
        }
      });
    });
  }

  _updateVisualization() {
    const freqData = this.audioEngine.getFrequencyData();
    this.vizBars.forEach((bar, i) => {
      const value = freqData[i * 4] || 0;
      const h = (value / 255) * 60 + 4;
      const hue = 220 + i * 6;
      bar.style.height = h + 'px';
      bar.style.background = `hsl(${hue}, 80%, ${25 + (h / 60) * 30}%)`;
    });
  }

  _triggerVariation() {
    const transposes = [-5, -2, 0, 2, 3, 5, 7];
    const scales = ['minor', 'major', 'dorian'];
    const bassStyles = ['standard', 'straight', 'walking'];

    this.beatGenerator.setTransposition(transposes[Math.floor(Math.random() * transposes.length)]);
    this.beatGenerator.setScaleModifier(scales[Math.floor(Math.random() * scales.length)]);
    this.beatGenerator.setBassGrooveStyle(bassStyles[Math.floor(Math.random() * bassStyles.length)]);
    this.beatGenerator.setMelodyDensity(parseFloat((Math.random() * 0.6 + 0.1).toFixed(2)));

    const genreFamily = this._getGenreFamily(this.currentGenreKey);
    const archetype = this._generateRhythmArchetype(genreFamily);
    this.beatGenerator.applyVariation(archetype);

    this.addLog(`🎛️ Variation: ${this.beatGenerator.scaleModifier?.toUpperCase() || 'Minor'} (${this.beatGenerator.transposition >= 0 ? '+' : ''}${this.beatGenerator.transposition})`);
    this.addLog(`⚡ Bass: ${this.beatGenerator.bassGrooveStyle} | Melody: ${Math.round(this.beatGenerator.melodyDensity * 100)}%`);
    this._updateUI();
  }

  _getGenreFamily(genreKey) {
    const slowGenres = ['ambient', 'lofi', 'chill_trap'];
    const fastGenres = ['dnb', 'drumstep', 'dubstep', 'garage', 'trap'];
    const minimalGenres = ['minimal', 'ambient'];
    if (minimalGenres.includes(genreKey)) return 'minimal';
    if (fastGenres.includes(genreKey)) return 'fast';
    if (slowGenres.includes(genreKey)) return 'slow';
    return 'standard';
  }

  _generateRhythmArchetype(family) {
    const archetypes = {
      slow: { kick: [1,0,0,0,1,0,1,0], snare: [0,0,1,0,0,1,0,1], hihat: [0,1,0,1,0,1,1,0] },
      fast: { kick: [1,0,1,0,0,1,0,0], snare: [0,0,1,0,1,0,1,0], hihat: [1,1,0,1,1,0,1,1] },
      minimal: { kick: [1,0,0,0,0,0,0,0], snare: [0,0,1,0,0,0,0,0], hihat: [0,0,0,0,0,0,0,0] },
      standard: { kick: [1,0,0,0,1,0,1,0], snare: [0,0,1,0,0,0,1,0], hihat: [0,1,0,1,0,1,1,0] }
    };
    return archetypes[family] || archetypes.standard;
  }

  _triggerExport() {
    this.addLog('⚙️ Starting audio export...');
  }

  _toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isDark = !document.body.classList.contains('light-mode');
    this.elements.themeToggle.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('beatforge-theme', isDark ? 'dark' : 'light');
  }

  _savePreset() {
    const name = this.elements.presetName.value.trim();
    if (!name) { alert('Please enter a preset name'); return; }
    const preset = this.beatGenerator.getState();
    localStorage.setItem(`beatforge-preset-${name}`, JSON.stringify(preset));
    this.addLog(`💾 Preset saved: ${name}`);
    this.elements.presetName.value = '';
  }

  _loadPreset() {
    const name = this.elements.presetName.value.trim();
    if (!name) { alert('Please enter a preset name to load'); return; }
    const preset = localStorage.getItem(`beatforge-preset-${name}`);
    if (!preset) { alert(`Preset '${name}' not found`); return; }
    this.beatGenerator.restoreState(JSON.parse(preset));
    this._updateUI();
    this._updateBeatVisuals();
    this.addLog(`📂 Preset loaded: ${name}`);
    this.elements.presetName.value = '';
  }

  addLog(msg) {
    const line = document.createElement('div');
    line.className = 'note-line';
    line.textContent = msg;
    this.elements.noteLog.appendChild(line);
    while (this.elements.noteLog.children.length > MAX_LOG_LINES) {
      this.elements.noteLog.removeChild(this.elements.noteLog.firstChild);
    }
    this.elements.noteLog.scrollTop = this.elements.noteLog.scrollHeight;
  }

  _updateStats() {
    this.elements.statNotes.textContent = this.sessionStats.notesGenerated;
    this.elements.statSections.textContent = this.sessionStats.sectionsChanged;
  }

  init() {
    this.beatGenerator.loadGenre(this.currentGenreKey, GENRES[this.currentGenreKey]);
    this._updateUI();
    this._updateBeatVisuals();
    const savedTheme = localStorage.getItem('beatforge-theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      this.elements.themeToggle.textContent = '☀️';
    }
    this.addLog('✓ BeatForge initialized');
  }
}