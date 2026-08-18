import { Actor, Animation } from 'excalibur';
import { applySpriteRenderOffset } from './sprite_render';

/**
 * advance animation frame purely based on fixed updates.
 * play speed is customized by how many fixed updates = 1 frame advance.
 */
export class FrameBasedAnimation {
  private readonly _animation: Animation;
  private _owner?: Actor;

  /** how many fixed updates = advance 1 animation frame */
  private _advancesPerFrame: number;
  private _counter = 0;

  constructor(source: Animation, advancesPerFrame = 1) {
    this._animation = source.clone(); // always clone so each instance is independent
    this._advancesPerFrame = Math.max(1, advancesPerFrame);

    // start at frame 0 by default
    this._animation.goToFrame(0);
  }

  attachToActor(actor: Actor): void {
    this._owner = actor;
    this.syncGraphic();
  }

  /** call once per fixed update. no other factors needed in animation speed. */
  tick(): void {
    this._counter++;

    if (this._counter >= this._advancesPerFrame) {
      this._counter = 0;
      this.advanceOneFrame();
    }

    this.syncGraphic();
  }

  private advanceOneFrame(): void {
    const frameCount = this._animation.frames.length;
    if (frameCount === 0) return;

    // currently only supporting loop.
    // looping: 0 -> 1 -> 2 -> 3 -> 0 -> 1 -> 2 -> 3 ...
    // pingpong: 0 -> 1 -> 2 -> 3 -> 2 -> 1 -> 0 -> 1 ...
    // pingPong / freeze / end can be re-added when needed.
    const next = (this._animation.currentFrameIndex + 1) % frameCount;
    this._animation.goToFrame(next);
  }

  private syncGraphic(): void {
    const frame = this._animation.currentFrame;

    if (this._owner && frame?.graphic) {
      /** attach graphics obj to actor so excalibur can render
       * every time we advance one animation frame we're telling excalibur “sprite for this actor has changed so use that sprite.”
       */
      this._owner.graphics.use(frame.graphic);
      applySpriteRenderOffset(this._owner);
    }
  }

  setSpeed(advancesPerFrame: number): void {
    this._advancesPerFrame = Math.max(1, advancesPerFrame);
  }

  reset(): void {
    this._counter = 0;
    this._animation.goToFrame(0);
    this.syncGraphic();
  }

  get currentFrameIndex(): number {
    return this._animation.currentFrameIndex;
  }
}
