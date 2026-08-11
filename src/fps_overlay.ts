import { Scene, Label, Color, vec } from 'excalibur';
import { FpsDebug } from './fps_debug';
import { createTopLeftFont } from './debug_font';

export class FpsOverlay {
  readonly counter = new FpsDebug();
  private label?: Label;

  /**
   * attach (or re-attach) shared FPS label to scene.
   * safe to call from every scene's onActivate.
   */
  attach(scene: Scene): void {
    if (!this.label) {
      this.label = new Label({
        text: 'RENDER FPS: --  FIXED UPDATE FPS: --',
        pos: vec(8, 8),
        font: createTopLeftFont(),
      });
      this.label.color = Color.White;
    }

    scene.add(this.label);
  }

  /** call once per visual frame */
  update(realElapsedMs: number): void {
    this.counter.update(realElapsedMs);

    if (this.label) {
      this.label.text = this.counter.text;
    }
  }

  /** call once per fixed update */
  tickFixed(): void {
    this.counter.tickFixed();
  }
}
