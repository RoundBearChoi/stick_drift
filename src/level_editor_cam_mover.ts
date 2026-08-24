import {
  Scene,
  Keys,
} from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';

/**
 * this is only used by level_editor_test_scene.
 */
export class LevelEditorCamMover implements Tickable {
  /** pixels the camera moves on one axis per fixed update while the key is held */
  speed = 4;

  constructor(
    private readonly scene: Scene,
    private readonly gameCtx: GameContext
  ) {}

  fixedUpdate(_dt: number): void {
    const kb = this.scene.engine.input.keyboard;
    const cam = this.scene.camera;

    let dx = 0;
    let dy = 0;

    if (kb.isHeld(Keys.ArrowLeft))  dx -= this.speed;
    if (kb.isHeld(Keys.ArrowRight)) dx += this.speed;
    if (kb.isHeld(Keys.ArrowUp))    dy -= this.speed;
    if (kb.isHeld(Keys.ArrowDown))  dy += this.speed;

    if (dx === 0 && dy === 0) return;

    cam.pos.x += dx;
    cam.pos.y += dy;

    // keep whole numbers (same defensive style as CameraController)
    cam.pos.x = Math.round(cam.pos.x);
    cam.pos.y = Math.round(cam.pos.y);
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
