import { Vector, vec } from 'excalibur';
import { StickRunner } from './stick_runner';

export interface RunnerCreateOptions {
  pos?: Vector;
}

/**
 * scene still owns the runner and is responsible for register / add / unregister.
 */
export function createRunner(
  options: RunnerCreateOptions = {}
): StickRunner {
  return new StickRunner({
    pos: options.pos ?? vec(320, 280),
  });
}
