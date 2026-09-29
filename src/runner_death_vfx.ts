import { Engine } from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { BloodSplatter } from './blood_splatter';

export class RunnerDeathVfx implements Tickable {
  private _was_dead = false;
  private readonly _splatter = new BloodSplatter();
  private _added = false;

  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly engine: Engine
  ) {}

  attachToScene(sceneAdd: (actor: BloodSplatter) => void): void {
    this._splatter.ensureMaterial(this.engine);
    if (this._added) return;
    sceneAdd(this._splatter);
    this._added = true;
  }

  fixedUpdate(_dt: number): void {
    const dead = this.gameCtx.runner_ctx.is_dead;

    if (dead && !this._was_dead) {
      this.onDeathStarted();
    } else if (!dead && this._was_dead) {
      this.clear();
    }

    if (dead) this._splatter.tick();
    this._was_dead = dead;
  }

  /**
   * call from resetGameplay so the respawn frame does not draw both
   * the restored runner and a still-visible splat.
   */
  clear(): void {
    this._splatter.stop();
    this.runner.graphics.visible = true;
    this._was_dead = false;
  }

  private onDeathStarted(): void {
    this.runner.graphics.visible = false;

    const ctx = this.gameCtx.runner_ctx;
    const centerX = this.runner.pos.x;
    const centerY = this.runner.pos.y - ctx.collider_height / 2;

    // runner's center position is used to create seed
    this._splatter.start(
      centerX,
      centerY,
      Math.floor(centerX * 13 + centerY * 7) // multiplying some arbitrary numbers to create seed
    );
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
