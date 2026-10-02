import {
  Actor,
  Color,
  Engine,
  Material,
  Rectangle,
  vec,
} from 'excalibur';
import { RUNNER_DEATH_DELAY_TICKS } from './on_runner_death';
import FRAGMENT from './blood_splatter.frag';
import { assignZ } from './z_order';

export const BLOOD_SPLATTER_SIZE = 128; // actor size and quad size

export class BloodSplatter extends Actor {
  private _material: Material | null = null;
  private _ticks = 0;
  private _playing = false;
  private _seed = 1;

  constructor() {
    super({
      name: 'BloodSplatter',
      anchor: vec(0.5, 0.5), // center mass
    });
    assignZ(this, 'runner_vfx');

    this.graphics.use(
      new Rectangle({
        width: BLOOD_SPLATTER_SIZE,
        height: BLOOD_SPLATTER_SIZE,
        color: Color.White,
      })
    );
    this.graphics.visible = false;
    this.graphics.forceOnScreen = true;
  }

  ensureMaterial(engine: Engine): void {
    if (this._material) return;

    this._material = engine.graphicsContext.createMaterial({
      name: 'pixel-blood-splatter',
      fragmentSource: FRAGMENT,
    });
    this.graphics.material = this._material;
  }

  start(worldX: number, worldY: number, seed: number): void {
    this.pos = vec(Math.floor(worldX), Math.floor(worldY));
    this._ticks = 0;
    this._playing = true;
    this.graphics.visible = true;
    this.pushUniforms();
  }

  stop(): void {
    this._playing = false;
    this._ticks = 0;
    this.graphics.visible = false;
  }

  tick(): void {
    if (!this._playing) return;
    if (this._ticks < RUNNER_DEATH_DELAY_TICKS) this._ticks++;
    this.pushUniforms();
  }

  get playing(): boolean {
    return this._playing;
  }

  private pushUniforms(): void {
    if (!this._material) return;
    const progress = this._ticks / RUNNER_DEATH_DELAY_TICKS;
    this._material.update((shader) => {
      shader.trySetUniformFloat('u_progress', progress);
      shader.trySetUniformFloat('u_seed', this._seed);
      shader.trySetUniformFloatVector(
        'u_quad_size',
        vec(BLOOD_SPLATTER_SIZE, BLOOD_SPLATTER_SIZE)
      );
    });
  }
}
