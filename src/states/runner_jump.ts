import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';

export class RunnerJump implements RunnerState {
  readonly state_name = RunnerStateName.JUMP;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    // for now jump reuses idle animation + idle tick rate
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.idle_animation_tick_per_frames
    );
  }

  onFixedUpdate(
    _runner: StickRunner,
    _input: InputInterpreter,
    _runnerCtx: RunnerContext
  ): void {
  }
}
