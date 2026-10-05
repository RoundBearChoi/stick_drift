import {
  Engine,
  ExcaliburGraphicsContextWebGL,
  PostProcessor,
  ScreenShader,
  Shader,
  VertexLayout,
} from 'excalibur';
import FRAGMENT from './bloom.frag';

/**
 * one fullscreen pass on the 640x360 target, before CSS integer scale.
 * prefilter keeps green-dominant pixels only, so the trail dots and light
 * bloom and the bricks and debug text do not.
 */
export class BloomPostProcessor implements PostProcessor {
  private _shader!: ScreenShader;

  threshold = 0.7;
  knee = 0.2;
  intensity = 1.5;
  radius = 5.0; // native texels

  initialize(graphicsContext: ExcaliburGraphicsContextWebGL): void {
    this._shader = new ScreenShader(graphicsContext, FRAGMENT);
  }

  getShader(): Shader {
    return this._shader.getShader();
  }

  getLayout(): VertexLayout {
    return this._shader.getLayout();
  }

  onUpdate(): void {
    const shader = this.getShader();
    shader.trySetUniformFloat('u_threshold', this.threshold);
    shader.trySetUniformFloat('u_knee', this.knee);
    shader.trySetUniformFloat('u_intensity', this.intensity);
    shader.trySetUniformFloat('u_radius', this.radius);
  }

  attach(engine: Engine): void {
    engine.graphicsContext.addPostProcessor(this);
  }
}
