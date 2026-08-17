import { Engine, vec } from 'excalibur';
import { StickRunner } from './stick_runner';

export interface RunnerCreateOptions {
  gapFromCenter?: number;
}

/**
 * scene still owns the runner and is responsible for register / add / unregister.
 */
export function createRunner(
  engine: Engine,
  options: RunnerCreateOptions = {}
): StickRunner {
  const gap = options.gapFromCenter ?? 110;

  return new StickRunner({
    pos: vec(
      320,
      280
    ),
  });
}
