#version 300 es
precision mediump float;

uniform vec2 u_quad_size;

in vec2 v_uv; // fragment position on the quad, 0 ~ 1
out vec4 fragColor;

void main() {
  vec2 cell = floor(v_uv * u_quad_size);

  if (cell.x < 0.0 || cell.y < 0.0 ||
      cell.x >= u_quad_size.x || cell.y >= u_quad_size.y) {
    fragColor = vec4(0.0);
    return;
  }

  // Dracula green #50fa7b
  fragColor = vec4(0.31372549, 0.98039216, 0.48235294, 1.0);
}
