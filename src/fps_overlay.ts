import { Scene, Label, Color, vec } from 'excalibur';
import { FpsCounter } from './fps_counter';
import { createTopLeftFont } from './debug_font';

/**
 * Owns the FPS counter + the shared on-screen label.
 * GameContext just drives it; scenes only call attach().
 */
export class FpsOverlay {
  readonly counter = new FpsCounter();
  private label?: Label;

  /**
   * Attach (or re-attach) the shared FPS label to a scene.
   * Safe to call from every scene's onActivate.
   */
  attach(scene: Scene): void {
    if (!this.label) {
      this.label = new Label({
        text: 'render fps: --  fixed update fps: --',
        pos: vec(8, 8),
        font: createTopLeftFont(),
      });
      this.label.color = Color.White;
    }

    scene.add(this.label);
  }

  /** Call once per visual frame */
  update(realElapsedMs: number): void {
    this.counter.update(realElapsedMs);

    if (this.label) {
      this.label.text = this.counter.text;
    }
  }

  /** Call once per fixed update */
  tickFixed(): void {
    this.counter.tickFixed();
  }
}
