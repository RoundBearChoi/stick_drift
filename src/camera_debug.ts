import {
  Actor,
  Color,
  ExcaliburGraphicsContext,
  Scene,
  vec,
} from 'excalibur';
import { CameraController } from './camera_controller';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * visual-only camera target debug overlay.
 * draws a solid red X at the desired camera focus and a thin semi-transparent line
 * to the current camera center.
 *
 * pure visual — not a Tickable.
 * draws in world space and never mutates its own position (avoids transform jitter).
 */
export class CameraDebug extends Actor {
  constructor(
    private readonly cameraController: CameraController,
    private readonly hostScene: Scene
  ) {
    super({ name: 'CameraDebug' });

    // required so Excalibur doesn't cull an actor with no size/graphics
    this.graphics.forceOnScreen = true;

    // stay at origin — all drawing is done in world space
    this.pos.x = 0;
    this.pos.y = 0;

    this.graphics.onPostDraw = (ctx) => this.draw(ctx);
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const desired = this.cameraController.getDesiredTargetPos();
    if (!desired) return;

    const cam = this.hostScene.camera;
    if (!cam) return;

    const solidRed: Color = DraculaColorScheme.red;

    // X at desired target (world space)
    const half = 4;
    ctx.drawLine(
      vec(desired.x - half, desired.y - half),
      vec(desired.x + half, desired.y + half),
      solidRed,
      1
    );
    ctx.drawLine(
      vec(desired.x + half, desired.y - half),
      vec(desired.x - half, desired.y + half),
      solidRed,
      1
    );

    // thin line from desired target → current camera center (both world)
    const lineColor = solidRed.clone();
    lineColor.a = 0.45;

    ctx.drawLine(desired, cam.pos, lineColor, 0.1);
  }
}
