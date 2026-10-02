#version 300 es
precision mediump float;

uniform float u_progress;

in vec2 v_uv;
out vec4 fragColor;

// only responsible for fading
void main() {
  float p = clamp(u_progress, 0.0, 1.0);
  float fade = 1.0 - smoothstep(0.65, 1.0, p);
  if (fade <= 0.004) {
    fragColor = vec4(0.0);
    return;
  }

  // Dracula green #50fa7b
  vec3 green = vec3(0.31372549, 0.98039216, 0.48235294);
  fragColor = vec4(green * fade, fade);
}
