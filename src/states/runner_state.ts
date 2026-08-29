import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';

export enum RunnerStateName {
  IDLE = 'idle',
  RUN = 'run',
  RUN_ACCEL = 'run_accel',
  DECEL = 'decel',
  JUMP = 'jump',
  FALL = 'fall',
}

/**
 * IMPORTANT: on every fixed update, runner ctx is passed to the runner.
 * states queue the next state with runner.queueNewState.
 * RunnerStateSwitcher commits after onFixedUpdate returns.
 */
export interface RunnerState {
  readonly state_name: RunnerStateName;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void;
  onFixedUpdate(runner: StickRunner, input: InputInterpreter, runnerCtx: RunnerContext): void;
  onExit?(runner: StickRunner): void;
}
