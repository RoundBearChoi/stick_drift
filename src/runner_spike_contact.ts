import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { RunnerContext } from './runner_context';
import {
  SolidGridSystem,
  CELL_SIZE,
  CELL_SPIKE_UP,
  CELL_SPIKE_RIGHT,
  CELL_SPIKE_DOWN,
  CELL_SPIKE_LEFT,
} from './solid_grid_system';

export function checkSpikeContact(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGridSystem: SolidGridSystem
): boolean {
  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const top = runnerY - runnerCtx.collider_height;
  const bottom = runnerY;

  if (anyFlagOnHorizontalEdge(left, right, bottom, CELL_SPIKE_UP, solidGridSystem)) {
    return true;
  }
  if (anyFlagOnHorizontalEdge(left, right, top - 1, CELL_SPIKE_DOWN, solidGridSystem)) {
    return true;
  }
  if (anyFlagOnVerticalEdge(top, bottom, right, CELL_SPIKE_RIGHT, solidGridSystem)) {
    return true;
  }
  if (anyFlagOnVerticalEdge(top, bottom, left - 1, CELL_SPIKE_LEFT, solidGridSystem)) {
    return true;
  }

  return false;
}

function anyFlagOnHorizontalEdge(
  left: number,
  right: number,
  worldY: number,
  flag: number,
  solidGrid: SolidGridSystem
): boolean {
  const row = Math.floor(worldY / CELL_SIZE);
  const colStart = Math.floor(left / CELL_SIZE);
  const colEnd = Math.floor((right - 1) / CELL_SIZE);

  for (let col = colStart; col <= colEnd; col++) {
    if (solidGrid.hasFlag(col, row, flag)) return true;
  }
  return false;
}

function anyFlagOnVerticalEdge(
  top: number,
  bottom: number,
  worldX: number,
  flag: number,
  solidGrid: SolidGridSystem
): boolean {
  const col = Math.floor(worldX / CELL_SIZE);
  const rowStart = Math.floor(top / CELL_SIZE);
  const rowEnd = Math.floor((bottom - 1) / CELL_SIZE);

  for (let row = rowStart; row <= rowEnd; row++) {
    if (solidGrid.hasFlag(col, row, flag)) return true;
  }
  return false;
}

export class RunnerSpikeContactCheck implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly solidGrid: SolidGridSystem
  ) {}

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;
    if (ctx.is_dead) return;

    if (
      !checkSpikeContact(
        this.runner.pos.x,
        this.runner.pos.y,
        ctx,
        this.solidGrid
      )
    ) {
      return;
    }

    ctx.is_dead = true; // not dealing with runner death yet...
    ctx.horizontal_move_buffer = 0;
    ctx.move_down_buffer = 0;
    ctx.current_fall_accel = 0;
    ctx.current_wall_slide_down_accel = 0;
    ctx.cancelUpwardMomentum();

    //console.log('💀 runner hit a spiked face');
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
