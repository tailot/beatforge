export class MIDIController {
  constructor(audioEngine, uiController) {
    this.audioEngine = audioEngine;
    this.uiController = uiController;
    this.midiAccess = null;
    this.midiStatus = document.getElementById('midi-status');
  }

  /**
   * Request MIDI access from browser
   */
  async init() {
    if (!navigator.requestMIDIAccess) {
      console.log('Web MIDI API not supported');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this._setupMIDIListeners();
      this.midiStatus.style.display = 'block';
      this.uiController.addLog('🎹 MIDI Connected');
      return true;
    } catch (err) {
      console.error('MIDI Request Failed:', err);
      return false;
    }
  }

  /**
   * Setup MIDI input listeners
   */
  _setupMIDIListeners() {
    const inputs = this.midiAccess.inputs.values();

    for (let input of inputs) {
      input.onmidimessage = (msg) => this._handleMIDIMessage(msg);
    }

    // Listen for new MIDI devices connected
    this.midiAccess.onstatechange = (e) => {
      if (e.port.type === 'input' && e.port.state === 'connected') {
        e.port.onmidimessage = (msg) => this._handleMIDIMessage(msg);
        this.uiController.addLog('🎹 MIDI device connected');
      }
    };
  }

  /**
   * Handle MIDI messages
   */
  _handleMIDIMessage(msg) {
    const [cmd, note, velocity] = msg.data;

    // Note ON (144 = channel 1 note on)
    if (cmd === 144 && velocity > 0) {
      this._playMIDINote(note, velocity);
    }
  }

  /**
   * Play note from MIDI
   */
  _playMIDINote(midiNote, velocity) {
    const freq = this.audioEngine.noteFreq(midiNote);
    const velocity_normalized = velocity / 127;

    // Play synth using audio engine
    this.audioEngine.playSynth(
      this.audioEngine.now(),
      freq,
      0.5,
      'sawtooth',
      velocity_normalized * 0.2,
      1200
    );

    this.uiController.addLog(`🎹 MIDI: Note ${midiNote} (vel: ${Math.round(velocity_normalized * 100)}%)`);
  }
}