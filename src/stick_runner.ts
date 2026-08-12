import { Actor, Vector, vec } from 'excalibur';
import { Resources } from './resources';
import { FixedFrameAnimation } from './fixed_frame_animation';
import { GameContext } from './game_context';

export interface RunnerOptions {
  pos?: Vector;
  advancesPerFrame?: number;
}

/**
 * Stick figure runner.
 * Owns its own FixedFrameAnimation.
 * Scene owns the Runner instance.
 *
 * Future: this class will also own a state machine.
 */
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

  /** Register so GameContext can tick the animation on the fixed timestep */
  register(gameCtx: GameContext): void {
    gameCtx.registerFixedAnim(this.anim);
  }

  /** Unregister when leaving the scene */
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
