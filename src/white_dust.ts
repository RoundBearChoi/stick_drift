import { Actor, Vector, vec } from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { assignZ } from './z_order';
import { RunnerStateName } from './states/runner_state';

const POOL_SIZE = 8;
const SPAWN_INTERVAL_TICKS = 10;
const LIFE_TICKS = 20;
const BASE_OPACITY = 0.2;
const DUST_SCALE = 1.3;
const RANDOM_X_OFFSET = 2; // ± px around bottom-center
const TRAIL_BIAS = 1; // px opposite facing so it sits slightly behind the foot

class DustSlot {
  actor: Actor;
  animation: FrameBasedAnimation;
  life = 0;
  active = false;

  constructor(actor: Actor, animation: FrameBasedAnimation) {
    this.actor = actor;
    this.animation = animation;
  }
}

/**
 * short-lived white dust puffs spawned at the runner's bottom-center
 * while grounded and in a run-related state.
 * uses runner_vfx z-order.
 */
export class WhiteDust implements Tickable {
  private _slots: DustSlot[] = [];
  private _cursor = 0;
  private _spawn_counter = 0;
  private _built = false;

  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {}

  attachToScene(sceneAdd: (actor: Actor) => void): void {
    if (this._built) return;

    const resource = Resources.white_dust;
    const source = resource.getAnimation();
    if (!source) {
      console.warn('white_dust animation not loaded');
      return;
    }

    for (let i = 0; i < POOL_SIZE; i++) {
      const actor = new Actor({
        name: 'WhiteDust',
        anchor: vec(0.5, 1), // bottom-center, matches runner foot pivot
        width: 16,
        height: 16,
      });
      assignZ(actor, 'runner_vfx');
      actor.scale = vec(DUST_SCALE, DUST_SCALE); // scales from bottom-center anchor
      actor.graphics.opacity = BASE_OPACITY;
      actor.graphics.visible = false;

      const anim = new FrameBasedAnimation(source, 4); // 4 ticks per frame — slower so the shapes read
      anim.attachToActor(actor);

      const slot = new DustSlot(actor, anim);
      this._slots.push(slot);
      sceneAdd(actor);
    }

    this._built = true;
  }

  clear(): void {
    this._spawn_counter = 0;
    for (const slot of this._slots) this.turnOff(slot);
  }

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;
    if (ctx.is_dead) {
      this.clear();
      return;
    }

    this.age();

    if (this.shouldSpawn(ctx)) {
      this._spawn_counter++;
      if (this._spawn_counter >= SPAWN_INTERVAL_TICKS) {
        this._spawn_counter = 0;
        this.spawn(this.runner.pos, ctx.is_facing_right_side);
      }
    } else {
      this._spawn_counter = 0;
    }
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }

  private shouldSpawn(ctx: { is_grounded: boolean; is_dead: boolean }): boolean {
    if (!ctx.is_grounded || ctx.is_dead) return false;
    const name = this.runner.stateName;
    return (
      name === RunnerStateName.RUN ||
      name === RunnerStateName.RUN_ACCEL ||
      name === RunnerStateName.DECEL
    );
  }

  private spawn(foot: Vector, facingRight: boolean): void {
    if (!this._built || this._slots.length === 0) return;

    const slot = this._slots[this._cursor];
    this._cursor = (this._cursor + 1) % this._slots.length;

    // small random x jitter + slight trail bias opposite to facing
    const jitter = (Math.random() * 2 - 1) * RANDOM_X_OFFSET;
    const bias = facingRight ? -TRAIL_BIAS : TRAIL_BIAS;
    const x = Math.round(foot.x + jitter + bias);
    const y = Math.round(foot.y);

    slot.actor.pos = vec(x, y);
    slot.actor.graphics.opacity = BASE_OPACITY;
    slot.actor.graphics.visible = true;
    slot.animation.reset();
    slot.life = LIFE_TICKS;
    slot.active = true;
  }

  private age(): void {
    for (const slot of this._slots) {
      if (!slot.active) continue;
      slot.life--;
      slot.animation.tick();

      // steep transparency increase over the whole life
      // progress 0 = just spawned, 1 = about to die
      const progress = 1 - slot.life / LIFE_TICKS;
      // steep curve: stays readable early, then drops hard
      const steep = progress * progress * progress;
      slot.actor.graphics.opacity = BASE_OPACITY * (1 - steep);

      if (slot.life <= 0) {
        this.turnOff(slot);
      }
    }
  }

  private turnOff(slot: DustSlot): void {
    slot.active = false;
    slot.life = 0;
    slot.actor.graphics.opacity = 0;
    slot.actor.graphics.visible = false;
  }
}
