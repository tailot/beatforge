import { AudioEngine } from './audioEngine.js';
import { BeatGenerator } from './beatGenerator.js';
import { UIController } from './uiController.js';
import { MIDIController } from './midiController.js';
import { StorageManager } from './storage.js';
import { ExportService } from './exportService.js';
import { GENRES } from './config.js';

class BeatForgeApp {
  constructor() {
    this.audioEngine = new AudioEngine();
    this.beatGenerator = new BeatGenerator(this.audioEngine);
    this.uiController = new UIController(this.beatGenerator, this.audioEngine);
    this.midiController = new MIDIController(this.audioEngine, this.uiController);
    this.exportService = ExportService;
  }

  async init() {
    if (!this.audioEngine.init()) {
      console.error('Audio engine initialization failed');
      return;
    }
    this.uiController.init();
    this.midiController.init().catch(err => console.log('MIDI not available:', err));
    this._setupExportHandler();
    this._loadSavedState();
    this.uiController.addLog('✓ BeatForge Ready');
  }

  _setupExportHandler() {
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', async () => {
      if (!this.audioEngine.ctx) {
        alert('Audio context not initialized');
        return;
      }
      const originalText = exportBtn.textContent;
      exportBtn.disabled = true;
      exportBtn.textContent = '⚡ Rendering...';
      try {
        const duration = parseInt(document.getElementById('duration-sel').value);
        const blob = await this.exportService.exportToWav(
          this.beatGenerator,
          this.audioEngine,
          duration,
          (progress) => { exportBtn.textContent = `⚡ ${Math.round(progress * 100)}%`; }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `beatforge-${Date.now()}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.uiController.addLog(`✅ Exported ${duration}s WAV file`);
      } catch (err) {
        console.error('Export failed:', err);
        this.uiController.addLog(`❌ Export error: ${err.message}`);
        alert('Export failed: ' + err.message);
      } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = originalText;
      }
    });
  }

  _loadSavedState() {
    const saved = StorageManager.loadState();
    if (saved) {
      this.beatGenerator.restoreState(saved);
      this.uiController._updateUI();
    }
  }

  startAutoSave() {
    setInterval(() => {
      const state = this.beatGenerator.getState();
      StorageManager.saveState(state);
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new BeatForgeApp();
  await app.init();
  app.startAutoSave();
  window.beatforgeApp = app;
});