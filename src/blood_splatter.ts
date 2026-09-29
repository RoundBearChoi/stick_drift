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

// take 2 numbers and turn into a float -> scrambled into 0..1
// fract keeps the fractional part of a float and throws away the whole number, so result is always 0..1
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(284.1, 737.775)) + u_seed) * 13801.2685);
}

/*
in this particular case each cell is 1px
we start with 128x128 quad and decide which cell we wanna render

(0,0) top-left                              (255,0)

      +------------------------------------+
      |                                    |
      |                                    |
      |              origin                |
      |             (128,128)              |
      |                 +                  |
      |                                    |
      |                                    |
      |                                    |
      +------------------------------------+

(0,255)                                     (255,255)

GPU runs main once per cell of the quad
*/

void main() {
  vec2 quad_cell_pos = floor(v_uv * u_quad_size);
  vec2 origin = floor(u_quad_size * 0.5); // center pos of the quad

  float p = clamp(u_progress, 0.0, 1.0);
  float travel = 1.0 /*moves the graph*/ - pow(1.0 - p, 5.5 /*strength of the curve*/);

  bool is_inside = false;
  float random_color = 0.0;
  float cell_opacity = 0.0;

  const int max_particles = 450;

  for (int i = 0; i < max_particles; i++) {
    float fi = float(i);
    float random_angle_radian = hash(vec2(fi, u_seed)) * 6.2831853; // random angle

    vec2 random_dir = vec2(cos(random_angle_radian), sin(random_angle_radian));
    random_dir.y += 0.35;
    random_dir = normalize(random_dir);

    float random_speed = mix(0.5, 80.0, hash(vec2(fi, 19.2)));
    float random_size = mix(0.2, 1.2, hash(vec2(fi, 7.7)));

    vec2 current_particle_pos = floor(origin + random_dir * random_speed * travel);
    vec2 delta = abs(quad_cell_pos - current_particle_pos);

    if (max(delta.x, delta.y) < random_size) {
      is_inside = true;
      random_color = hash(vec2(fi, 4.4));
      float random_death_time = mix(0.005, 0.999, hash(vec2(fi, 11.3)));
      float random_fade_length = mix(0.1, 0.6, hash(vec2(fi, 23.7)));
      cell_opacity = 1.0 - smoothstep(random_death_time - random_fade_length, random_death_time, p);
    }

    /*
    p = 0                                                    p = 1

    |--------- solid ----------|----- fading -----|---- gone ----|
                               ^                  ^
                        start_fade         random_death_time
                        (death - random_fade_length)
    */
  }

  if (!is_inside || cell_opacity <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 blood_a = vec3(0.50, 0.07, 0.08);
  vec3 blood_b = vec3(0.36, 0.04, 0.05);
  vec3 blood_c = vec3(0.22, 0.02, 0.03);
  vec3 rgb = random_color < 0.333 ?
    blood_a :
      (random_color < 0.666 ?
        blood_b : blood_c);

  fragColor = vec4(rgb * cell_opacity, cell_opacity);
}
`;

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
