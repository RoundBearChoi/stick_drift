import { Engine, Keys } from 'excalibur';

export type ScaleMode = 'auto' | number;

/**
 * Integer resolution scaling for pixel-perfect rendering.
 * Keeps logical resolution fixed at 640×360 and scales the
 * canvas via CSS to whole-number multiples only.
 *
 * F8 cycles: Auto → 1x → 2x → 3x → 4x → Auto
 */
export class ResolutionScale {
  readonly baseWidth = 640;
  readonly baseHeight = 360;

  private mode: ScaleMode = 'auto';
  private currentScale = 1;
  private engine: Engine | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private readonly SCALE_CYCLE: ScaleMode[] = ['auto', 1, 2, 3, 4];

  /** Call once after the Engine is created */
  attach(engine: Engine): void {
    this.engine = engine;
    this.canvas = engine.canvas;

    // Initial apply
    this.apply();

    // React to browser resize + Excalibur screen changes + fullscreen
    window.addEventListener('resize', () => this.apply());
    engine.screen.events.on('resize', () => this.apply());
    engine.screen.events.on('fullscreen', () => this.apply());

    // F8 cycle (temporary debug key)
    engine.input.keyboard.on('press', (evt) => {
      if (evt.key === Keys.F8) {
        this.cycleScale();
      }
    });

    console.log('[scale] ResolutionScale attached (F8 to cycle)');
  }

  setMode(mode: ScaleMode): void {
    this.mode = mode;
    this.apply();

    const max = this.calculateMaxScale();
    const modeLabel = mode === 'auto' ? 'Auto' : `${mode}x`;
    console.log(
      `[scale] mode: ${modeLabel}  →  applied: ${this.currentScale}x  (max possible: ${max}x)`
    );
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

  private cycleScale(): void {
    const currentIdx = this.SCALE_CYCLE.indexOf(this.mode);
    // If mode somehow not in list (shouldn't happen), start from beginning
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

    // Key: CSS size = logical resolution × integer scale
    this.canvas.style.width = `${this.baseWidth * scale}px`;
    this.canvas.style.height = `${this.baseHeight * scale}px`;

    // Expose for potential future HTML UI scaling
    document.documentElement.style.setProperty('--game-scale', String(scale));
  }
}
