import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';

/**
 * Each concrete state owns its own enter / update / exit logic
 * and decides when to transition to another state.
 */
export interface RunnerState {
  readonly name: string;

  /** called once when entering this state */
  enter(runner: StickRunner): void;

  /** called every fixed update. may call runner.setState(...) */
  update(runner: StickRunner, input: InputInterpreter): void;

  /** optional cleanup when leaving this state */
  exit?(runner: StickRunner): void;
}
