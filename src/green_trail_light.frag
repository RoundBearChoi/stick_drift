#version 300 es
precision highp float;

uniform vec2 u_quad_size;      // view size in world px
uniform vec2 u_origin;         // world pos of the view's top-left
uniform float u_particles[300]; // 100 slots, xyz packed. z < 0 is off
uniform int u_count;

in vec2 v_uv;
out vec4 fragColor;

const vec3 HOT = vec3(0.18, 1.0, 0.36);  // saturated birth green, stronger than #50fa7b
const vec3 COOL = vec3(0.314, 0.980, 0.482); // #50fa7b
const float FALLOFF_POWER = 3.0; // 1 = linear. higher = the drop steepens toward the end
const float COLOR_POWER = 3.0;   // bright green cools to the trail green
const float RADIUS = 2.1;       // world px at birth
const float GAIN = 1.2;
const float PEAK_ALPHA = 0.3;   // fresh core starts more transparent

void main() {
  if (u_count <= 0) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 world = u_origin + v_uv * u_quad_size;
  vec3 accum = vec3(0.0);
  float cover = 0.0;

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
    float presence = spatial * strength;

    float heat = pow(1.0 - p, COLOR_POWER); // 1 = bright green, 0 = trail green
    vec3 col = mix(COOL, HOT, heat);
    accum += col * presence * GAIN;
    cover += presence;
  }

  // same curve as strength: opaque-ish at birth, gone at 1. stack cannot go solid
  float a = min(cover, 1.0) * PEAK_ALPHA;
  vec3 lit = accum / (1.0 + accum);
  fragColor = vec4(lit * a, a);
}
