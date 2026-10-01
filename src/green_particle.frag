#version 300 es
precision mediump float;

uniform vec2 u_quad_size;
uniform vec2 u_bulb_cell; // cell-space center of the bulb

in vec2 v_uv; // fragment position on the quad, 0 ~ 1
out vec4 fragColor;

/*
the actor quad is only the light's bounding box.
main only runs for fragments on that quad, so the halo must fade out
before it reaches the quad edge or the falloff is cut into a rectangle.
*/

void main() {
  vec2 cell = floor(v_uv * u_quad_size);

  if (cell.x < 0.0 || cell.y < 0.0 ||
      cell.x >= u_quad_size.x || cell.y >= u_quad_size.y) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 delta = cell - u_bulb_cell;
  float dist = length(delta);

  // Dracula green #50fa7b, hotter toward the filament
  vec3 green = vec3(0.31372549, 0.98039216, 0.48235294);
  vec3 hot = vec3(0.86, 1.0, 0.92);

  // 2px bands so the halo stays chunky. 16 bands = 32px, inside an 80px quad.
  float band = floor(dist / 2.0);
  float glow = exp(-band * 0.16);
  if (band > 16.0) glow = 0.0;

  // glass: 3 cells wide, 3 tall. corners fall outside the ellipse.
  vec2 glass = delta / vec2(1.2, 1.5);
  bool in_glass = dot(glass, glass) <= 1.0;

  // center cell
  bool filament = max(abs(delta.x), abs(delta.y)) < 1.0;

  vec3 rgb = green * glow;
  float alpha = glow * 0.45;

  if (in_glass) {
    rgb = mix(hot, green, 0.35);
    alpha = 0.95;
  }

  if (filament) {
    rgb = hot;
    alpha = 1.0;
  }

  if (alpha <= 0.004) {
    fragColor = vec4(0.0);
    return;
  }

  // premultiplied, same as blood_splatter
  fragColor = vec4(rgb * alpha, alpha);
}
