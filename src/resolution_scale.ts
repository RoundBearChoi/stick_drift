import { Engine, Keys } from 'excalibur';
import { NATIVE_RESOLUTION } from './game_context';

export type ScaleMode = 'auto' | number;

/**
 * integer resolution scaling for pixel-perfect rendering.
 * f8 cycles: Auto → 1x → 2x → 3x → 4x → Auto
 */
export class ResolutionScale {
  readonly baseWidth = NATIVE_RESOLUTION.width;
  readonly baseHeight = NATIVE_RESOLUTION.height;

  private mode: ScaleMode = 'auto';
  private currentScale = 1;
  private engine: Engine | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private readonly SCALE_CYCLE: ScaleMode[] = ['auto', 1, 2, 3, 4];

  /** optional callback so on-screen debug can refresh when scale changes */
  private debugRefresh: (() => void) | null = null;

  /** call once after Engine is created */
  attach(engine: Engine): void {
    this.engine = engine;
    this.canvas = engine.canvas;

    // initial apply
    this.apply();

    // react to browser resize + Excalibur screen changes + fullscreen
    window.addEventListener('resize', () => this.apply());
    engine.screen.events.on('resize', () => this.apply());
    engine.screen.events.on('fullscreen', () => this.apply());

    // f8 cycle (temporary debug key)
    engine.input.keyboard.on('press', (evt) => {
      if (evt.key === Keys.F8) {
        this.cycleScale();
      }
    });

    console.log('[scale] resolutionScale attached (f8 to cycle)');
  }

  /**
   * let ResolutionDebug register so the label updates when scale changes.
   */
  setDebugRefresh(fn: () => void): void {
    this.debugRefresh = fn;
  }

  setMode(mode: ScaleMode): void {
    this.mode = mode;
    this.apply();
  }

  getCurrentScale(): number {
    return this.currentScale;
  }

  getMode(): ScaleMode {
    return this.mode;
  }

  getMaxPossibleScale(): number {
    return this.calculateMaxScale();
  }

  /**
   * short text for the on-screen debug label (replaces the old console log).
   */
  getDebugText(): string {
    const mode = this.mode;
    const current = this.currentScale;
    const max = this.calculateMaxScale();
    const modeLabel = mode === 'auto' ? 'AUTO' : `${mode}x`;

    const appliedW = this.baseWidth * current;
    const appliedH = this.baseHeight * current;

    //return `RESOLUTION: ${appliedW}x${appliedH} (${current}x${modeLabel})  MAX:${max}x`;
    return `RESOLUTION: ${appliedW}x${appliedH} (${modeLabel})   MAX:${max}x`;
  }

  private cycleScale(): void {
    const currentIdx = this.SCALE_CYCLE.indexOf(this.mode);
    // if mode not in list (shouldn't happen), start from beginning
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % this.SCALE_CYCLE.length;
    this.setMode(this.SCALE_CYCLE[nextIdx]);
  }

  private calculateMaxScale(): number {
    const availW = window.innerWidth;
    const availH = window.innerHeight;
    return Math.max(1, Math.floor(Math.min(availW / this.baseWidth, availH / this.baseHeight)));
  }

  private apply(): void {
    if (!this.canvas) return;

    const max = this.calculateMaxScale();
    const scale = this.mode === 'auto' ? max : Math.min(Number(this.mode), max);

    this.currentScale = scale;

    // CSS size = logical resolution × integer scale
    this.canvas.style.width = `${this.baseWidth * scale}px`;
    this.canvas.style.height = `${this.baseHeight * scale}px`;

    // expose for potential future HTML UI scaling.
    // every time integer scale changes it updates --game-scale.
    // you can then use the value anywhere in CSS or inline styles.
    document.documentElement.style.setProperty('--game-scale', String(scale));

    // keep on-screen debug label in sync (resize, f8, setMode, etc.)
    this.debugRefresh?.();
  }
}
