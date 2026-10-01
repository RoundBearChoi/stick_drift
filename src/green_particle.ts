import { Actor, Color, Engine, Material, Rectangle, vec } from 'excalibur';
import FRAGMENT from './green_particle.frag';

/**
 * quad the shader paints into.
 * halo radius is 32px, so the quad must be bigger than 64 or the falloff clips.
 */
export const GREEN_PARTICLE_SIZE = 80;

/** bulb center, in cells from the quad's top-left. matches the actor pivot. */
const BULB_CELL = vec(GREEN_PARTICLE_SIZE / 2, GREEN_PARTICLE_SIZE / 2);

export class GreenParticle extends Actor {
  private _material: Material | null = null;

  constructor() {
    super({
      name: 'GreenParticle',
      anchor: vec(0.5, 0.5), // bulb center. pos is the filament, not the quad corner
      width: GREEN_PARTICLE_SIZE,
      height: GREEN_PARTICLE_SIZE,
    });

    this.graphics.use(
      new Rectangle({
        width: GREEN_PARTICLE_SIZE,
        height: GREEN_PARTICLE_SIZE,
        color: Color.White, // shader replaces this
      })
    );
    this.graphics.anchor = vec(0.5, 0.5);
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
   * pos is the bulb center.
   * y = levelHeightPx sits on the bottom edge of the level.
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
