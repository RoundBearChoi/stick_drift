import { Actor, Vector, vec } from 'excalibur';
import { Resources } from './resources';
import { FixedFrameAnimation } from './fixed_frame_animation';
import { GameContext } from './game_context';

export interface RunnerOptions {
  pos?: Vector;
  advancesPerFrame?: number;
}

export class StickRunner extends Actor {
  private readonly _sprite_animation: FixedFrameAnimation;

  constructor(options: RunnerOptions = {}) {
    super({
      pos: options.pos ?? vec(0, 0),
      // bottom-center pivot — standard for game characters (feet stay planted)
      anchor: vec(0.5, 1),
    });

    const source_sprite = Resources.sprite_runner.getAnimation();

    if (!source_sprite) {
      console.warn('Runner animation not loaded yet');
    }

    // FixedFrameAnimation always clones the source so each runner is independent
    this._sprite_animation = new FixedFrameAnimation(
      source_sprite!,
      options.advancesPerFrame ?? 4
    );

    this._sprite_animation.attach(this);
  }

  /**
   * register so game context can tick the animation on the fixed timestep. no need to manually update every frame
   */
  register(gameCtx: GameContext): void {
    gameCtx.registerFixedAnim(this._sprite_animation);
  }

  /**
   * unregister when leaving the scene. stop updating the animation
   */
  unregister(gameCtx: GameContext): void {
    gameCtx.unregisterFixedAnim(this._sprite_animation);
  }

  setSpeed(advancesPerFrame: number): void {
    this._sprite_animation.setSpeed(advancesPerFrame);
  }

  reset(): void {
    this._sprite_animation.reset();
  }

  get currentFrameIndex(): number {
    return this._sprite_animation.currentFrameIndex;
  }
}
