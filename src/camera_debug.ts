import {
  Actor,
  Color,
  ExcaliburGraphicsContext,
  Scene,
  vec,
} from 'excalibur';
import { CameraController } from './camera_controller';
import { DraculaColorScheme } from './dracula_color_scheme';

/** visual-only camera target debug overlay. */
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
    // clone so we do not mutate the shared DraculaColorScheme.red
    const transparent_red: Color = DraculaColorScheme.red.clone();
    transparent_red.a = 0.1;

    const half = 4;

    // ── X at world origin (0, 0) ────────────────────────────────
    ctx.drawLine(
      vec(0 - half, 0 - half),
      vec(0 + half, 0 + half),
      transparent_red,
      1
    );
    ctx.drawLine(
      vec(0 + half, 0 - half),
      vec(0 - half, 0 + half),
      transparent_red,
      1
    );

    const cam = this.hostScene.camera;

    // line from camera center (screen center in world space) to origin
    if (cam) {
      ctx.drawLine(vec(0, 0), cam.pos, transparent_red, 1);
    }

    // ── existing desired-target X + line ───────────────────────
    const desired = this.cameraController.getDesiredTargetPos();
    if (!desired) return;
    if (!cam) return;

    // X at desired target (world space)
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

    // line from center to desired X
    ctx.drawLine(desired, cam.pos, transparent_red, 1);
  }
}
