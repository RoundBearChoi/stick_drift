#version 300 es
precision mediump float;

uniform float u_progress; // animation clock 0 ~ 1
uniform float u_seed;
uniform vec2 u_quad_size; // we're uploading BLOOD_SPLATTER_SIZE (256 x 256) to GLSL

in vec2 v_uv; // each fragment's position on the quad in 0 ~ 1
out vec4 fragColor;

// dot collapses p, u_seed shifts it, sin multiplication scrambles it, fract keeps 0 <= result < 1
// sin's range-reduction pi and polynomial are GPU/driver-specific, so this is not stable across machines
// IMPORTANT: though we're looking for randomness in our effects, this hash function isn't random at all.
// it's just that a user can't easily derive runner position -> effect
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(284.1, 737.775)) + u_seed) * 13801.2685);
}

/*
in this particular case each cell is 1px

128x128 quad

(0,0) top-left                              (127,0)

      +------------------------------------+
      |                                    |
      |                                    |
      |               origin               |
      |               (64,64)              |
      |                 +                  |
      |                                    |
      |                                    |
      |                                    |
      +------------------------------------+

(0,127)                                     (127,127)

GPU runs main once per cell of the quad.
we can draw individual particles without each of them being an object.
we pin point each pixel first and then paint, so the direction is reversed from a typical object -> update -> render.
*/

void main() {
  vec2 quad_cell_pos = floor(v_uv * u_quad_size);
  vec2 origin = floor(u_quad_size * 0.5); // center pos of the quad

  float p = clamp(u_progress, 0.0, 1.0);
  float travel = 1.0 /*moves the graph*/ - pow(1.0 - p, 5.5 /*strength of the curve*/);

  bool is_inside = false;
  float random_color = 0.0;
  float cell_opacity = 0.0;

  const int max_particles = 700;

  // since u_seed in this case remains the same, "random color" for nth particle remains same throughout different cells for the quad
  // runner position which is used to create u_seed is the basis for "random color" etc
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
