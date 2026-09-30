import {
  Actor,
  Color,
  ExcaliburGraphicsContext,
  vec,
} from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import {
  SolidGridSystem,
  CELL_SIZE,
  CELL_SPIKE_UP,
  CELL_SPIKE_RIGHT,
  CELL_SPIKE_LEFT,
} from './solid_grid_system';
import { DraculaColorScheme } from './dracula_color_scheme';

/** air-side pulse height in pixels at birth */
export const RESIDUE_GLOW_PX = 3;

/** 1s at 60 Hz */
export const RESIDUE_LIFE_TICKS = 60;

interface ResidueSeg {
  axis: 'h' | 'v';
  a: number; // y for horizontal, x for vertical
  start: number; // inclusive
  end: number; // exclusive
  inward: number; // +1 or -1 along the perpendicular, into the solid
  born: number;
}

/**
 * visual-only residue on floors and walls the runner collider touches.
 * 0.5px on the air-facing half of the brick edge.
 * pulse lives in the air on the contact side — tallest at birth, shrinks and fades over 1s.
 * does not paint spike faces or out-of-bounds solids.
 */
export class RunnerContactResidue implements Tickable {
  private _solid_grid: SolidGridSystem | null = null;
  private readonly _segments: ResidueSeg[] = [];
  private _tick = 0;
  private readonly _actor: Actor;
  private _added = false;

  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {
    this._actor = new Actor({
      name: 'RunnerContactResidue',
      pos: vec(0, 0),
      anchor: vec(0, 0),
      z: 1, // above default-0 bricks so the line sits on the tile face
    });
    this._actor.graphics.forceOnScreen = true;
    this._actor.graphics.onPostDraw = (ctx) => {
      this.draw(ctx);
    };
  }

  setSolidGrid(solidGrid: SolidGridSystem): void {
    this._solid_grid = solidGrid;
  }

  attachToScene(sceneAdd: (actor: Actor) => void): void {
    if (this._added) return;
    sceneAdd(this._actor);
    this._added = true;
  }

  clear(): void {
    this._segments.length = 0;
    this._tick = 0;
  }

  fixedUpdate(_dt: number): void {
    this._tick++;
    this.cullExpired();

    const ctx = this.gameCtx.runner_ctx;
    if (ctx.is_dead) return;
    if (!this._solid_grid) return;

    this.stampContacts();
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }

  private stampContacts(): void {
    const grid = this._solid_grid!;
    const runnerCtx = this.gameCtx.runner_ctx;
    const halfW = runnerCtx.collider_width / 2;
    const left = this.runner.pos.x - halfW;
    const right = this.runner.pos.x + halfW;
    const top = this.runner.pos.y - runnerCtx.collider_height;
    const bottom = this.runner.pos.y;

    const x0 = Math.floor(left);
    const x1 = Math.floor(right - 1);
    const y0 = Math.floor(top);
    const y1 = Math.floor(bottom - 1);

    // exclusive bottom edge — first pixel not inside the collider (brick top edge)
    const floorY = Math.floor(bottom);
    this.stampRuns(
      'h',
      floorY,
      +1,
      x0,
      x1,
      (x) => this.isPaintable(grid, x, floorY, CELL_SPIKE_UP)
    );

    // flush left column (last solid pixel on the left is left-1)
    const leftX = Math.floor(left - 1);
    this.stampRuns(
      'v',
      leftX,
      -1,
      y0,
      y1,
      (y) => this.isPaintable(grid, leftX, y, CELL_SPIKE_RIGHT)
    );

    // flush right column (first solid pixel on the right is right)
    const rightX = Math.floor(right);
    this.stampRuns(
      'v',
      rightX,
      +1,
      y0,
      y1,
      (y) => this.isPaintable(grid, rightX, y, CELL_SPIKE_LEFT)
    );
  }

  private stampRuns(
    axis: 'h' | 'v',
    a: number,
    inward: number,
    from: number,
    toInclusive: number,
    paintable: (coord: number) => boolean
  ): void {
    let runStart = -1;
    for (let i = from; i <= toInclusive; i++) {
      if (paintable(i)) {
        if (runStart < 0) runStart = i;
      } else if (runStart >= 0) {
        this.stampSeg(axis, a, runStart, i, inward);
        runStart = -1;
      }
    }
    if (runStart >= 0) {
      this.stampSeg(axis, a, runStart, toInclusive + 1, inward);
    }
  }

  private stampSeg(
    axis: 'h' | 'v',
    a: number,
    start: number,
    end: number,
    inward: number
  ): void {
    if (end <= start) return;

    for (const seg of this._segments) {
      if (
        seg.axis === axis &&
        seg.a === a &&
        seg.start === start &&
        seg.end === end &&
        seg.inward === inward
      ) {
        seg.born = this._tick;
        return;
      }
    }

    this._segments.push({ axis, a, start, end, inward, born: this._tick });
  }

  private isPaintable(
    grid: SolidGridSystem,
    worldX: number,
    worldY: number,
    spikeFlag: number
  ): boolean {
    const cellX = Math.floor(worldX / CELL_SIZE);
    const cellY = Math.floor(worldY / CELL_SIZE);

    // isSolid treats out-of-bounds as solid. residue must not paint the void.
    if (
      cellX < 0 ||
      cellX >= grid.widthCells ||
      cellY < 0 ||
      cellY >= grid.heightCells
    ) {
      return false;
    }
    if (!grid.isSolid(cellX, cellY)) return false;
    if (grid.hasFlag(cellX, cellY, spikeFlag)) return false;
    return true;
  }

  private cullExpired(): void {
    const life = RESIDUE_LIFE_TICKS;
    const tick = this._tick;
    let write = 0;
    for (let read = 0; read < this._segments.length; read++) {
      if (tick - this._segments[read].born < life) {
        this._segments[write] = this._segments[read];
        write++;
      }
    }
    this._segments.length = write;
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const life = RESIDUE_LIFE_TICKS;
    const green = DraculaColorScheme.green;
    const white = DraculaColorScheme.white;

    for (const seg of this._segments) {
      const t = Math.min(1, Math.max(0, (this._tick - seg.born) / life));
      const fade = 1 - t;
      const shine = Math.max(0, 1 - t * 2);
      const pulse =
        0.82 + 0.18 * (0.5 + 0.5 * Math.sin((this._tick + seg.a) * 0.21));

      // tallest at birth, shrinks from the outside as the segment ages
      const height = RESIDUE_GLOW_PX * fade;

      for (let i = 1; i <= RESIDUE_GLOW_PX; i++) {
        const remain = height - (i - 1);
        if (remain <= 0) continue;
        const layer = Math.min(1, remain);
        const falloff = (RESIDUE_GLOW_PX + 1 - i) / (RESIDUE_GLOW_PX + 1);
        const glow = Color.fromRGB(
          green.r,
          Math.min(255, green.g + 40),
          Math.min(255, green.b + 20),
          fade * pulse * 0.32 * falloff * layer
        );
        this.drawLayer(ctx, seg, -seg.inward * i, glow, 1);
      }

      // 0.5px on the air-facing half of the brick edge pixel
      const edge = Color.fromRGB(
        green.r + (white.r - green.r) * shine,
        green.g + (white.g - green.g) * shine,
        green.b + (white.b - green.b) * shine,
        fade
      );
      const edgeOffset = 0.5 - seg.inward * 0.25;
      this.drawLayer(ctx, seg, edgeOffset, edge, 0.5);
    }
  }

  private drawLayer(
    ctx: ExcaliburGraphicsContext,
    seg: ResidueSeg,
    offsetFromFace: number,
    color: Color,
    thickness: number
  ): void {
    if (seg.axis === 'h') {
      const y = seg.a + offsetFromFace;
      ctx.drawLine(vec(seg.start, y), vec(seg.end, y), color, thickness);
    } else {
      const x = seg.a + offsetFromFace;
      ctx.drawLine(vec(x, seg.start), vec(x, seg.end), color, thickness);
    }
  }
}
