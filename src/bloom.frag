#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_threshold;
uniform float u_knee;
uniform float u_intensity;
uniform float u_radius;

in vec2 v_uv;
out vec4 fragColor;

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 prefilter(vec3 c) {
  float br = luma(c);
  float knee = max(u_threshold * u_knee, 1e-4);
  float soft = clamp(br - u_threshold + knee, 0.0, 2.0 * knee);
  soft = (soft * soft) / (4.0 * knee);
  float w = clamp(max(br - u_threshold, soft) / max(br, 1e-4), 0.0, 1.0);
  return c * w;
}

void main() {
  vec3 base = texture(u_image, v_uv).rgb;
  vec2 texel = u_radius / u_resolution;

  vec3 bloom = prefilter(base) * 4.0;
  bloom += prefilter(texture(u_image, v_uv + texel * vec2( 1.0,  0.0)).rgb);
  bloom += prefilter(texture(u_image, v_uv + texel * vec2(-1.0,  0.0)).rgb);
  bloom += prefilter(texture(u_image, v_uv + texel * vec2( 0.0,  1.0)).rgb);
  bloom += prefilter(texture(u_image, v_uv + texel * vec2( 0.0, -1.0)).rgb);
  bloom += prefilter(texture(u_image, v_uv + texel * vec2( 1.0,  1.0)).rgb) * 0.5;
  bloom += prefilter(texture(u_image, v_uv + texel * vec2(-1.0,  1.0)).rgb) * 0.5;
  bloom += prefilter(texture(u_image, v_uv + texel * vec2( 1.0, -1.0)).rgb) * 0.5;
  bloom += prefilter(texture(u_image, v_uv + texel * vec2(-1.0, -1.0)).rgb) * 0.5;
  bloom /= 8.0;

  fragColor = vec4(base + bloom * u_intensity, 1.0);
}
