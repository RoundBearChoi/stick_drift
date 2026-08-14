import { Engine, Keys } from 'excalibur';

export enum InputAction {
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  MOVE_UP = 'MOVE_UP',
  MOVE_DOWN = 'MOVE_DOWN',
  TURBO = 'TURBO',
  JUMP = 'JUMP',
}

/**
 * Thin action-based input interpreter.
 *
 * - Samples keyboard once per visual frame (via sample()).
 * - Exposes pressed / held / released state for the current frame.
 * - Edges are cleared in endFrame() after all fixed steps finish.
 * - Does not implement Tickable; other systems simply read from it
 *   during their own fixedUpdate.
 */
export class InputInterpreter {
  private bindings = new Map<InputAction, Keys>();

  // buffered state for the current visual frame
  private held = new Set<InputAction>();
  private pressed = new Set<InputAction>();
  private released = new Set<InputAction>();

  constructor(private readonly engine: Engine) {
    this.initializeDefaultBindings();
  }

  private initializeDefaultBindings(): void {
    this.bindings.set(InputAction.MOVE_LEFT, Keys.A);
    this.bindings.set(InputAction.MOVE_RIGHT, Keys.D);
    this.bindings.set(InputAction.MOVE_UP, Keys.W);
    this.bindings.set(InputAction.MOVE_DOWN, Keys.S);
    this.bindings.set(InputAction.JUMP, Keys.J);
    this.bindings.set(InputAction.TURBO, Keys.H);
  }

  /** Called once per visual frame, before any fixed steps. */
  sample(): void {
    this.held.clear();
    this.pressed.clear();
    this.released.clear();

    const keyboard = this.engine.input.keyboard;

    for (const [action, key] of this.bindings) {
      if (keyboard.isHeld(key)) {
        this.held.add(action);
      }
      if (keyboard.wasPressed(key)) {
        this.pressed.add(action);
      }
      if (keyboard.wasReleased(key)) {
        this.released.add(action);
      }
    }

    // temporary debug — remove later
    if (this.pressed.size > 0 || this.released.size > 0 || this.held.size > 0) {
      console.log({
        pressed: [...this.pressed],
        held: [...this.held],
        released: [...this.released],
      });
    }
  }

  /** Called after all fixed steps of the frame are done. Clears edge flags. */
  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }

  // ---------- public API ----------

  isHeld(action: InputAction): boolean {
    return this.held.has(action);
  }

  wasPressed(action: InputAction): boolean {
    return this.pressed.has(action);
  }

  wasReleased(action: InputAction): boolean {
    return this.released.has(action);
  }

  /** Later: support rebinding */
  setBinding(action: InputAction, key: Keys): void {
    this.bindings.set(action, key);
  }
}
