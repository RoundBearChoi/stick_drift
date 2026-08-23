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
 * draws a solid red X at the desired camera focus and a thin semi-transparent line to the current camera center.
 * pure visual, not a tickable.
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

    // stay at origin. all drawing is done in world space.
    this.pos.x = 0;
    this.pos.y = 0;

    this.graphics.onPostDraw = (ctx) => this.draw(ctx);
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const desired = this.cameraController.getDesiredTargetPos();
    if (!desired) return;

    const cam = this.hostScene.camera;
    if (!cam) return;

    const transparent_red: Color = DraculaColorScheme.red;
    transparent_red.a = 0.35;

    // X at desired target (world space)
    const half = 4;
    ctx.drawLine(
      vec(desired.x - half, desired.y - half),
      vec(desired.x + half, desired.y + half),
      transparent_red,
      1
    );
    ctx.drawLine(
      vec(desired.x + half, desired.y - half),
      vec(desired.x - half, desired.y + half),
      transparent_red,
      1
    );

    // line from center to X
    ctx.drawLine(desired, cam.pos, transparent_red, 1);
  }
}
