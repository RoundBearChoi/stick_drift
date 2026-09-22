import { Scene, Label, vec, CoordPlane, TransformComponent, Engine, Keys } from 'excalibur';
import { createTopLeftFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';
import { NATIVE_RESOLUTION } from './game_context';
import { BrickType, DEFAULT_BRICK_TYPE, nextBrickType } from './brick_type';
import {
  SpikeType,
  SpikeFacing,
  DEFAULT_SPIKE_TYPE,
  DEFAULT_SPIKE_FACING,
  nextSpikeFacingClockwise,
  spikeFacingLabel,
} from './spike_type';
import { assignZ } from './z_order';

export enum EditorMode {
  PlaceObjects = 'place objects',
  SelectObjects = 'select objects',
}

export enum ObjectCategory {
  Bricks = 'bricks',
  Spikes = 'spikes',
}

export const OBJECT_CATEGORIES = Object.values(ObjectCategory) as ObjectCategory[];

const LINE_SIZE = 5;
const LINE_GAP = 3;
const LINE_COUNT = 4;
const PAD = 8;

export class EditorModeOverlay {
  private label?: Label;
  private _mode: EditorMode = EditorMode.PlaceObjects;
  private _category: ObjectCategory = ObjectCategory.Bricks;
  private _brickType: BrickType = DEFAULT_BRICK_TYPE;
  private _spikeType: SpikeType = DEFAULT_SPIKE_TYPE;
  private _spikeFacing: SpikeFacing = DEFAULT_SPIKE_FACING;

  get mode(): EditorMode {
    return this._mode;
  }

  get category(): ObjectCategory {
    return this._category;
  }

  get brickType(): BrickType {
    return this._brickType;
  }

  get spikeType(): SpikeType {
    return this._spikeType;
  }

  get spikeFacing(): SpikeFacing {
    return this._spikeFacing;
  }

  attach(scene: Scene): void {
    if (!this.label) {
      // 4 lines of 5px + 3 gaps of 3px, then 8px bottom pad
      const blockHeight = LINE_COUNT * LINE_SIZE + (LINE_COUNT - 1) * LINE_GAP;
      this.label = new Label({
        text: this.formatText(),
        pos: vec(PAD, NATIVE_RESOLUTION.height - PAD - blockHeight),
        font: createTopLeftFont(),
      });
      this.label.color = DraculaColorScheme.white;
      this.label.get(TransformComponent)!.coordPlane = CoordPlane.Screen;
      assignZ(this.label, 'hud');
    }

    scene.add(this.label);
    this.refresh();
  }

  handleInput(engine: Engine): void {
    if (engine.input.keyboard.wasPressed(Keys.Digit0)) {
      this.toggleMode();
    }
    if (engine.input.keyboard.wasPressed(Keys.Digit1)) {
      this.cycleCategory();
    }
    if (engine.input.keyboard.wasPressed(Keys.Digit2)) {
      this.cycleType();
    }
    if (isCtrlHeld(engine) && engine.input.keyboard.wasPressed(Keys.R)) {
      this.cycleSpikeFacing();
    }
  }

  private toggleMode(): void {
    this._mode =
      this._mode === EditorMode.PlaceObjects
        ? EditorMode.SelectObjects
        : EditorMode.PlaceObjects;
    this.refresh();
  }

  private cycleCategory(): void {
    const i = OBJECT_CATEGORIES.indexOf(this._category);
    this._category = OBJECT_CATEGORIES[(i + 1) % OBJECT_CATEGORIES.length];
    this.refresh();
  }

  private cycleType(): void {
    if (this._category !== ObjectCategory.Bricks) return;
    this._brickType = nextBrickType(this._brickType);
    this.refresh();
  }

  private cycleSpikeFacing(): void {
    this._spikeFacing = nextSpikeFacingClockwise(this._spikeFacing);
    this.refresh();
  }

  private refresh(): void {
    if (this.label) {
      this.label.text = this.formatText();
    }
  }

  private formatText(): string {
    const typeLabel =
      this._category === ObjectCategory.Bricks
        ? this._brickType
        : this._spikeType;

    return [
      `[0] MODE : ${this._mode.toUpperCase()}`,
      `[1] OBJECT CATEGORY : ${this._category.toUpperCase()}`,
      `[2] TYPE : ${typeLabel}`,
      `[CTRL+R] SPIKE FACING : ${spikeFacingLabel(this._spikeFacing)}`,
    ].join('\n');
  }
}

export function isCtrlHeld(engine: Engine): boolean {
  const kb = engine.input.keyboard;
  return kb.isHeld(Keys.ControlLeft) || kb.isHeld(Keys.ControlRight);
}
