import { Actor, vec, ExcaliburGraphicsContext } from 'excalibur';
import { RunnerContext } from './runner_context';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * visual-only jump-momentum bar.
 * three 1px columns at x = -1, 0, and +1, from collider top
 * up to jump_starting_momentum (drawn at 2x so the bar is easier to see).
 *
 * green = remaining current_up_vector
 * red   = spent portion up to the original max
 *
 * only drawn while the host runner is in jump state.
 * symmetric around x = 0, so facing-flip does not change the picture.
 */
export class RunnerJumpDebug {
  private _actor: Actor | null = null;
  private _runnerCtx: RunnerContext | null = null;

  constructor(private readonly host: Actor) {}

  /** call once we have a RunnerContext */
  ensure(runnerCtx: RunnerContext): void {
    this._runnerCtx = runnerCtx;
    if (this._actor) return;

    const debug = new Actor({
      name: 'RunnerJumpDebug',
      // local origin stays at the runner’s pivot (bottom-center)
    });

    // same safety flag GridSystem / CameraController use
    debug.graphics.forceOnScreen = true;

    debug.graphics.onPostDraw = (ctx) => {
      this.draw(ctx);
    };

    this.host.addChild(debug);
    this._actor = debug;
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const runnerCtx = this._runnerCtx;
    if (!runnerCtx || !runnerCtx.show_jump_debug) return;

    // host is StickRunner. read stateName without importing StickRunner
    // (that would cycle: stick_runner -> runner_jump_debug -> stick_runner).
    const stateName = (this.host as Actor & { stateName?: string }).stateName;
    if (stateName !== 'jump') return;

    const max = runnerCtx.jump_starting_momentum;
    if (max <= 0) return;

    const remaining = Math.max(
      0,
      Math.min(runnerCtx.current_up_vector, max)
    );
    const spent = max - remaining;

    // visual-only scale. does not change jump physics.
    const heightScale = 2;

    // local space relative to bottom-center pivot
    const yColliderTop = -runnerCtx.collider_height;
    const yCurrent = yColliderTop - remaining * heightScale;
    const yMax = yColliderTop - max * heightScale;

    const columns = [-1, 0, 1];

    for (const x of columns) {
      if (remaining > 0) {
        ctx.drawLine(
          vec(x, yColliderTop),
          vec(x, yCurrent),
          DraculaColorScheme.green,
          1
        );
      }

      if (spent > 0) {
        ctx.drawLine(
          vec(x, yCurrent),
          vec(x, yMax),
          DraculaColorScheme.red,
          1
        );
      }
    }
  }
}
