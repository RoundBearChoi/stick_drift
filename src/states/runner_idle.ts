import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerRun } from './runner_run';
import { RunnerFall } from './runner_fall';
import { RunnerJump } from './runner_jump';

export class RunnerIdle implements RunnerState {
  readonly state_name = RunnerStateName.IDLE;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.idle_animation_tick_per_frames
    );
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    // leave ground → fall
    if (!runnerCtx.is_grounded) {
      runner.queueNewState(new RunnerFall());
      return;
    }

    if (input.wasPressed(InputAction.JUMP)) {
      runner.queueNewState(new RunnerJump());
      return;
    }

    const leftPressed = input.wasPressed(InputAction.MOVE_LEFT);
    const rightPressed = input.wasPressed(InputAction.MOVE_RIGHT);
    const leftHeld = input.isHeld(InputAction.MOVE_LEFT);
    const rightHeld = input.isHeld(InputAction.MOVE_RIGHT);

    // trigger run on press *or* held for snappier response
    if (leftPressed || rightPressed || leftHeld || rightHeld) {
      // set facing immediately so the mirror is correct on the first run frame
      if (rightPressed || (rightHeld && !leftHeld)) {
        runner.setFacingRightSide(true);
      } else if (leftPressed || (leftHeld && !rightHeld)) {
        runner.setFacingRightSide(false);
      }

      runner.queueNewState(new RunnerRun());
    }
  }
}
