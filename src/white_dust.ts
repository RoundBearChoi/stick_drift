import { Actor, Vector, vec } from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { assignZ } from './z_order';
import { RunnerStateName } from './states/runner_state';
import { RunnerContext } from './runner_context';

const POOL_SIZE = 8;
const SPAWN_INTERVAL_TICKS = 10;
const LIFE_TICKS = 20;
const BASE_OPACITY = 0.4;
const DUST_SCALE = 1.3;
const RANDOM_X_OFFSET = 2; // ± px around bottom-center (ground)
const RANDOM_Y_OFFSET = 2; // ± px vertical jitter on walls
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
 * short-lived white dust puffs spawned at the runner's contact surface
 * while grounded in a run-related state, or while wall-sliding.
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
        anchor: vec(0.5, 1), // bottom-center default; overridden per spawn for walls
        width: 16,
        height: 16,
      });
      assignZ(actor, 'runner_vfx');
      actor.scale = vec(DUST_SCALE, DUST_SCALE);
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
        this.spawn(ctx);
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

  private shouldSpawn(ctx: RunnerContext): boolean {
    if (ctx.is_dead) return false;

    const name = this.runner.stateName;

    // grounded run / accel / decel
    if (ctx.is_grounded) {
      return (
        name === RunnerStateName.RUN ||
        name === RunnerStateName.RUN_ACCEL ||
        name === RunnerStateName.DECEL
      );
    }

    // wall slide: only the facing wall, so we never double-spawn when squeezed
    if (name === RunnerStateName.WALL_SLIDE) {
      const facingRight = ctx.is_facing_right_side;
      return facingRight ? ctx.wall_contact_right : ctx.wall_contact_left;
    }

    return false;
  }

  private spawn(ctx: RunnerContext): void {
    if (!this._built || this._slots.length === 0) return;

    const slot = this._slots[this._cursor];
    this._cursor = (this._cursor + 1) % this._slots.length;

    const foot = this.runner.pos;
    const name = this.runner.stateName;
    const facingRight = ctx.is_facing_right_side;

    let x: number;
    let y: number;
    let anchor = vec(0.5, 1); // default ground

    if (name === RunnerStateName.WALL_SLIDE && !ctx.is_grounded) {
      // wall: spawn at exclusive edge pixel, mid-height, grow into the body
      const halfW = ctx.collider_width / 2;
      const midY = foot.y - ctx.collider_height / 2;
      const yJitter = (Math.random() * 2 - 1) * RANDOM_Y_OFFSET;

      if (facingRight && ctx.wall_contact_right) {
        // right wall: first solid pixel to the right of the collider
        x = Math.round(foot.x + halfW);
        y = Math.round(midY + yJitter);
        anchor = vec(1, 0.5); // grow leftward from the wall
      } else if (!facingRight && ctx.wall_contact_left) {
        // left wall: last solid pixel to the left of the collider
        x = Math.round(foot.x - halfW - 1);
        y = Math.round(midY + yJitter);
        anchor = vec(0, 0.5); // grow rightward from the wall
      } else {
        // fallback (should not happen because of shouldSpawn)
        x = Math.round(foot.x);
        y = Math.round(foot.y);
      }
    } else {
      // ground: bottom-center + x jitter + trail bias opposite facing
      const jitter = (Math.random() * 2 - 1) * RANDOM_X_OFFSET;
      const bias = facingRight ? -TRAIL_BIAS : TRAIL_BIAS;
      x = Math.round(foot.x + jitter + bias);
      y = Math.round(foot.y);
      anchor = vec(0.5, 1);
    }

    slot.actor.anchor = anchor;
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
