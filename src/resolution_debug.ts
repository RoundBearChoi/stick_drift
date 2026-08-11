import { Scene, Label, Color, vec } from 'excalibur';
import { createTopLeftFont } from './debug_font';
import { ResolutionScale } from './resolution_scale';

/**
 * shared on-screen resolution / scale debug label.
 * placed slightly below the FPS overlay.
 * the actor is shared and can be attached to multiple scenes
 * (same pattern as FpsOverlay).
 */
export class ResolutionDebug {
  private label?: Label;
  private scale: ResolutionScale | null = null;

  /**
   * wire to the live ResolutionScale instance.
   * call once after both objects exist.
   */
  setScale(scale: ResolutionScale): void {
    this.scale = scale;
    this.refresh();
  }

  /**
   * attach (or re-attach) shared resolution label to scene.
   * safe to call from every scene's onActivate.
   */
  attach(scene: Scene): void {
    if (!this.label) {
      this.label = new Label({
        text: 'RES: --',
        pos: vec(8, 16), // slightly below FPS text at (8, 8)
        font: createTopLeftFont(),
      });
      this.label.color = Color.White;
    }

    scene.add(this.label);
    this.refresh();
  }

  /**
   * refresh label text from current scale state.
   * called automatically when scale mode / integer scale changes.
   */
  refresh(): void {
    if (!this.label || !this.scale) return;
    this.label.text = this.scale.getDebugText();
  }
}
