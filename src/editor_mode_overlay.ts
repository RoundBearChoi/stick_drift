import { Scene, Label, vec, CoordPlane, TransformComponent, Engine, Keys } from 'excalibur';
import { createTopLeftFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';
import { NATIVE_RESOLUTION } from './game_context';

export enum EditorMode {
  PlaceObjects = 'place objects',
  SelectObjects = 'select objects',
}

export class EditorModeOverlay {
  private label?: Label;
  private mode: EditorMode = EditorMode.PlaceObjects;

  attach(scene: Scene): void {
    if (!this.label) {
      this.label = new Label({
        text: this.formatText(),
        pos: vec(8, NATIVE_RESOLUTION.height - 8 - 5),
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
      this.toggle();
    }
  }

  private toggle(): void {
    this.mode =
      this.mode === EditorMode.PlaceObjects
        ? EditorMode.SelectObjects
        : EditorMode.PlaceObjects;
    this.refresh();
  }

  private refresh(): void {
    if (this.label) {
      this.label.text = this.formatText();
    }
  }

  private formatText(): string {
    return `[0] mode : ${this.mode}`;
  }
}
