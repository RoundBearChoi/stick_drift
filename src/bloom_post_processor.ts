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
 * blooms every pixel over the knee. no actor or material test.
 */
export class BloomPostProcessor implements PostProcessor {
  private _shader!: ScreenShader;

  threshold = 0.55;
  knee = 0.4;
  intensity = 0.6;
  radius = 2.5; // native texels

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
