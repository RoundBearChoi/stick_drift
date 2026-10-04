import {
  Actor,
  Color,
  Engine,
  Material,
  Rectangle,
  Vector,
  vec,
} from 'excalibur';
import { Tickable } from './tickable';
import { GameContext, NATIVE_RESOLUTION } from './game_context';
import { StickRunner } from './stick_runner';
import { SolidGridSystem } from './solid_grid_system';
import { checkIsGrounded } from './runner_ground_checker';
import { checkWallSlideContact } from './runner_wall_slide_check';
import { assignZ, Z_ORDER } from './z_order';
import FRAGMENT from './green_trail_light.frag';

export const MAX_PARTICLES = 100;
export const PARTICLE_SIZE = 2;
export const PARTICLE_LIFE = 35; // ticks from progress 0 to 1
const SPAWN_MAX_DIST = 20;
const FADE_CUTOFF = 0.01;
const START_OPACITY = 0.15; // 1 = solid at birth. lower = more transparent dots
const LIGHT_PACK = MAX_PARTICLES * 3; // xyz per slot

type ContactSide = 'none' | 'ground' | 'left' | 'right';

const DOT = new Rectangle({
  width: PARTICLE_SIZE,
  height: PARTICLE_SIZE,
  color: Color.fromHex('#50fa7b'),
});

const LIGHT_QUAD = new Rectangle({
  width: NATIVE_RESOLUTION.width,
  height: NATIVE_RESOLUTION.height,
  color: Color.White,
});

/** full until 0.2, then smoothstep to 0. scaled by START_OPACITY. */
function fadeFromProgress(p: number): number {
  const t = Math.min(1, Math.max(0, (p - 0.2) / 0.8));
  const s = t * t * (3 - 2 * t);
  return (1 - s) * START_OPACITY;
}

class ParticleSlot {
  is_playing = false;
  progress = 0;
  actor: Actor;

  constructor(actor: Actor) {
    this.actor = actor;
  }
}

/**
 * camera-sized field in world space, above the dots.
 * each fragment rebuilds every halo from the uploaded snapshot.
 */
class GreenTrailLight extends Actor {
  constructor() {
    super({
      name: 'GreenTrailLight',
      anchor: vec(0.5, 0.5),
      width: NATIVE_RESOLUTION.width,
      height: NATIVE_RESOLUTION.height,
    });
    assignZ(this, 'trail_light');
    this.graphics.use(LIGHT_QUAD);
    this.graphics.forceOnScreen = true;
  }
}

/**
 * one birth per pixel of a contact step whose center sits on a solid.
 * ground: full-width sole probe, then the exclusive bottom-center pivot.
 * wall: checkWallSlideContact on that side, then the exclusive mid-edge pixel.
 * a toe or a corner graze still counts as contact, so it does not trail.
 * probes the post-move foot itself. does not read ctx contact flags or stateName.
 *
 * dots are a shared Rectangle on the default rectangle batch. fade is graphics.opacity.
 */
export class GreenTrail implements Tickable {
  spacing = 2; // px between births. 1 = one dot per pixel of the step
  progress_per_px = 0.03;
  curve = 0.9; // 1 = linear. 2 pushes the offset toward the front of the step

  private _slots: ParticleSlot[] = [];
  private _cursor = 0;
  private _prev_point: Vector | null = null;
  private _prev_side: ContactSide = 'none';
  private _built = false;
  private _light: GreenTrailLight | null = null;
  private _light_material: Material | null = null;
  private _packed = new Array<number>(LIGHT_PACK).fill(-1);
  private _warned_uniform = false;

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

    this._light = new GreenTrailLight();
    this._light_material = this.engine.graphicsContext.createMaterial({
      name: 'green-trail-light',
      fragmentSource: FRAGMENT,
    });
    this._light.graphics.material = this._light_material;
    sceneAdd(this._light);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const actor = new Actor({
        name: 'GreenDot',
        anchor: vec(0.5, 1), // bottom-center, same pivot as the runner foot
        width: PARTICLE_SIZE,
        height: PARTICLE_SIZE,
      });
      assignZ(actor, 'runner_vfx');
      actor.graphics.use(DOT);
      actor.graphics.opacity = 0;
      actor.graphics.visible = false;
      this._slots.push(new ParticleSlot(actor));
      sceneAdd(actor);
    }

    this._built = true;
  }

  /** drop the segment so a respawn does not draw a line back to the end point. */
  clear(): void {
    this._prev_point = null;
    this._prev_side = 'none';
    for (const slot of this._slots) this.turn_off(slot);
    this.pushLight();
  }

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;
    if (ctx.is_dead) {
      this.clear();
      return;
    }

    this.age();

    const sample = this.sample(this.runner.pos);
    if (
      this._prev_point &&
      sample.point &&
      this._prev_side !== 'none' &&
      sample.side === this._prev_side
    ) {
      this.stamp(this._prev_point, sample.point, sample.side);
    }

    this._prev_point = sample.point?.clone() ?? null;
    this._prev_side = sample.side;
    this.pushLight();
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }

  /**
   * ground wins, so a landing does not also paint the wall.
   * wall is air-only: a grounded side scrape is not a wall slide.
   * squeezed between two solids, keep the facing wall only.
   */
  private sample(foot: Vector): { side: ContactSide; point: Vector | null } {
    const ctx = this.gameCtx.runner_ctx;
    const grounded = checkIsGrounded(foot.x, foot.y, ctx, this._solid_grid);
    const sole_center = this._solid_grid.isSolidAtWorldSpace(foot.x, foot.y);
    if (grounded && sole_center) {
      return { side: 'ground', point: foot.clone() };
    }
    if (grounded) return { side: 'none', point: null };

    const halfW = ctx.collider_width / 2;
    const midY = foot.y - ctx.collider_height / 2;
    const walls = checkWallSlideContact(foot.x, foot.y, ctx, this._solid_grid);
    const left = walls.left && !(walls.right && ctx.is_facing_right_side);
    const right = walls.right && !(walls.left && !ctx.is_facing_right_side);

    if (left) {
      const x = foot.x - halfW - 1; // last solid pixel left of the collider
      if (this._solid_grid.isSolidAtWorldSpace(x, midY)) {
        return { side: 'left', point: vec(x, midY) };
      }
    }
    if (right) {
      const x = foot.x + halfW; // first solid pixel right of the collider
      if (this._solid_grid.isSolidAtWorldSpace(x, midY)) {
        return { side: 'right', point: vec(x, midY) };
      }
    }
    return { side: 'none', point: null };
  }

  private age(): void {
    const step = 1 / PARTICLE_LIFE;
    for (const slot of this._slots) {
      if (!slot.is_playing) continue;
      slot.progress += step;
      if (slot.progress >= 1) {
        this.turn_off(slot);
        continue;
      }
      this.applyFade(slot);
    }
  }

  private stamp(from: Vector, to: Vector, side: ContactSide): void {
    const delta = to.sub(from);
    const dist = delta.magnitude;
    if (dist < 1 || dist > SPAWN_MAX_DIST) return;

    const steps = Math.max(1, Math.round(dist / this.spacing));
    for (let i = 1; i <= steps; i++) {
      const px = (dist * i) / steps;
      const progress = this.birth_progress(px);
      if (progress >= 1) continue;
      const t = i / steps;
      this.turn_on(from.x + delta.x * t, from.y + delta.y * t, progress, side);
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

  private turn_on(x: number, y: number, progress: number, side: ContactSide): void {
    const slot = this._slots[this._cursor];
    this._cursor = (this._cursor + 1) % MAX_PARTICLES;

    slot.is_playing = true;
    slot.progress = progress;
    // grow the quad into the body, same as the floor dots sitting on the sole
    slot.actor.anchor =
      side === 'left' ? vec(0, 0.5) : side === 'right' ? vec(1, 0.5) : vec(0.5, 1);
    slot.actor.pos = vec(Math.round(x), Math.round(y));
    this.applyFade(slot);
  }

  private turn_off(slot: ParticleSlot): void {
    slot.is_playing = false;
    slot.progress = 0;
    slot.actor.graphics.opacity = 0;
    slot.actor.graphics.visible = false;
  }

  private applyFade(slot: ParticleSlot): void {
    const fade = fadeFromProgress(slot.progress);
    slot.actor.graphics.opacity = fade;
    slot.actor.graphics.visible = fade > FADE_CUTOFF;
  }

  /** snapshot the living slots. the frag rebuilds the halos from this. no gpu state. */
  private pushLight(): void {
    const material = this._light_material;
    if (!material) return;

    const packed = this._packed;
    let n = 0;
    for (const slot of this._slots) {
      if (!slot.is_playing) continue;
      const base = n * 3;
      packed[base] = slot.actor.pos.x;
      packed[base + 1] = slot.actor.pos.y;
      packed[base + 2] = slot.progress;
      n++;
    }
    for (let i = n * 3; i < LIGHT_PACK; i++) packed[i] = -1;

    const cam = this.engine.currentScene.camera.pos;
    const originX = cam.x - NATIVE_RESOLUTION.width / 2;
    const originY = cam.y - NATIVE_RESOLUTION.height / 2;

    material.update((shader) => {
      shader.trySetUniformFloatVector(
        'u_quad_size',
        vec(NATIVE_RESOLUTION.width, NATIVE_RESOLUTION.height)
      );
      shader.trySetUniformFloatVector('u_origin', vec(originX, originY));
      shader.trySetUniformInt('u_count', n);
      const ok =
        shader.trySetUniformFloatArray('u_particles[0]', packed) ||
        shader.trySetUniformFloatArray('u_particles', packed);
      if (!ok && !this._warned_uniform) {
        this._warned_uniform = true;
        console.warn('green trail light: u_particles uniform was not set');
      }
    });

    // sit on the camera so the field cannot be culled off in world space
    const light = this._light;
    if (light) {
      light.pos = vec(cam.x, cam.y);
      light.graphics.visible = true;
    }
  }
}
