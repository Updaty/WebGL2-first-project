'use strict';

const vertexShaderSource = (`#version 300 es
 
in vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

void main() {
  // Apply the matrix, and so all the transformations
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;

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


const m3 = {
  identity: [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
  ],
  translation: (tx, ty) =>
    [
      1,  0,  0,
      0,  1,  0,
      tx, ty, 1,
    ],

  rotation: (angle) => {
    const radianAngle = degToRad(angle);
    const c = Math.cos(radianAngle),
          s = Math.sin(radianAngle);
    return [
      c, -s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },

  scaling: (sx, sy) =>
    [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ],

  multiply: (a, b) => {
    const 
    a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a10 = a[3],
    a11 = a[4],
    a12 = a[5],
    a20 = a[6],
    a21 = a[7],
    a22 = a[8],
    b00 = b[0],
    b01 = b[1],
    b02 = b[2],
    b10 = b[3],
    b11 = b[4],
    b12 = b[5],
    b20 = b[6],
    b21 = b[7],
    b22 = b[8];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
};