import { DefaultLoader, Engine } from 'excalibur';

/**
 * Custom loader that mimics a Linux Mint Cinnamon terminal style.
 *
 * Looks like:
 *
 *           loading
 *
 * [████████████░░░░░░░░]  62%
 */
export class TerminalLoader extends DefaultLoader {
  private readonly bg = '#282a36';
  private readonly fg = '#ffffff';

  override onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.engine.drawWidth;
    const h = this.engine.drawHeight;
    const progress = this.progress; // 0 → 1

    // solid dark background (same as engine / test_scene_1)
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, w, h);

    // centered "loading"
    ctx.fillStyle = this.fg;
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('loading', w / 2, h / 2 - 24);

    // terminal-style block progress bar
    const barWidth = 20; // number of characters inside the brackets
    const filled = Math.round(progress * barWidth);
    const empty = barWidth - filled;

    const bar =
      '[' +
      '█'.repeat(filled) +
      '░'.repeat(empty) +
      ']';

    ctx.font = '14px monospace';
    ctx.fillText(bar, w / 2, h / 2 + 8);

    // percentage
    ctx.font = '12px monospace';
    ctx.fillText(`${Math.floor(progress * 100)}%`, w / 2, h / 2 + 32);
  }

  // Already using suppressPlayButton: true on the Engine,
  // so resolve immediately and start as soon as assets are ready.
  // (If audio is added later, consider requiring a real user click here.)
  override async onUserAction(): Promise<void> {
    return;
  }
}
