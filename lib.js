'use strict';

const vertexShaderSource = (`#version 300 es
 
in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

void main() {
  //Scale the position
  vec2 scaledPosition = a_position * u_scale;

  //Rotate the position
  vec2 rotatedPosition = vec2(
     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x
  );
  // Add in the translation
  vec2 position = rotatedPosition + u_translation;

  // Convert from position in pixels to -1->+1 (clip space)  
	vec2 clipSpace = position / u_resolution * 2. - 1.;
 
	gl_Position = vec4(clipSpace*vec2(1,-1), 0, 1);
}`);

const fragmentShaderSource = (`#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
	// Just set the output to a given color
	outColor = u_color;
}
`);

const randFloat = (min,max=1) => Math.random()*(max-min)+min

const degToRad = degrees => degrees*.017453292519943295; // 1/180*Math.PI = 0.017453292519943295

function setRectangle(gl, x, y, width, height) {
  const x1 = x,
        x2 = x + width,
        y1 = y,
        y2 = y + height;

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}


function setGeometry(gl, index) {
  const dataset = [
    // left column
    [0, 0,
    30, 0,
    0, 150],
    [0, 150,
    30, 0,
    30, 150],

    // top rung
    [30, 0,
    100, 0,
    30, 30],
    [30, 30,
    100, 0,
    100, 30],

    // middle rung
    [30, 60,
    67, 60,
    30, 90],
    [30, 90,
    67, 60,
    67, 90]]
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(dataset[index]),
      gl.STATIC_DRAW);
}