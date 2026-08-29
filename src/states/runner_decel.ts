import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';

export class RunnerDecel implements RunnerState {
  readonly state_name = RunnerStateName.DECEL;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.decel_animation_tick_per_frames
    );
  }

  onFixedUpdate(
    _runner: StickRunner,
    _input: InputInterpreter,
    _runnerCtx: RunnerContext
  ): void {
    // animation only for now — no state transitions or decel physics yet
  }
}
