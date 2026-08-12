import { Engine, vec } from 'excalibur';
import { StickRunner } from './stick_runner';

export interface StickRunnerCreateOptions {
  gapFromCenter?: number;
  advancesPerFrame?: number;
}

/**
 * scene still owns the runner and is responsible for register / add / unregister.
 */
export function createStickRunner(
  engine: Engine,
  options: StickRunnerCreateOptions = {}
): StickRunner {
  const gap = options.gapFromCenter ?? 110;

  return new StickRunner({
    pos: vec(
      engine.halfDrawWidth,
      engine.halfDrawHeight + gap
    ),
    advancesPerFrame: options.advancesPerFrame ?? 4,
  });
}
