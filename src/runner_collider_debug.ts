import { Actor, vec, ExcaliburGraphicsContext } from 'excalibur';
import { RunnerContext } from './runner_context';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * visual-only yellow collider outline for the runner.
 * completely separate from animation graphics and from gameplay/collision logic.
 *
 * - lives as a child of the runner so it follows position
 * - counters parent scale.x so the box doesn't flip
 */
export class RunnerColliderDebug {
  private _actor: Actor | null = null;
  private _runnerCtx: RunnerContext | null = null;

  constructor(private readonly host: Actor) {}

  /** call once we have a RunnerContext */
  ensure(runnerCtx: RunnerContext): void {
    this._runnerCtx = runnerCtx;
    if (this._actor) return;

    const debug = new Actor({
      name: 'RunnerColliderDebug',
      // local origin stays at the runner’s pivot (bottom-center)
    });

    // same safety flag GridSystem / CameraController use
    debug.graphics.forceOnScreen = true;

    debug.graphics.onPostDraw = (ctx) => {
      this.draw(ctx);
    };

    // start un-mirrored (kept in sync by syncFacing)
    debug.scale.x = this.host.scale.x;

    this.host.addChild(debug);
    this._actor = debug;
  }

  /**
   * keep the debug box un-mirrored when the runner faces left/right.
   * parent.scale.x * child.scale.x = +1 in both directions.
   */
  syncFacing(parentScaleX: number): void {
    if (this._actor) {
      this._actor.scale.x = parentScaleX;
    }
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const runnerCtx = this._runnerCtx;
    if (!runnerCtx || !runnerCtx.show_collider_debug) return;

    const w = runnerCtx.collider_width;
    const h = runnerCtx.collider_height;
    const halfW = w / 2;

    // local space relative to bottom-center pivot
    const x0 = -halfW;
    const y0 = -h;
    const x1 = halfW;
    const y1 = 0;

    // four lines = outline
    ctx.drawLine(vec(x0, y0), vec(x1, y0), DraculaColorScheme.yellow, 1); // top
    ctx.drawLine(vec(x1 + 1, y0), vec(x1 + 1, y1), DraculaColorScheme.yellow, 1); // right - 1px offset to avoid rasterization mismatch
    ctx.drawLine(vec(x1, y1), vec(x0, y1), DraculaColorScheme.yellow, 1); // bottom
    ctx.drawLine(vec(x0, y1), vec(x0, y0), DraculaColorScheme.yellow, 1); // left

    // fill the corner pixels (purely cosmetic — 1px outlines can leave the corner open due to rasterization mismatch)
    ctx.drawLine(vec(x0, y0), vec(x0 - 1, y0), DraculaColorScheme.yellow, 1); // top-left corner
    ctx.drawLine(vec(x1, y0), vec(x1 + 1, y0), DraculaColorScheme.yellow, 1); // top-right corner
  }
}
