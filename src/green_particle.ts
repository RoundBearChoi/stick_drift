import { Actor, Color, Engine, Material, Rectangle, vec } from 'excalibur';
import FRAGMENT from './green_particle.frag';

/**
 * quad the shader paints into.
 * halo radius is 32px, so the quad must be bigger than 64 or the falloff clips.
 */
export const GREEN_PARTICLE_SIZE = 80;

/** bulb center, in cells from the quad's top-left. */
const BULB_CELL = vec(GREEN_PARTICLE_SIZE / 2, GREEN_PARTICLE_SIZE / 2);

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
   * debug offset so the halo is on screen.
   * bulb is the center of the quad, so the falloff has the same room on every side.
   */
  placeInLevel(levelWidthPx: number, levelHeightPx: number): void {
    void levelWidthPx;
    this.pos = vec(50, levelHeightPx);
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
