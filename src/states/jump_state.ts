import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerState } from './runner_state';

/**
 * Jump state.
 * Currently has no exit condition because we don't have grounded checks yet.
 * Later this will transition to Idle or Run on landing.
 */
export class JumpState implements RunnerState {
  readonly name = 'jump';

  enter(runner: StickRunner): void {
    runner.playAnimationForState(this.name);
    // later: runner.applyJumpForce();
  }

  update(_runner: StickRunner, _input: InputInterpreter): void {
    // Placeholder.
    // Future landing logic example:
    //
    // if (runner.isGrounded) {
    //   if (input.isHeld(InputAction.MOVE_LEFT) || input.isHeld(InputAction.MOVE_RIGHT)) {
    //     runner.setState(new RunState());
    //   } else {
    //     runner.setState(new IdleState());
    //   }
    // }
  }
}
