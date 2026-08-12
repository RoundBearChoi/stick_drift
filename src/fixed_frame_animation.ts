import { Actor, Animation } from 'excalibur';

/**
 * advance animation frame purely based on fixed updates.
 * play speed is customized by how many fixed updates = 1 frame advance.
 */
export class FixedFrameAnimation {
  readonly anim: Animation;
  private owner?: Actor;

  /** how many fixed updates = advance 1 animation frame */
  private advancesPerFrame: number;
  private counter = 0;

  constructor(source: Animation, advancesPerFrame = 1) {
    this.anim = source.clone(); // always clone so each instance is independent
    this.advancesPerFrame = Math.max(1, advancesPerFrame);

    // start at frame 0 by default
    this.anim.goToFrame(0);
  }

  attach(actor: Actor): void {
    this.owner = actor;
    this.syncGraphic();
  }

  /** call once per fixed update. no other factors needed in animation speed. */
  tick(): void {
    this.counter++;

    if (this.counter >= this.advancesPerFrame) {
      this.counter = 0;
      this.advanceOneFrame();
    }

    this.syncGraphic();
  }

  private advanceOneFrame(): void {
    const frameCount = this.anim.frames.length;
    if (frameCount === 0) return;

    // currently only supporting loop.
    // looping: 0 -> 1 -> 2 -> 3 -> 0 -> 1 -> 2 -> 3 ...
    // pingpong: 0 -> 1 -> 2 -> 3 -> 2 -> 1 -> 0 -> 1 ...
    // pingPong / freeze / end can be re-added when needed.
    const next = (this.anim.currentFrameIndex + 1) % frameCount;
    this.anim.goToFrame(next);
  }

  private syncGraphic(): void {
    const frame = this.anim.currentFrame;
    if (this.owner && frame?.graphic) {
      this.owner.graphics.use(frame.graphic);
    }
  }

  setSpeed(advancesPerFrame: number): void {
    this.advancesPerFrame = Math.max(1, advancesPerFrame);
  }

  reset(): void {
    this.counter = 0;
    this.anim.goToFrame(0);
    this.syncGraphic();
  }

  get currentFrameIndex(): number {
    return this.anim.currentFrameIndex;
  }
}
