import { Actor, Animation } from 'excalibur';

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

  constructor(source: Animation, advancesPerFrame = 1) {
    this.anim = source.clone(); // always clone so each instance is independent
    this.advancesPerFrame = Math.max(1, advancesPerFrame);
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
    // goToFrame respects the Animation's strategy (Loop / PingPong / Freeze / End)
    const next = this.anim.currentFrameIndex + 1;
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
