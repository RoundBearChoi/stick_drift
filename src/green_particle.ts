import { Actor, Color, Engine, Material, Rectangle, vec } from 'excalibur';
import FRAGMENT from './green_particle.frag';

/** quad the shader paints into. the bulb itself is a few cells inside it. */
export const GREEN_PARTICLE_SIZE = 48;

/** bulb center, in cells from the quad's top-left. kept near the bottom-left. */
const BULB_CELL = vec(5, GREEN_PARTICLE_SIZE - 8);

export class GreenParticle extends Actor {
  private _material: Material | null = null;

  constructor() {
    super({
      name: 'GreenParticle',
      anchor: vec(0, 0), // top-left, same pivot as bricks
    });

    this.graphics.use(
      new Rectangle({
        width: GREEN_PARTICLE_SIZE,
        height: GREEN_PARTICLE_SIZE,
        color: Color.White, // shader replaces this
      })
    );
    this.graphics.forceOnScreen = true;
  }

  ensureMaterial(engine: Engine): void {
    if (this._material) return;

    this._material = engine.graphicsContext.createMaterial({
      name: 'green-particle',
      fragmentSource: FRAGMENT,
    });
    this.graphics.material = this._material;
    this.pushUniforms();
  }

  /**
   * quad sits inside the level's bottom-left corner.
   * the bulb is near that corner; the rest of the quad is the glow.
   */
  placeAtLevelBottomLeft(levelWidthPx: number, levelHeightPx: number): void {
    void levelWidthPx;
    this.pos = vec(0, levelHeightPx - GREEN_PARTICLE_SIZE);
    this.pushUniforms();
  }

  private pushUniforms(): void {
    if (!this._material) return;
    this._material.update((shader) => {
      shader.trySetUniformFloatVector(
        'u_quad_size',
        vec(GREEN_PARTICLE_SIZE, GREEN_PARTICLE_SIZE)
      );
      shader.trySetUniformFloatVector('u_bulb_cell', BULB_CELL);
    });
  }
}
