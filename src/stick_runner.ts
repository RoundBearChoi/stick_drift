import { Actor, Vector, vec, Color } from 'excalibur';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { GameContext } from './game_context';
import { Tickable } from './tickable';

export interface RunnerOptions {
  pos?: Vector;
  advancesPerFrame?: number;
}

export class StickRunner extends Actor implements Tickable {
  private readonly _frame_based_animation: FrameBasedAnimation;

  constructor(options: RunnerOptions = {}) {
    super({
      pos: options.pos ?? vec(0, 0),
      // bottom-center pivot — standard for game characters
      anchor: vec(0.5, 1),
    });

    const source_sprite = Resources.sprite_runner.getAnimation();

    if (!source_sprite) {
      console.warn('Runner animation not loaded yet');
    }

    // clone from source so each runner is independent
    this._frame_based_animation = new FrameBasedAnimation(
      source_sprite!,
      options.advancesPerFrame ?? 4
    );

    // StickRunner (the Actor)
    //  └── owns → FrameBasedAnimation (the component)
    this._frame_based_animation.attachToActor(this);
  }

  fixedUpdate(_dt: number): void {
    this._frame_based_animation.tick();
  }

  register(gameCtx: GameContext): void {
    gameCtx.register(this);
  }

  unregister(gameCtx: GameContext): void {
    gameCtx.unregister(this);
  }

  setAnimationSpeed(advancesPerFrame: number): void {
    this._frame_based_animation.setSpeed(advancesPerFrame);
  }

  reset(): void {
    this._frame_based_animation.reset();
  }

  get currentFrameIndex(): number {
    return this._frame_based_animation.currentFrameIndex;
  }
}
