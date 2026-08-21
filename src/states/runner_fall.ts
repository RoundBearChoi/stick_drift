import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';

/**
 * airborne downward state.
 * for now only plays the fall animation — no gravity, no landing, no air control.
 */
export class RunnerFall implements RunnerState {
  readonly state_name = RunnerStateName.FALL;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    // reuse idle tick rate for now; can get its own value later
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
    // empty — gravity + landing will live here later
  }
}
