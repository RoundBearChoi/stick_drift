import { Actor, Vector, vec } from 'excalibur';
import { Resources } from './resources';
import { FixedFrameAnimation } from './fixed_frame_animation';
import { GameContext } from './game_context';

export interface RunnerOptions {
  pos?: Vector;
  advancesPerFrame?: number;
}

export class Runner extends Actor {
  private readonly anim: FixedFrameAnimation;

  constructor(options: RunnerOptions = {}) {
    super({
      pos: options.pos ?? vec(0, 0),
    });

    const sourceAnim = Resources.sprite_runner.getAnimation();

    if (!sourceAnim) {
      console.warn('Runner animation not loaded yet');
    }

    // FixedFrameAnimation always clones the source so each runner is independent
    this.anim = new FixedFrameAnimation(
      sourceAnim!,
      options.advancesPerFrame ?? 4
    );

    this.anim.attach(this);
  }

  /** register so game context can tick the animation on the fixed timestep. no need to manually update every frame */
  register(gameCtx: GameContext): void {
    gameCtx.registerFixedAnim(this.anim);
  }

  /** unregister when leaving the scene. stop updating the animation */
  unregister(gameCtx: GameContext): void {
    gameCtx.unregisterFixedAnim(this.anim);
  }

  setSpeed(advancesPerFrame: number): void {
    this.anim.setSpeed(advancesPerFrame);
  }

  reset(): void {
    this.anim.reset();
  }

  get currentFrameIndex(): number {
    return this.anim.currentFrameIndex;
  }
}
