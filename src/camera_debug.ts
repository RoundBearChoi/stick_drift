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
 * pure visual \u2014 not a Tickable.
 */
export class CameraDebug extends Actor {
  constructor(
    private readonly cameraController: CameraController,
    private readonly hostScene: Scene
  ) {
    super({ name: 'CameraDebug' });

    // required so Excalibur doesn't cull an actor with no size/graphics
    this.graphics.forceOnScreen = true;

    this.graphics.onPostDraw = (ctx) => this.draw(ctx);
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const desired = this.cameraController.getDesiredTargetPos();
    if (!desired) return;

    // place this actor at the desired target so the X is drawn in the right place
    // (onPostDraw is in local space of this actor)
    this.pos.x = Math.round(desired.x);
    this.pos.y = Math.round(desired.y);

    const solidRed: Color = DraculaColorScheme.red;

    // X at target (local origin) \u2014 keep solid so it stays easy to spot
    const half = 4;
    ctx.drawLine(vec(-half, -half), vec(half, half), solidRed, 1);
    ctx.drawLine(vec(half, -half), vec(-half, half), solidRed, 1);

    // thin line from target \u2192 camera center
    const cam = this.hostScene.camera;
    if (cam) {
      const localCamX = cam.pos.x - this.pos.x;
      const localCamY = cam.pos.y - this.pos.y;

      // same red with alpha so the line is quieter than the X
      const lineColor = solidRed.clone();
      lineColor.a = 0.45;

      ctx.drawLine(vec(0, 0), vec(localCamX, localCamY), lineColor, 0.1);
    }
  }
}
