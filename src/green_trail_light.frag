#version 300 es
precision highp float;

uniform vec2 u_quad_size;      // view size in world px
uniform vec2 u_origin;         // world pos of the view's top-left
uniform float u_particles[300]; // 100 slots, xyz packed. z < 0 is off
uniform int u_count;

in vec2 v_uv;
out vec4 fragColor;

const vec3 HOT = vec3(1.0, 1.0, 0.92);
const vec3 COOL = vec3(0.314, 0.980, 0.482); // #50fa7b
const float FALLOFF_POWER = 2.2; // 1 = linear. higher = the drop steepens toward the end
const float COLOR_POWER = 1.6;   // white cools to green faster than the energy dies
const float RADIUS = 10.0;       // world px at birth
const float GAIN = 1.75;

void main() {
  if (u_count <= 0) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 world = u_origin + v_uv * u_quad_size;
  vec3 accum = vec3(0.0);

  for (int i = 0; i < 100; i++) {
    if (i >= u_count) break;

    int base = i * 3;
    float p = u_particles[base + 2];
    if (p < 0.0) continue;
    p = clamp(p, 0.0, 1.0);

    // holds, then the decrease accelerates, zero at 1
    float strength = 1.0 - pow(p, FALLOFF_POWER);
    if (strength <= 0.0) continue;

    float radius = mix(RADIUS, 2.0, p);
    vec2 pos = vec2(u_particles[base], u_particles[base + 1]);
    float d = length(world - pos);
    float spatial = exp(-(d * d) / (radius * radius));

    float heat = pow(1.0 - p, COLOR_POWER); // 1 = white, 0 = trail green
    vec3 col = mix(COOL, HOT, heat);
    accum += col * spatial * strength * GAIN;
  }

  // soft knee so stacked halos do not clip to a flat white block
  vec3 lit = accum / (1.0 + accum);
  float a = max(lit.r, max(lit.g, lit.b));
  fragColor = vec4(lit * a, a);
}
