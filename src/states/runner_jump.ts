import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerFall } from './runner_fall';
import { RunnerIdle } from './runner_idle';
import { applyAirRun } from '../runner_air_run';

export class RunnerJump implements RunnerState {
  readonly state_name = RunnerStateName.JUMP;

  private _ticks_in_jump = 0; // dedicated fixed update count for jump state. onEnter does not count as an update.
  private _release_hang_started = false; // once this becomes true, jump cannot regain momentum

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    // for now jump reuses idle animation + idle tick rate
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.idle_animation_tick_per_frames
    );

    // states should only write to upward energy
    runnerCtx.current_up_vector = runnerCtx.jump_starting_momentum;
    runnerCtx.jump_momentum_decay_counter = 0;
    // up wins — clear any residual fall so ascent starts clean
    runnerCtx.fall_acceleration = 0;
    runnerCtx.fall_acceleration_counter = 0;
    runnerCtx.move_down_buffer = 0;
    runnerCtx.release_hang_ticks_remaining = 0;

    this._ticks_in_jump = 0;
    this._release_hang_started = false;
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    this._ticks_in_jump++;

    const pastMinJump =
      this._ticks_in_jump > runnerCtx.min_jump_ticks_before_cut;
    const jumpHeld = input.isHeld(InputAction.JUMP);

    if (!this._release_hang_started && pastMinJump && !jumpHeld) {
      this._release_hang_started = true;
      runnerCtx.release_hang_ticks_remaining = runnerCtx.release_hang_time;
    }

    if (this._release_hang_started) {
      if (runnerCtx.release_hang_ticks_remaining > 0) {
        // hang: keep 1 up-force. freeze decay so the resolver cannot eat it.
        runnerCtx.current_up_vector = 1;
        runnerCtx.jump_momentum_decay_counter = 0;
        runnerCtx.release_hang_ticks_remaining--;
      } else {
        runnerCtx.cancelUpwardMomentum();
      }
    }

    // when upward energy is gone, start falling (or idle if we somehow landed)
    if (runnerCtx.current_up_vector <= 0) {
      if (runnerCtx.is_grounded) {
        runner.queueNewState(new RunnerIdle());
      } else {
        runner.queueNewState(new RunnerFall());
      }
      return;
    }

    applyAirRun(input, runnerCtx, this._ticks_in_jump);
  }
}
