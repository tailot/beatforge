export class ExportService {
  /**
   * Render audio offline and export as WAV
   */
  static async exportToWav(beatGenerator, audioEngine, duration, onProgress) {
    return new Promise((resolve, reject) => {
      try {
        const offlineCtx = audioEngine.createOfflineContext(duration);
        if (!offlineCtx) {
          reject(new Error('Offline context not supported'));
          return;
        }

        const genreConfig = [beatGenerator.currentBpm, 'A', 'minor', [], [], [], 'Saw', 'TB303'];
        const secondsPerBeat = 60 / beatGenerator.currentBpm;
        const sixteenthDuration = 0.25 * secondsPerBeat;

        let offlineTime = 0;
        let offlineStep = 0;
        const totalSteps = Math.ceil(duration / sixteenthDuration);

        // Create master chain for offline context
        const masterGain = offlineCtx.createGain();
        masterGain.connect(offlineCtx.destination);

        // Simulate playback in offline context
        while (offlineTime < duration) {
          const s = offlineStep % 8;

          // Play drums with offline context
          if (beatGenerator.patterns.kick[s] === 1) {
            this._playKickOffline(offlineCtx, masterGain, offlineTime);
          }
          if (beatGenerator.patterns.snare[s] === 1) {
            this._playSnareOffline(offlineCtx, masterGain, offlineTime);
          }
          if (beatGenerator.patterns.hihat[s] === 1) {
            this._playHihatOffline(offlineCtx, masterGain, offlineTime, 0.5);
          }

          // Play synths
          if (s === 0) {
            this._playChordOffline(offlineCtx, masterGain, offlineTime, genreConfig, 0.5);
          }
          if (s % 2 === 0) {
            this._playBassOffline(
              offlineCtx,
              masterGain,
              offlineTime,
              genreConfig,
              0.5,
              offlineStep,
              beatGenerator.bassGrooveStyle,
              beatGenerator.transposition
            );
          }
          if (Math.random() < beatGenerator.melodyDensity) {
            this._playMelodyOffline(offlineCtx, masterGain, offlineTime, genreConfig, 0.5);
          }

          offlineTime += sixteenthDuration;
          offlineStep++;

          if (onProgress) {
            onProgress(offlineStep / totalSteps);
          }
        }

        // Render offline
        offlineCtx.startRendering().then(renderedBuffer => {
          const blob = this._bufferToWav(renderedBuffer);
          resolve(blob);
        }).catch(reject);

      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Convert AudioBuffer to WAV blob
   */
  static _bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const resultLength = buffer.length * numOfChan * 2 + 44;
    const arrayBuffer = new ArrayBuffer(resultLength);
    const view = new DataView(arrayBuffer);
    const channels = [];

    let offset = 0;
    let pos = 0;

    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(resultLength - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(format);
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * numOfChan * (bitDepth / 8));
    setUint16(numOfChan * (bitDepth / 8));
    setUint16(bitDepth);
    setUint32(0x61746164); // "data"
    setUint32(buffer.length * numOfChan * 2);

    // Get channel data
    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }

    // Interleave samples
    while (pos < resultLength) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  static _playKickOffline(ctx, masterGain, t) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(masterGain);
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(0.01, t + 0.25);
    g.gain.setValueAtTime(1.0, t);
    g.gain.linearRampToValueAtTime(1.0, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.start(t);
    o.stop(t + 0.26);
  }

  static _playSnareOffline(ctx, masterGain, t) {
    const bufferSize = ctx.sampleRate * 0.12;
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1800;
    f.Q.value = 1.0;
    src.buffer = buf;
    src.connect(f);
    f.connect(g);
    g.connect(masterGain);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.start(t);
    src.stop(t + 0.13);
  }

  static _playHihatOffline(ctx, masterGain, t, energy) {
    const bufferSize = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 9000;
    src.buffer = buf;
    src.connect(f);
    f.connect(g);
    g.connect(masterGain);
    g.gain.setValueAtTime(0.25 * energy, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.start(t);
    src.stop(t + 0.05);
  }

  static _playSynthOffline(ctx, masterGain, t, freq, dur, type = 'sine', amp = 0.2, cutoff = 800) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.connect(f);
    f.connect(g);
    g.connect(masterGain);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  static _playChordOffline(ctx, masterGain, t, genreConfig, energy) {
    const notes = [69, 73, 76];
    notes.forEach(note => {
      const freq = 440 * Math.pow(2, (note - 69) / 12);
      this._playSynthOffline(ctx, masterGain, t, freq, 0.7, 'sawtooth', 0.08 * energy, 700);
    });
  }

  static _playMelodyOffline(ctx, masterGain, t, genreConfig, energy) {
    const notes = [69, 71, 73, 76];
    const note = notes[Math.floor(Math.random() * notes.length)];
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    this._playSynthOffline(ctx, masterGain, t, freq, 0.15, 'sine', 0.15 * energy, 1800);
  }

  static _playBassOffline(ctx, masterGain, t, genreConfig, energy, step, style, transposition) {
    const notes = [45, 48];
    let note = notes[0];
    if (style === 'straight') {
      note = notes[0];
    } else if (style === 'walking') {
      note = notes[step % notes.length];
    } else {
      note = notes[Math.floor(Math.random() * 2)];
    }
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    this._playSynthOffline(ctx, masterGain, t, freq, 0.2, 'sawtooth', 0.35 * energy, 450);
  }
}