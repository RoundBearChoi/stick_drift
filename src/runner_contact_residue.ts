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

/** 2px into the solid. bump this if the line disappears at 1x scale. */
export const RESIDUE_THICKNESS = 2;

/** extra pixels leaking into air so the line reads as light, not paint */
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
 * stamps axis-aligned segments after movement resolve, grows into the solid,
 * fades over 1s. does not paint spike faces or out-of-bounds solids.
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

    // exclusive bottom edge — first pixel not inside the collider
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
      // slow radioactive pulse — tied to the face coord so neighbors don't sync
      const pulse =
        0.82 + 0.18 * (0.5 + 0.5 * Math.sin((this._tick + seg.a) * 0.21));
      const energy = fade * pulse;

      // air-side halo first so the hot core stays sharp on top
      for (let i = RESIDUE_GLOW_PX; i >= 1; i--) {
        const falloff = (RESIDUE_GLOW_PX + 1 - i) / (RESIDUE_GLOW_PX + 1);
        const glow = Color.fromRGB(
          green.r,
          Math.min(255, green.g + 40),
          Math.min(255, green.b + 20),
          energy * 0.28 * falloff
        );
        this.drawLayer(ctx, seg, -seg.inward * i, glow, 1);
      }

      // brick-side core: surface pixel is near-white, inner pixel stays green
      for (let i = 0; i < RESIDUE_THICKNESS; i++) {
        const hot = i === 0 ? shine : shine * 0.35;
        const core = Color.fromRGB(
          green.r + (white.r - green.r) * hot,
          green.g + (white.g - green.g) * hot,
          green.b + (white.b - green.b) * hot,
          Math.min(1, energy * (i === 0 ? 1 : 0.7))
        );
        this.drawLayer(ctx, seg, seg.inward * i, core, 0);
      }
    }
  }

  /**
   * glowExtend stretches the line 1px past each end so floor/wall corners bloom.
   */
  private drawLayer(
    ctx: ExcaliburGraphicsContext,
    seg: ResidueSeg,
    offsetFromFace: number,
    color: Color,
    glowExtend: number
  ): void {
    const start = seg.start - glowExtend;
    const end = seg.end + glowExtend;

    if (seg.axis === 'h') {
      const y = seg.a + offsetFromFace;
      ctx.drawLine(vec(start, y), vec(end, y), color, 1);
    } else {
      const x = seg.a + offsetFromFace;
      ctx.drawLine(vec(x, start), vec(x, end), color, 1);
    }
  }
}
