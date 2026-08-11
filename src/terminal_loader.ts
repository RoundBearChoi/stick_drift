import { DefaultLoader } from 'excalibur';

/**
 * custom loader that mimics a linux terminal style.
 */
export class TerminalLoader extends DefaultLoader {
  private readonly bg = '#282a36';
  private readonly fg = '#ffffff';

  override onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.engine.drawWidth;
    const h = this.engine.drawHeight;
    const progress = this.progress; // 0 → 1

    // solid dark background (same as engine)
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, w, h);

    // centered "LOADING"
    // terminal-style block progress bar
    ctx.fillStyle = this.fg;
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOADING', w / 2, h / 2 - 24); // don't need pixel perfect for this scene
    const barWidth = 20; // number of characters inside the brackets
    const filled = Math.round(progress * barWidth);
    const empty = barWidth - filled;

     const bar =
      '[' +
      '█'.repeat(filled) +
      '░'.repeat(empty) +
      ']';

     /*
    const bar =
      '[' +
      '#'.repeat(filled) +
      '-'.repeat(empty) +
      ']';
      */
    ctx.font = '14px monospace';
    ctx.fillText(bar, w / 2, h / 2 + 8);

    // percentage
    ctx.font = '12px monospace';
    ctx.fillText(`${Math.floor(progress * 100)}%`, w / 2, h / 2 + 32);
  }

  /**
   * must resolve. otherwise engine.start(loader) never finishes and game never starts.
   * built-in loader gets a free pass when suppressPlayButton:true is set. custom loader does not.
   * user-gesture + WebAudio unlock is handled later gesture_scene ("press any key").
   */
  override async onUserAction(): Promise<void> {
    return;
  }
}
