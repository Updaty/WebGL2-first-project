#version 300 es
 
in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;

void main() {
  //Rotate the position
  vec2 
  // Add in the translation
  vec2 position = a_position + u_translation;

  // Convert from position in pixels to -1->+1 (clip space)  
	vec2 clipSpace = position / u_resolution * 2. - 1.;
 
	gl_Position = vec4(clipSpace*vec2(1,-1), 0, 1);
}