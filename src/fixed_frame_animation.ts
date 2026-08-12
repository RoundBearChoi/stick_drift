import { Actor, Animation, AnimationStrategy } from 'excalibur';

/**
 * Drives an Excalibur Animation purely from fixed updates.
 * Ignores Aseprite / Animation frame durations.
 * Speed is controlled by how many fixed updates = 1 frame advance.
 */
export class FixedFrameAnimation {
  readonly anim: Animation;
  private owner?: Actor;

  /** How many fixed updates must pass before we advance 1 frame */
  private advancesPerFrame: number;
  private counter = 0;

  /** Local direction for PingPong strategy */
  private pingPongDirection = 1;

  constructor(source: Animation, advancesPerFrame = 1) {
    this.anim = source.clone(); // always clone so each instance is independent
    this.advancesPerFrame = Math.max(1, advancesPerFrame);

    // Make sure we start at frame 0 and are in a clean state
    this.anim.goToFrame(0);
  }

  attach(actor: Actor): void {
    this.owner = actor;
    this.syncGraphic();
  }

  /** Call once per fixed update. No dt needed. */
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
        // Advance until the end, then stay past the last frame (currentFrame becomes null)
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
