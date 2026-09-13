import { Scene, Label, vec, CoordPlane, TransformComponent, Engine, Keys } from 'excalibur';
import { createTopLeftFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';
import { NATIVE_RESOLUTION } from './game_context';
import { BrickType, DEFAULT_BRICK_TYPE, nextBrickType } from './brick_type';

export enum EditorMode {
  PlaceObjects = 'place objects',
  SelectObjects = 'select objects',
}

export enum ObjectCategory {
  Bricks = 'bricks',
}

const LINE_SIZE = 5;
const LINE_GAP = 3;
const LINE_COUNT = 3;
const PAD = 8;

export class EditorModeOverlay {
  private label?: Label;
  private _mode: EditorMode = EditorMode.PlaceObjects;
  private _category: ObjectCategory = ObjectCategory.Bricks;
  private _type: BrickType = DEFAULT_BRICK_TYPE;

  get mode(): EditorMode {
    return this._mode;
  }

  get category(): ObjectCategory {
    return this._category;
  }

  get type(): BrickType {
    return this._type;
  }

  attach(scene: Scene): void {
    if (!this.label) {
      // 3 lines of 5px + 2 gaps of 3px, then 8px bottom pad
      const blockHeight = LINE_COUNT * LINE_SIZE + (LINE_COUNT - 1) * LINE_GAP;
      this.label = new Label({
        text: this.formatText(),
        pos: vec(PAD, NATIVE_RESOLUTION.height - PAD - blockHeight),
        font: createTopLeftFont(),
      });
      this.label.color = DraculaColorScheme.white;
      this.label.get(TransformComponent)!.coordPlane = CoordPlane.Screen;
    }

    scene.add(this.label);
    this.refresh();
  }

  handleInput(engine: Engine): void {
    if (engine.input.keyboard.wasPressed(Keys.Digit0)) {
      this.toggleMode();
    }
    if (engine.input.keyboard.wasPressed(Keys.Digit2)) {
      this.cycleType();
    }
  }

  private toggleMode(): void {
    this._mode =
      this._mode === EditorMode.PlaceObjects
        ? EditorMode.SelectObjects
        : EditorMode.PlaceObjects;
    this.refresh();
  }

  private cycleType(): void {
    if (this._category !== ObjectCategory.Bricks) return;
    this._type = nextBrickType(this._type);
    this.refresh();
  }

  private refresh(): void {
    if (this.label) {
      this.label.text = this.formatText();
    }
  }

  private formatText(): string {
    return [
      `[0] MODE : ${this._mode.toUpperCase()}`,
      `[1] OBJECT CATEGORY : ${this._category.toUpperCase()}`,
      `[2] TYPE : ${this._type}`,
    ].join('\n');
  }
}
