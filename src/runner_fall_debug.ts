import { Actor, vec, ExcaliburGraphicsContext } from 'excalibur';
import { RunnerContext } from './runner_context';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * visual-only fall-acceleration bar.
 */
export class RunnerFallDebug {
  private _actor: Actor | null = null;
  private _runnerCtx: RunnerContext | null = null;

  constructor(private readonly host: Actor) {}

  /** call once we have a RunnerContext */
  ensure(runnerCtx: RunnerContext): void {
    this._runnerCtx = runnerCtx;
    if (this._actor) return;

    const debug = new Actor({
      name: 'RunnerFallDebug',
      // local origin stays at the runner’s pivot (bottom-center)
    });

    // safety flag to make sure it renders
    debug.graphics.forceOnScreen = true;

    debug.graphics.onPostDraw = (ctx) => {
      this.draw(ctx);
    };

    this.host.addChild(debug);
    this._actor = debug;
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const runnerCtx = this._runnerCtx;
    if (!runnerCtx || !runnerCtx.show_fall_debug) return;

    // host is StickRunner. read stateName without importing StickRunner
    const stateName = (this.host as Actor & { stateName?: string }).stateName;
    if (stateName !== 'fall') return;

    const max = runnerCtx.max_fall_acceleration;
    if (max <= 0) return;

    const current = Math.max(
      0,
      Math.min(runnerCtx.fall_acceleration, max)
    );
    const remaining = max - current;

    // visual-only scale (same as jump debug so the two bars read the same)
    const heightScale = 2;

    // local space relative to bottom-center pivot
    // collider bottom is y = 0; +y is down
    const yColliderBottom = 0;
    const yCurrent = current * heightScale;
    const yMax = max * heightScale;

    const columns = [-1, 0, 1];

    for (const x of columns) {
      if (current > 0) {
        ctx.drawLine(
          vec(x, yColliderBottom),
          vec(x, yCurrent),
          DraculaColorScheme.red,
          1
        );
      }

      if (remaining > 0) {
        ctx.drawLine(
          vec(x, yCurrent),
          vec(x, yMax),
          DraculaColorScheme.green,
          1
        );
      }
    }
  }
}
