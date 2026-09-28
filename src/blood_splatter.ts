import {
  Actor,
  Color,
  Engine,
  Material,
  Rectangle,
  vec,
} from 'excalibur';
import { RUNNER_DEATH_DELAY_TICKS } from './on_runner_death';

export const BLOOD_SPLATTER_SIZE = 128; // actor size and quad size

/**
 * raw GLSL ES 300 — no ex.glsl helper.
 */
const FRAGMENT = `#version 300 es
precision mediump float;

uniform float u_progress; // animation clock 0 ~ 1
uniform float u_seed;
uniform vec2 u_quad_size; // we're uploading BLOOD_SPLATTER_SIZE (256 x 256) to GLSL

in vec2 v_uv; // each fragment's position on the quad in 0 ~ 1
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + u_seed) * 43758.5453);
}

void main() {
  vec2 pixel = floor(v_uv * u_quad_size); // get pixel position
  vec2 origin = floor(u_quad_size * 0.5); // center pixel of the quad

  float p = clamp(u_progress, 0.0, 1.0);
  float travel = 1.0 /*moves the graph*/ - pow(1.0 - p, 5.0 /*strength of the curve*/);

  bool is_inside = false;
  float random_color = 0.0;
  float fade = 0.0;

  const int max_particles = 140;

  for (int i = 0; i < max_particles; i++) {
    float fi = float(i);
    float ang = hash(vec2(fi, u_seed)) * 6.2831853;
    float speed = 0.5 /*minimum speed*/ + hash(vec2(fi, 19.2)) * 50.0 /*extra. max speed is this value + min*/;
    float size = hash(vec2(fi, 7.7)) > 0.82 ? 2.0 : 1.0;
    vec2 dir = vec2(cos(ang), sin(ang));
    dir.y += 0.35;
    dir = normalize(dir);

    vec2 drop = floor(origin + dir * speed * travel);
    vec2 d = abs(pixel - drop);
    if (max(d.x, d.y) < size) {
      is_inside = true;
      random_color = hash(vec2(fi, 4.4));
      float deathAt = mix(0.1, 1.5, hash(vec2(fi, 11.3)));
      float fadeLen = mix(0.05, 0.3, hash(vec2(fi, 23.7)));
      float dropFade = 1.0 - smoothstep(deathAt - fadeLen, deathAt, p);
      fade = max(fade, dropFade);
    }
  }

  if (!is_inside || fade <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 red = vec3(1.0, 0.333, 0.333);
  vec3 deep = vec3(0.72, 0.10, 0.12);
  vec3 dark = vec3(0.42, 0.06, 0.08);
  vec3 rgb = random_color < 0.72 ? red : (random_color < 0.92 ? deep : dark);

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
      anchor: vec(0.5, 0.5), // center mass
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
