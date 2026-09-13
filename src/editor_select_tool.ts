import {
  Actor,
  Engine,
  PointerButton,
  Scene,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { brickDef } from './brick_type';
import { arrBrickPlacement } from './level_context';
import { DraculaColorScheme } from './dracula_color_scheme';
import { getEditorWorldPos } from './editor_world_pos';

const DRAG_THRESHOLD = 4;

/**
 * select-mode pointer behavior.
 * click a brick to select it, click empty to clear, drag a box to multi-select.
 * no move / delete yet.
 */
export class EditorSelectTool {
  private readonly selected = new Set<number>();
  private overlay?: Actor;
  private pressing = false;
  private boxing = false;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;

  constructor(
    private readonly scene: Scene,
    private readonly gameCtx: GameContext
  ) {}

  attach(): void {
    if (this.overlay) {
      this.scene.add(this.overlay);
      return;
    }

    this.overlay = new Actor({
      name: 'EditorSelectOverlay',
      pos: vec(0, 0),
    });
    this.overlay.graphics.forceOnScreen = true;
    this.overlay.graphics.onPostDraw = (ctx) => {
      const color = DraculaColorScheme.cyan;

      for (const b of this.selectedBricks()) {
        const { width, height } = brickDef(b.type);
        ctx.drawRectangle(vec(b.x, b.y), width, height, color, color, 1);
      }

      if (this.boxing) {
        const box = this.currentBox();
        ctx.drawRectangle(
          vec(box.x, box.y),
          box.w,
          box.h,
          color,
          color,
          1
        );
      }
    };

    this.scene.add(this.overlay);
  }

  handle(engine: Engine): void {
    const world = getEditorWorldPos(engine);
    if (world) {
      this.currentX = world.x;
      this.currentY = world.y;
    }

    for (const evt of engine.input.pointers.currentFrameDown) {
      if (evt.button === PointerButton.Left) {
        this.beginPress();
        break;
      }
    }

    if (this.pressing && world) {
      const dx = world.x - this.startX;
      const dy = world.y - this.startY;
      if (!this.boxing && (dx * dx + dy * dy) >= DRAG_THRESHOLD * DRAG_THRESHOLD) {
        this.boxing = true;
      }
    }

    for (const evt of engine.input.pointers.currentFrameUp) {
      if (evt.button === PointerButton.Left) {
        this.endPress();
        break;
      }
    }
  }

  /** drop an in-progress drag without changing the committed selection. */
  cancelDrag(): void {
    this.pressing = false;
    this.boxing = false;
  }

  clear(): void {
    this.selected.clear();
    this.cancelDrag();
  }

  private beginPress(): void {
    this.pressing = true;
    this.boxing = false;
    this.startX = this.currentX;
    this.startY = this.currentY;
  }

  private endPress(): void {
    if (!this.pressing) return;

    if (this.boxing) {
      this.selectInBox();
    } else {
      this.selectAtPoint(this.currentX, this.currentY);
    }

    this.pressing = false;
    this.boxing = false;
  }

  private selectAtPoint(wx: number, wy: number): void {
    this.selected.clear();
    const hit = this.hitBrick(wx, wy);
    if (hit) {
      this.selected.add(hit.id);
    }
  }

  private selectInBox(): void {
    this.selected.clear();
    const box = this.currentBox();
    for (const b of this.gameCtx.level_ctx.bricks) {
      const { width, height } = brickDef(b.type);
      if (rectsOverlap(box.x, box.y, box.w, box.h, b.x, b.y, width, height)) {
        this.selected.add(b.id);
      }
    }
  }

  private hitBrick(wx: number, wy: number): arrBrickPlacement | null {
    const bricks = this.gameCtx.level_ctx.bricks;
    for (let i = bricks.length - 1; i >= 0; i--) {
      const b = bricks[i];
      const { width, height } = brickDef(b.type);
      if (wx >= b.x && wy >= b.y && wx < b.x + width && wy < b.y + height) {
        return b;
      }
    }
    return null;
  }

  private selectedBricks(): arrBrickPlacement[] {
    return this.gameCtx.level_ctx.bricks.filter((b) => this.selected.has(b.id));
  }

  private currentBox(): { x: number; y: number; w: number; h: number } {
    const x = Math.min(this.startX, this.currentX);
    const y = Math.min(this.startY, this.currentY);
    const w = Math.abs(this.currentX - this.startX);
    const h = Math.abs(this.currentY - this.startY);
    return { x, y, w, h };
  }
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
