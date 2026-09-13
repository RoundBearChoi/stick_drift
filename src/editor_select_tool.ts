import {
  Actor,
  Color,
  Engine,
  ExcaliburGraphicsContext,
  PointerButton,
  Scene,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { brickDef } from './brick_type';
import { spikeDef } from './spike_type';
import { arrBrickPlacement, arrSpikePlacement } from './level_context';
import { DraculaColorScheme } from './dracula_color_scheme';
import { getEditorWorldPos } from './editor_world_pos';

const DRAG_THRESHOLD = 4;

type SelectableSolid =
  | { kind: 'brick'; item: arrBrickPlacement; width: number; height: number }
  | { kind: 'spike'; item: arrSpikePlacement; width: number; height: number };

export class EditorSelectTool {
  private readonly selected = new Set<number>();
  private overlay?: Actor;
  private active = false;
  private isHoldingLeftClick = false;
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
      if (!this.active) return;

      const color = DraculaColorScheme.cyan;

      for (const s of this.selectedSolids()) {
        drawRectOutline(ctx, s.item.x, s.item.y, s.width, s.height, color);
      }

      if (this.boxing) {
        const box = this.currentBox();
        drawRectOutline(ctx, box.x, box.y, box.w, box.h, color);
      }
    };

    this.scene.add(this.overlay);
  }

  setActive(active: boolean): void {
    this.active = active;
    if (!active) {
      this.cancelDrag();
    }
  }

  handle(engine: Engine): void {
    if (!this.active) return;

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

    if (this.isHoldingLeftClick && world) {
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
    this.isHoldingLeftClick = false;
    this.boxing = false;
  }

  clear(): void {
    this.selected.clear();
    this.cancelDrag();
  }

  private beginPress(): void {
    this.isHoldingLeftClick = true;
    this.boxing = false;
    this.startX = this.currentX;
    this.startY = this.currentY;
  }

  private endPress(): void {
    if (!this.isHoldingLeftClick) return;

    if (this.boxing) {
      this.selectInBox();
    } else {
      this.selectAtPoint(this.currentX, this.currentY);
    }

    this.isHoldingLeftClick = false;
    this.boxing = false;
  }

  private allSolids(): SelectableSolid[] {
    const bricks: SelectableSolid[] = this.gameCtx.level_ctx.bricks.map((item) => {
      const { width, height } = brickDef(item.type);
      return { kind: 'brick', item, width, height };
    });
    const spikes: SelectableSolid[] = this.gameCtx.level_ctx.spikes.map((item) => {
      const { width, height } = spikeDef(item.type);
      return { kind: 'spike', item, width, height };
    });
    return [...bricks, ...spikes];
  }

  private selectAtPoint(wx: number, wy: number): void {
    this.selected.clear();
    const hit = this.hitSolid(wx, wy);
    if (hit) {
      this.selected.add(hit.item.id);
    }
  }

  private selectInBox(): void {
    this.selected.clear();
    const box = this.currentBox();
    for (const s of this.allSolids()) {
      if (rectsOverlap(box.x, box.y, box.w, box.h, s.item.x, s.item.y, s.width, s.height)) {
        this.selected.add(s.item.id);
      }
    }
  }

  private hitSolid(wx: number, wy: number): SelectableSolid | null {
    const solids = this.allSolids().sort((a, b) => b.item.id - a.item.id);
    for (const s of solids) {
      if (
        wx >= s.item.x &&
        wy >= s.item.y &&
        wx < s.item.x + s.width &&
        wy < s.item.y + s.height
      ) {
        return s;
      }
    }
    return null;
  }

  private selectedSolids(): SelectableSolid[] {
    return this.allSolids().filter((s) => this.selected.has(s.item.id));
  }

  private currentBox(): { x: number; y: number; w: number; h: number } {
    const x = Math.min(this.startX, this.currentX);
    const y = Math.min(this.startY, this.currentY);
    const w = Math.abs(this.currentX - this.startX);
    const h = Math.abs(this.currentY - this.startY);
    return { x, y, w, h };
  }
}

function drawRectOutline(
  ctx: ExcaliburGraphicsContext,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Color
): void {
  ctx.drawLine(vec(x, y), vec(x + w, y), color, 1);
  ctx.drawLine(vec(x + w, y), vec(x + w, y + h), color, 1);
  ctx.drawLine(vec(x + w, y + h), vec(x, y + h), color, 1);
  ctx.drawLine(vec(x, y + h), vec(x, y), color, 1);
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
