import { Actor, vec, Animation, AnimationStrategy, Color, Rectangle } from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { assignZ } from './z_order';

const POOL_SIZE = 4;
const FRAME_COUNT = 5;
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 32;
const ADVANCES_PER_FRAME = 3;
const LIFE_TICKS = FRAME_COUNT * ADVANCES_PER_FRAME;

const START_OPACITY = 0.9;
const END_OPACITY = 0.0;
const DUST_SCALE = 1.5; // temporarily bigger so it's hard to miss

class DustSlot {
  actor: Actor;
  animation: FrameBasedAnimation | null = null;
  life = 0;
  active = false;

  constructor(actor: Actor, animation: FrameBasedAnimation | null) {
    this.actor = actor;
    this.animation = animation;
  }
}

export class LandDust implements Tickable {
  private _slots: DustSlot[] = [];
  private _cursor = 0;
  private _built = false;
  private _wasGrounded = true;
  private _useFallbackRect = false;

  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {}

  attachToScene(sceneAdd: (actor: Actor) => void): void {
    if (this._built) return;

    const resource = Resources.land_dust;
    const sheet = resource.getSpriteSheet();
    console.log('[LandDust] getSpriteSheet()', sheet);

    let source: Animation | null = null;
    if (sheet && sheet.sprites && sheet.sprites.length >= FRAME_COUNT) {
      console.log('[LandDust] sheet has', sheet.sprites.length, 'sprites');
      source = Animation.fromSpriteSheet(
        sheet,
        Array.from({ length: FRAME_COUNT }, (_, i) => i),
        100,
        AnimationStrategy.Loop
      );
    } else {
      console.warn('[LandDust] sprite sheet missing or too few frames — using solid rect fallback');
      this._useFallbackRect = true;
    }

    for (let i = 0; i < POOL_SIZE; i++) {
      const actor = new Actor({
        name: 'LandDust',
        anchor: vec(0.5, 1),
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
      });
      assignZ(actor, 'runner_vfx');
      actor.scale = vec(DUST_SCALE, DUST_SCALE);
      actor.graphics.opacity = START_OPACITY;
      actor.graphics.visible = false;

      let anim: FrameBasedAnimation | null = null;
      if (source) {
        anim = new FrameBasedAnimation(source, ADVANCES_PER_FRAME);
        anim.attachToActor(actor);
      } else {
        // solid cyan rect so we can see the spawn even if ASE is bad
        actor.graphics.use(new Rectangle({
          width: 32,
          height: 16,
          color: Color.Cyan,
        }));
      }

      const slot = new DustSlot(actor, anim);
      this._slots.push(slot);
      sceneAdd(actor);
    }

    this._built = true;
    console.log('[LandDust] pool built, fallback=', this._useFallbackRect);
  }

  clear(): void {
    this._wasGrounded = true;
    for (const slot of this._slots) this.turnOff(slot);
  }

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;
    if (ctx.is_dead) {
      this.clear();
      return;
    }

    this.age();

    if (ctx.is_grounded && !this._wasGrounded) {
      console.log('[LandDust] rising edge — spawning');
      this.spawn();
    }
    this._wasGrounded = ctx.is_grounded;
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }

  private spawn(): void {
    if (!this._built || this._slots.length === 0) {
      console.warn('[LandDust] spawn skipped — not built');
      return;
    }

    const slot = this._slots[this._cursor];
    this._cursor = (this._cursor + 1) % this._slots.length;

    slot.actor.pos = this.runner.pos.clone();
    slot.actor.anchor = vec(0.5, 1);
    slot.actor.rotation = 0;
    slot.actor.scale = vec(DUST_SCALE, DUST_SCALE);
    slot.actor.graphics.opacity = START_OPACITY;
    slot.actor.graphics.visible = true;

    if (slot.animation) {
      slot.animation.reset();
    }
    slot.life = LIFE_TICKS;
    slot.active = true;
    console.log('[LandDust] spawned at', slot.actor.pos.x, slot.actor.pos.y);
  }

  private age(): void {
    for (const slot of this._slots) {
      if (!slot.active) continue;

      slot.life--;
      if (slot.animation) {
        slot.animation.tick();
      }

      const progress = 1 - slot.life / LIFE_TICKS;
      const opacity = START_OPACITY + (END_OPACITY - START_OPACITY) * progress;
      slot.actor.graphics.opacity = opacity;

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
    slot.actor.rotation = 0;
    slot.actor.scale = vec(DUST_SCALE, DUST_SCALE);
    slot.actor.anchor = vec(0.5, 1);
  }
}
