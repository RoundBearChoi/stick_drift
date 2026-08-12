import { Actor, Animation, AnimationStrategy } from 'excalibur';

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

  /**
   * not using ping pong strategy for now.
   * pretty much everything is simply looping. can't think of a ping pong style animation rn.
   */
  private pingPongDirection = 1;

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

    let next = this.anim.currentFrameIndex;

    switch (this.anim.strategy) {
      case AnimationStrategy.Loop:
        next = (next + 1) % frameCount;
        break;

      case AnimationStrategy.PingPong: {
        next = next + this.pingPongDirection;

        if (next >= frameCount) {
          this.pingPongDirection = -1;
          next = frameCount - 2; // bounce back
          if (next < 0) next = 0;
        } else if (next < 0) {
          this.pingPongDirection = 1;
          next = 1;
          if (next >= frameCount) next = 0;
        }
        break;
      }

      case AnimationStrategy.Freeze:
        next = Math.min(next + 1, frameCount - 1);
        break;

      case AnimationStrategy.End:
      default:
        // advance until the end, then stay past the last frame (currentFrame becomes null)
        next = next + 1;
        break;
    }

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
    this.pingPongDirection = 1;
    this.anim.goToFrame(0);
    this.syncGraphic();
  }

  get currentFrameIndex(): number {
    return this.anim.currentFrameIndex;
  }
}
