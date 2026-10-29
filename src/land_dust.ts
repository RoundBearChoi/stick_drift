import { Actor, vec, ImageSource, SpriteSheet, Animation } from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { assignZ } from './z_order';

const POOL_SIZE = 4;
const FRAME_COUNT = 5;                 // must match the sprite sheet
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 32;
const ADVANCES_PER_FRAME = 3;          // how many fixed ticks = 1 animation frame
const LIFE_TICKS = FRAME_COUNT * ADVANCES_PER_FRAME;

const START_OPACITY = 0.85;
const END_OPACITY = 0.0;

const DUST_SCALE = 1.0;                // 64x32 sheet already covers left+right of the 20px collider

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
 * One-shot dust impact spawned at the runner's bottom-center
 * on every landing (rising edge of is_grounded).
 * Sprite sheet is already left/right symmetrical, so no facing flip is needed.
 */
export class LandDust implements Tickable {
  private _slots: DustSlot[] = [];
  private _cursor = 0;
  private _built = false;
  private _wasGrounded = true;         // start true so spawn/reset does not trigger

  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {}

  attachToScene(sceneAdd: (actor: Actor) => void): void {
    if (this._built) return;

    const image = Resources.land_dust as ImageSource;
    if (!image.isLoaded()) {
      console.warn('land_dust image not loaded');
      return;
    }

    const spriteSheet = SpriteSheet.fromImageSource({
      image,
      grid: {
        rows: 1,
        columns: FRAME_COUNT,
        spriteWidth: FRAME_WIDTH,
        spriteHeight: FRAME_HEIGHT,
      },
    });

    const sourceAnim = Animation.fromSpriteSheet(spriteSheet, [0, 1, 2, 3, 4], 100); // speed ignored, we use FrameBasedAnimation

    for (let i = 0; i < POOL_SIZE; i++) {
      const actor = new Actor({
        name: 'LandDust',
        anchor: vec(0.5, 1),               // bottom-center (same as runner)
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
      });
      assignZ(actor, 'runner_vfx');
      actor.scale = vec(DUST_SCALE, DUST_SCALE);
      actor.graphics.opacity = START_OPACITY;
      actor.graphics.visible = false;

      const anim = new FrameBasedAnimation(sourceAnim, ADVANCES_PER_FRAME);
      anim.attachToActor(actor);

      const slot = new DustSlot(actor, anim);
      this._slots.push(slot);
      sceneAdd(actor);
    }

    this._built = true;
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

    // rising edge only — same idea as CamShakeOnLand
    if (ctx.is_grounded && !this._wasGrounded) {
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
    if (!this._built || this._slots.length === 0) return;

    const slot = this._slots[this._cursor];
    this._cursor = (this._cursor + 1) % this._slots.length;

    // runner.pos is already bottom-center (anchor 0.5, 1)
    slot.actor.pos = this.runner.pos.clone();
    slot.actor.anchor = vec(0.5, 1);
    slot.actor.rotation = 0;
    slot.actor.scale = vec(DUST_SCALE, DUST_SCALE);
    slot.actor.graphics.opacity = START_OPACITY;
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

      // linear fade from START_OPACITY → END_OPACITY over the full life
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
