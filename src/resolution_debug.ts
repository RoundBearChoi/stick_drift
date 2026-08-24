import { Scene, Label, vec, CoordPlane } from 'excalibur';
import { createTopLeftFont } from './debug_font';
import { ResolutionScale } from './resolution_scale';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * shared on-screen resolution / scale debug label.
 * placed slightly below the FPS text.
 * actor is shared and can be attached to multiple scenes (same pattern as fps_debug).
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
   * safe to call from every scene's onActivate.
   */
  attachToScene(scene: Scene): void {
    if (!this.label) {
      this.label = new Label({
        text: 'RESOLUTION: --',
        pos: vec(8, 8 + 8 + 2), // slightly below FPS text at (8, 8)
        font: createTopLeftFont(),
      });
      this.label.color = DraculaColorScheme.white;
      this.label.coordPlane = CoordPlane.Screen;
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
