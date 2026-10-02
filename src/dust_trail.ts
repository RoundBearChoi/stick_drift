import { Actor, Color, Engine, Material, Rectangle, Vector, vec } from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { SolidGridSystem } from './solid_grid_system';
import { checkIsGrounded } from './runner_ground_checker';
import FRAGMENT from './dust_trail.frag';

export const DUST_MAX = 100;
export const DUST_SIZE = 2; // 2x2
export const DUST_LIFE = 10; // ticks
const DUST_SPAWN_MAX_DIST = 20;

class DustSlot {
  is_playing = false;
  ticks = 0;
  actor: Actor;
  material: Material;

  constructor(actor: Actor, material: Material) {
    this.actor = actor;
    this.material = material;
  }
}

/**
 * one birth per pixel of a grounded step.
 * each slot is its own blood clock: ticks start at a staggered offset, then ++.
 * u_progress is ticks / DUST_LIFE, uploaded like BloodSplatter.
 */
export class DustTrail implements Tickable {
  spacing = 2; // px between births. 1 = one dot per pixel of the step
  progress_per_px = 0.02;
  curve = 0.75; // 1 = linear. 2 pushes the offset toward the front of the step

  private _slots: DustSlot[] = [];
  private _cursor = 0;
  private _prev_foot: Vector | null = null;
  private _prev_grounded = false;
  private _built = false;

  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly engine: Engine,
    private _solid_grid: SolidGridSystem
  ) {}

  setSolidGrid(solid_grid: SolidGridSystem): void {
    this._solid_grid = solid_grid;
  }

  attachToScene(sceneAdd: (actor: Actor) => void): void {
    if (this._built) return;

    for (let i = 0; i < DUST_MAX; i++) {
      const actor = new Actor({
        name: 'DustDot',
        anchor: vec(0.5, 1), // bottom-center, same pivot as the runner foot
        width: DUST_SIZE,
        height: DUST_SIZE,
        z: 2,
      });
      actor.graphics.use(
        new Rectangle({
          width: DUST_SIZE,
          height: DUST_SIZE,
          color: Color.fromHex('#50fa7b'),
        })
      );
      actor.graphics.visible = false;

      const material = this.engine.graphicsContext.createMaterial({
        name: `dust-dot-${i}`,
        fragmentSource: FRAGMENT,
      });
      actor.graphics.material = material;
      this._slots.push(new DustSlot(actor, material));
      sceneAdd(actor);
    }

    this._built = true;
  }

  /** drop the segment so a respawn does not draw a line back to the end point. */
  clear(): void {
    this._prev_foot = null;
    this._prev_grounded = false;
    for (const slot of this._slots) this.turn_off(slot);
  }

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;
    if (ctx.is_dead) {
      this.clear();
      return;
    }

    this.age();

    const foot = this.runner.pos;
    const grounded = checkIsGrounded(
      foot.x,
      foot.y,
      ctx,
      this._solid_grid
    );

    if (this._prev_foot && this._prev_grounded && grounded) {
      this.stamp(this._prev_foot, foot);
    }

    this._prev_foot = foot.clone();
    this._prev_grounded = grounded;
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }

  private age(): void {
    for (const slot of this._slots) {
      if (!slot.is_playing) continue;
      slot.ticks++;
      if (slot.ticks >= DUST_LIFE) {
        this.turn_off(slot);
        continue;
      }
      this.pushProgress(slot);
    }
  }

  private stamp(from: Vector, to: Vector): void {
    const delta = to.sub(from);
    const dist = delta.magnitude;
    if (dist < 1 || dist > DUST_SPAWN_MAX_DIST) return;

    const steps = Math.max(1, Math.round(dist / this.spacing));
    for (let i = 1; i <= steps; i++) {
      const px = (dist * i) / steps;
      const progress = this.birth_progress(px);
      if (progress >= 1) continue;
      const t = i / steps;
      this.turn_on(from.x + delta.x * t, from.y + delta.y * t, progress);
    }
  }

  /**
   * px_from_prev = 0 stays at progress 0.
   * curve 1 is i * progress_per_px. curve 2 loads the offset toward the new foot.
   */
  private birth_progress(px_from_prev: number): number {
    if (this.curve === 1) return px_from_prev * this.progress_per_px;
    return Math.pow(px_from_prev, this.curve) * this.progress_per_px;
  }

  private turn_on(x: number, y: number, progress: number): void {
    const slot = this._slots[this._cursor];
    this._cursor = (this._cursor + 1) % DUST_MAX;

    slot.is_playing = true;
    slot.ticks = Math.floor(progress * DUST_LIFE);
    slot.actor.pos = vec(Math.round(x), Math.round(y));
    slot.actor.graphics.visible = true;
    this.pushProgress(slot);
  }

  private turn_off(slot: DustSlot): void {
    slot.is_playing = false;
    slot.ticks = 0;
    slot.actor.graphics.visible = false;
  }

  private pushProgress(slot: DustSlot): void {
    const progress = slot.ticks / DUST_LIFE;
    slot.material.update((shader) => {
      shader.trySetUniformFloat('u_progress', progress);
    });
  }
}
