import {
  Actor,
  Color,
  Engine,
  Material,
  Rectangle,
  vec,
} from 'excalibur';
import { RUNNER_DEATH_DELAY_TICKS } from './on_runner_death';

export const BLOOD_SPLATTER_SIZE = 128;

/**
 * raw GLSL ES 300 — no ex.glsl helper.
 * paints quantized droplets over a placeholder quad.
 * output is premultiplied to match Excalibur's pipeline.
 */
const FRAGMENT = `#version 300 es
precision mediump float;

uniform float u_progress;
uniform float u_seed;
uniform vec2 u_quad_size;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + u_seed) * 43758.5453);
}

void main() {
  vec2 pixel = floor(v_uv * u_quad_size);
  vec2 origin = floor(u_quad_size * 0.5);

  float p = clamp(u_progress, 0.0, 1.0);
  // strong ease-out over the full window: most distance in the first ticks,
  // then a long decelerating crawl instead of stopping early.
  float travel = 1.0 - pow(1.0 - p, 3.4);
  // stay solid longer, then ease alpha out over the last third
  float fade = 1.0 - smoothstep(0.68, 1.0, p);
  fade = pow(fade, 0.7);

  float hit = 0.0;
  float tone = 0.0;

  // noisy speckled core instead of a solid blob
  float coreR = mix(8.0, 2.0, travel);
  float dCore = length(pixel - origin);
  if (dCore < coreR && hash(pixel + 3.1) > mix(0.35, 0.82, p)) {
    hit = 1.0;
    tone = hash(pixel);
  }

  const int DROPLETS = 220;
  for (int i = 0; i < DROPLETS; i++) {
    float fi = float(i);
    float ang = hash(vec2(fi, u_seed)) * 6.2831853;
    float spd = 10.0 + hash(vec2(fi, 19.2)) * 50.0;
    // almost all 1px, occasional 2px
    float size = hash(vec2(fi, 7.7)) > 0.82 ? 2.0 : 1.0;
    vec2 dir = vec2(cos(ang), sin(ang));
    dir.y += 0.35;
    dir = normalize(dir);

    vec2 drop = floor(origin + dir * spd * travel);
    vec2 d = abs(pixel - drop);
    if (max(d.x, d.y) < size) {
      hit = 1.0;
      tone = hash(vec2(fi, 4.4));
    }
  }

  if (hit < 0.5 || fade <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 red = vec3(1.0, 0.333, 0.333);
  vec3 deep = vec3(0.72, 0.10, 0.12);
  vec3 dark = vec3(0.42, 0.06, 0.08);
  vec3 rgb = tone < 0.72 ? red : (tone < 0.92 ? deep : dark);

  fragColor = vec4(rgb * fade, fade);
}
`;

/**
 * world-space splat quad. lives as its own actor so hiding the runner
 * does not also hide the effect (materials only run when a graphic draws).
 */
export class BloodSplatter extends Actor {
  private _material: Material | null = null;
  private _ticks = 0;
  private _playing = false;
  private _seed = 1;

  constructor() {
    super({
      name: 'BloodSplatter',
      anchor: vec(0.5, 0.5),
    });

    this.graphics.use(
      new Rectangle({
        width: BLOOD_SPLATTER_SIZE,
        height: BLOOD_SPLATTER_SIZE,
        color: Color.White,
      })
    );
    this.graphics.visible = false;
    this.graphics.forceOnScreen = true;
  }

  ensureMaterial(engine: Engine): void {
    if (this._material) return;

    this._material = engine.graphicsContext.createMaterial({
      name: 'pixel-blood-splatter',
      fragmentSource: FRAGMENT,
    });
    this.graphics.material = this._material;
  }

  start(worldX: number, worldY: number, seed: number): void {
    this.pos = vec(Math.floor(worldX), Math.floor(worldY));
    this._seed = seed === 0 ? 1 : seed;
    this._ticks = 0;
    this._playing = true;
    this.graphics.visible = true;
    this.pushUniforms();
  }

  stop(): void {
    this._playing = false;
    this._ticks = 0;
    this.graphics.visible = false;
  }

  tick(): void {
    if (!this._playing) return;
    if (this._ticks < RUNNER_DEATH_DELAY_TICKS) this._ticks++;
    this.pushUniforms();
  }

  get playing(): boolean {
    return this._playing;
  }

  private pushUniforms(): void {
    if (!this._material) return;
    const progress = this._ticks / RUNNER_DEATH_DELAY_TICKS;
    this._material.update((shader) => {
      shader.trySetUniformFloat('u_progress', progress);
      shader.trySetUniformFloat('u_seed', this._seed);
      shader.trySetUniformFloatVector(
        'u_quad_size',
        vec(BLOOD_SPLATTER_SIZE, BLOOD_SPLATTER_SIZE)
      );
    });
  }
}
