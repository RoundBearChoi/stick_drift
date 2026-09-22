import { Engine, Keys } from 'excalibur';
import { nextSpikeFacingClockwise, SpikeFacing } from './spike_type';
import { SelectableSolid } from './editor_select_tool';
import { isCtrlHeld } from './editor_mode_overlay';

/**
 * select-mode rotate. place-mode stamp facing is handled by EditorModeOverlay.
 * 16x16 spikes are square — only facing changes, top-left stays put.
 */
export class EditorRotateTool {
  constructor(
    private readonly getSelected: () => SelectableSolid[],
    private readonly onRotated: (id: number, facing: SpikeFacing) => void
  ) {}

  handle(engine: Engine): void {
    if (!isCtrlHeld(engine)) return;
    if (!engine.input.keyboard.wasPressed(Keys.R)) return;

    const selected = this.getSelected();
    let rotated = 0;

    for (const s of selected) {
      if (s.kind !== 'spike') continue;
      s.item.facing = nextSpikeFacingClockwise(s.item.facing);
      this.onRotated(s.item.id, s.item.facing);
      rotated++;
    }

    if (rotated > 0) {
      console.log(`rotated ${rotated} spike(s) 90° clockwise`);
    }
  }
}
