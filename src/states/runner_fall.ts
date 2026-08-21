import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';

export class RunnerFall implements RunnerState {
  readonly state_name = RunnerStateName.FALL;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.fall_animation_tick_per_frames
    );
  }

  onFixedUpdate(
    _runner: StickRunner,
    _input: InputInterpreter,
    _runnerCtx: RunnerContext
  ): void {
    // gravity + landing will live here later
  }
}
