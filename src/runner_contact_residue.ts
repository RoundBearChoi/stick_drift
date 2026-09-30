import {
  Actor,
  Color,
  Engine,
  Material,
  Rectangle,
  vec,
} from 'excalibur';
import { Tickable } from './tickable';
import { GameContext, NATIVE_RESOLUTION } from './game_context';
import { StickRunner } from './stick_runner';
import {
  SolidGridSystem,
  CELL_SIZE,
  CELL_SPIKE_UP,
  CELL_SPIKE_RIGHT,
  CELL_SPIKE_LEFT,
} from './solid_grid_system';

/** air-side pulse height in pixels at birth */
export const RESIDUE_GLOW_PX = 3;

/** 1s at 60 Hz */
export const RESIDUE_LIFE_TICKS = 60;

const MAX_SEGS = 64;

/**
 * raw GLSL ES 300 — same path as blood_splatter.
 * each fragment is one native pixel of a camera-sized quad.
 * CPU still owns contact stamps; the shader only paints edge + air pulse.
 * colors are hardcoded like blood_splatter (0.32 has no vec3 uniform helper).
 */
const FRAGMENT = `#version 300 es
precision mediump float;

uniform vec2 u_origin;
uniform vec2 u_quad_size;
uniform float u_tick;
uniform float u_life;
uniform float u_glow_px;
uniform float u_count;

uniform float u_a[${MAX_SEGS}];
uniform float u_start[${MAX_SEGS}];
uniform float u_end[${MAX_SEGS}];
uniform float u_inward[${MAX_SEGS}];
uniform float u_axis[${MAX_SEGS}];
uniform float u_born[${MAX_SEGS}];

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 world = u_origin + v_uv * u_quad_size;
  vec3 acc_rgb = vec3(0.0);
  float acc_a = 0.0;

  // Dracula green #50fa7b / foreground #f8f8f2
  vec3 green = vec3(0.314, 0.980, 0.482);
  vec3 white = vec3(0.973, 0.973, 0.949);

  int count = int(u_count);
  for (int i = 0; i < ${MAX_SEGS}; i++) {
    if (i >= count) break;

    float axis = u_axis[i];
    float a = u_a[i];
    float start = u_start[i];
    float end = u_end[i];
    float inward = u_inward[i];
    float born = u_born[i];

    float along = mix(world.x, world.y, axis);
    float perp = mix(world.y, world.x, axis);
    if (along < start || along >= end) continue;

    float t = clamp((u_tick - born) / u_life, 0.0, 1.0);
    float fade = 1.0 - t;
    float shine = max(0.0, 1.0 - t * 2.0);
    float pulse = 0.82 + 0.18 * (0.5 + 0.5 * sin((u_tick + a) * 0.21));
    float height = u_glow_px * fade;

    for (int k = 1; k <= 4; k++) {
      float fi = float(k);
      if (fi > u_glow_px) break;
      float remain = height - (fi - 1.0);
      if (remain <= 0.0) continue;
      float layer = min(1.0, remain);
      float falloff = (u_glow_px + 1.0 - fi) / (u_glow_px + 1.0);
      float glow_a = fade * pulse * 0.32 * falloff * layer;
      float glow_perp = a - inward * fi;
      if (abs(perp - glow_perp) <= 0.5) {
        vec3 glow_rgb = vec3(green.r, min(1.0, green.g + 40.0 / 255.0), min(1.0, green.b + 20.0 / 255.0));
        acc_rgb = max(acc_rgb, glow_rgb * glow_a);
        acc_a = max(acc_a, glow_a);
      }
    }

    float edge_offset = 0.5 - inward * 0.25;
    float edge_center = a + edge_offset;
    if (abs(perp - edge_center) <= 0.25) {
      vec3 edge_rgb = mix(green, white, shine);
      acc_rgb = max(acc_rgb, edge_rgb * fade);
      acc_a = max(acc_a, fade);
    }
  }

  if (acc_a <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  fragColor = vec4(acc_rgb, acc_a);
}
`;

interface ResidueSeg {
  axis: 'h' | 'v';
  a: number;
  start: number;
  end: number;
  inward: number;
  born: number;
}

function zeroArray(len: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < len; i++) out.push(0);
  return out;
}

/**
 * visual-only residue on floors, walls, and level bounds the runner collider touches.
 * CPU stamps contacts; GLSL paints the 0.5px edge and the shrinking air pulse.
 */
export class RunnerContactResidue implements Tickable {
  private _solid_grid: SolidGridSystem | null = null;
  private readonly _segments: ResidueSeg[] = [];
  private _tick = 0;
  private readonly _actor: Actor;
  private _added = false;
  private _material: Material | null = null;

  private readonly _u_a = zeroArray(MAX_SEGS);
  private readonly _u_start = zeroArray(MAX_SEGS);
  private readonly _u_end = zeroArray(MAX_SEGS);
  private readonly _u_inward = zeroArray(MAX_SEGS);
  private readonly _u_axis = zeroArray(MAX_SEGS);
  private readonly _u_born = zeroArray(MAX_SEGS);

  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {
    this._actor = new Actor({
      name: 'RunnerContactResidue',
      pos: vec(0, 0),
      anchor: vec(0, 0),
      z: 1,
    });
    this._actor.graphics.use(
      new Rectangle({
        width: NATIVE_RESOLUTION.width,
        height: NATIVE_RESOLUTION.height,
        color: Color.White,
      })
    );
    this._actor.graphics.forceOnScreen = true;
    this._actor.graphics.onPreDraw = () => {
      this.syncQuadToCamera();
      this.pushUniforms();
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

  ensureMaterial(engine: Engine): void {
    if (this._material) return;

    this._material = engine.graphicsContext.createMaterial({
      name: 'pixel-contact-residue',
      fragmentSource: FRAGMENT,
    });
    this._actor.graphics.material = this._material;
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

  private syncQuadToCamera(): void {
    const camera = this._actor.scene?.camera;
    if (!camera) return;
    const vp = camera.viewport;
    this._actor.pos = vec(Math.floor(vp.left), Math.floor(vp.top));
  }

  private pushUniforms(): void {
    if (!this._material) {
      const engine = this._actor.scene?.engine;
      if (engine) this.ensureMaterial(engine);
      if (!this._material) return;
    }

    const n = Math.min(this._segments.length, MAX_SEGS);
    const startIndex = this._segments.length - n;
    this._u_a.fill(0);
    this._u_start.fill(0);
    this._u_end.fill(0);
    this._u_inward.fill(0);
    this._u_axis.fill(0);
    this._u_born.fill(0);

    for (let i = 0; i < n; i++) {
      const seg = this._segments[startIndex + i];
      this._u_a[i] = seg.a;
      this._u_start[i] = seg.start;
      this._u_end[i] = seg.end;
      this._u_inward[i] = seg.inward;
      this._u_axis[i] = seg.axis === 'v' ? 1 : 0;
      this._u_born[i] = seg.born;
    }

    const origin = this._actor.pos;

    this._material.update((shader) => {
      shader.trySetUniformFloatVector('u_origin', origin);
      shader.trySetUniformFloatVector(
        'u_quad_size',
        vec(NATIVE_RESOLUTION.width, NATIVE_RESOLUTION.height)
      );
      shader.trySetUniformFloat('u_tick', this._tick);
      shader.trySetUniformFloat('u_life', RESIDUE_LIFE_TICKS);
      shader.trySetUniformFloat('u_glow_px', RESIDUE_GLOW_PX);
      shader.trySetUniformFloat('u_count', n);
      shader.trySetUniformFloatArray('u_a', this._u_a);
      shader.trySetUniformFloatArray('u_start', this._u_start);
      shader.trySetUniformFloatArray('u_end', this._u_end);
      shader.trySetUniformFloatArray('u_inward', this._u_inward);
      shader.trySetUniformFloatArray('u_axis', this._u_axis);
      shader.trySetUniformFloatArray('u_born', this._u_born);
    });
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

    const floorY = Math.floor(bottom);
    this.stampRuns(
      'h',
      floorY,
      +1,
      x0,
      x1,
      (x) => this.isPaintable(grid, x, floorY, CELL_SPIKE_UP)
    );

    const ceilY = Math.floor(top - 1);
    if (ceilY < 0) {
      this.stampRuns(
        'h',
        ceilY,
        -1,
        x0,
        x1,
        (x) => this.isPaintable(grid, x, ceilY, 0)
      );
    }

    const leftX = Math.floor(left - 1);
    this.stampRuns(
      'v',
      leftX,
      -1,
      y0,
      y1,
      (y) => this.isPaintable(grid, leftX, y, CELL_SPIKE_RIGHT)
    );

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

    if (
      cellX < 0 ||
      cellX >= grid.widthCells ||
      cellY < 0 ||
      cellY >= grid.heightCells
    ) {
      return true;
    }
    if (!grid.isSolid(cellX, cellY)) return false;
    if (spikeFlag !== 0 && grid.hasFlag(cellX, cellY, spikeFlag)) return false;
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
}
