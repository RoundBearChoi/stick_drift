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
 * - samples keyboard once per visual frame (every frame because we don't wanna miss any input).
 * - exposes pressed / held / released state.
 * - edges are cleared in endFrame() after all fixed steps finish.
 * - does not implement Tickable; other systems simply read from it during their own fixedUpdate.
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

  /** called once per visual frame, before fixed update */
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

    // temp debug
    for (const action of this.pressed) {
      console.log(`${action} pressed`);
    }
    for (const action of this.released) {
      console.log(`${action} released`);
    }
  }

  /** called after all fixed steps of the frame are done. clears edge flags. */
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

  /** for later: support rebinding */
  setBinding(action: InputAction, key: Keys): void {
    this.bindings.set(action, key);
  }
}
