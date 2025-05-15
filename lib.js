
'use strict';

const vertexShaderSource = (`#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

// A matrix to transform the positions by
uniform mat4 u_worldInverseTranspose;
uniform mat4 u_worldViewProjection;
uniform mat4 u_world;

uniform vec3 u_lightPosition;
uniform vec3 u_viewWorldPosition;

// a varying to pass the texture coordinates to the fragment shader
out vec2 v_texcoord;

 
// varying to pass the normal to the fragment shader
out vec3 v_normal;

out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_worldViewProjection * a_position;


  // compute the world position of the surface
  vec3 surfaceWorldPosition = (u_world * a_position).xyz;

  // compute the vector of the surface to the light
  // and pass it to the fragment shader
  v_surfaceToLight = u_lightPosition - surfaceWorldPosition;

  // compute the vector of the surface to the light
  // and pass it to the fragment shader
  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;

  // Pass the texcoord to the fragment shader.
  v_texcoord = a_texcoord;

  // Pass the normal to the fragment shader
  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
`);


const fragmentShaderSource = (`#version 300 es

precision highp float;

// Passed in from the vertex shader.
in vec2 v_texcoord;
in vec3 v_normal;

in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

// The texture.
uniform sampler2D u_texture;
uniform vec3 u_lightDirection;
uniform float u_limit;

//Describes, how metallic the material appears
uniform float u_shininess;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);
  
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToLightDirection);

  float light = 0.;
  
  float specular = 0.;

  float dotFromLightDirection = dot(surfaceToLightDirection, -u_lightDirection);
  if(dotFromLightDirection >= u_limit){
    light = dot(normal, surfaceToLightDirection);
    if (light > 0.0) {
      specular = pow(dot(normal, halfVector), u_shininess);
    }
  }

  outColor = texture(u_texture, v_texcoord);

  outColor.rgb *= light;

  outColor.rgb += specular;
}
`);

const randFloat = (min,max=1) => Math.random()*(max-min)+min

const degToRad = degrees => degrees*.017453292519943295; // 1/180*Math.PI = 0.017453292519943295

function addToSlider(slider, toAdd){
  const
    value = Number(slider.value),
    max = Number(slider.max),
    min = Number(slider.min);

  const newValue = value + toAdd;

  slider.value = newValue;
  
  if(slider.attributes?.unit?.value=='deg' && slider.max=='359'){
    if(newValue<min)
      slider.value = max;
    else if(newValue>max)
      slider.value = min;
  }

  drawScene({target: slider});
}

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


// Fill the current ARRAY_BUFFER buffer
// with the values that define a letter 'F'.
const positions = new Float32Array([
    // left column front
      0,   0,  0,
      0, 150,  0,
      30,   0,  0,
      0, 150,  0,
      30, 150,  0,
      30,   0,  0,

    // top rung front
      30,   0,  0,
      30,  30,  0,
    100,   0,  0,
      30,  30,  0,
    100,  30,  0,
    100,   0,  0,

    // middle rung front
      30,  60,  0,
      30,  90,  0,
      67,  60,  0,
      30,  90,  0,
      67,  90,  0,
      67,  60,  0,

    // left column back
      0,   0,  30,
      30,   0,  30,
      0, 150,  30,
      0, 150,  30,
      30,   0,  30,
      30, 150,  30,

    // top rung back
      30,   0,  30,
    100,   0,  30,
      30,  30,  30,
      30,  30,  30,
    100,   0,  30,
    100,  30,  30,

    // middle rung back
      30,  60,  30,
      67,  60,  30,
      30,  90,  30,
      30,  90,  30,
      67,  60,  30,
      67,  90,  30,

    // top
      0,   0,   0,
    100,   0,   0,
    100,   0,  30,
      0,   0,   0,
    100,   0,  30,
      0,   0,  30,

    // top rung right
    100,   0,   0,
    100,  30,   0,
    100,  30,  30,
    100,   0,   0,
    100,  30,  30,
    100,   0,  30,

    // under top rung
    30,   30,   0,
    30,   30,  30,
    100,  30,  30,
    30,   30,   0,
    100,  30,  30,
    100,  30,   0,

    // between top rung and middle
    30,   30,   0,
    30,   60,  30,
    30,   30,  30,
    30,   30,   0,
    30,   60,   0,
    30,   60,  30,

    // top of middle rung
    30,   60,   0,
    67,   60,  30,
    30,   60,  30,
    30,   60,   0,
    67,   60,   0,
    67,   60,  30,

    // right of middle rung
    67,   60,   0,
    67,   90,  30,
    67,   60,  30,
    67,   60,   0,
    67,   90,   0,
    67,   90,  30,

    // bottom of middle rung.
    30,   90,   0,
    30,   90,  30,
    67,   90,  30,
    30,   90,   0,
    67,   90,  30,
    67,   90,   0,

    // right of bottom
    30,   90,   0,
    30,  150,  30,
    30,   90,  30,
    30,   90,   0,
    30,  150,   0,
    30,  150,  30,

    // bottom
    0,   150,   0,
    0,   150,  30,
    30,  150,  30,
    0,   150,   0,
    30,  150,  30,
    30,  150,   0,

    // left side
    0,   0,   0,
    0,   0,  30,
    0, 150,  30,
    0,   0,   0,
    0, 150,  30,
    0, 150,   0,
]);
  
function setGeometry(gl) {
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

const normals = new Float32Array([
        // left column front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // top rung front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // middle rung front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // left column back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // top rung back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // middle rung back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // top rung right
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // under top rung
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // between top rung and middle
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // top of middle rung
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // right of middle rung
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // bottom of middle rung.
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // right of bottom
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // left side
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
]);

function setNormals(gl) {
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // left column front
        38 / 255,  24 / 255,
        38 / 255, 203 / 255,
        113 / 255,  24 / 255,
        38 / 255, 203 / 255,
        113 / 255, 203 / 255,
        113 / 255,  24 / 255,

        // top rung front
        113 / 255, 24 / 255,
        113 / 255, 65 / 255,
        218 / 255, 24 / 255,
        113 / 255, 65 / 255,
        218 / 255, 65 / 255,
        218 / 255, 24 / 255,

        // middle rung front
        113 / 255, 92 / 255,
        113 / 255, 131 / 255,
        203 / 255, 92 / 255,
        113 / 255, 131 / 255,
        203 / 255, 131 / 255,
        203 / 255, 92 / 255,

        // left column back
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        // top rung back
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        // middle rung back
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,

        // top
        0, 0,
        1, 0,
        1, 1,
        0, 0,
        1, 1,
        0, 1,

        // top rung right
        0, 0,
        1, 0,
        1, 1,
        0, 0,
        1, 1,
        0, 1,

        // under top rung
        0, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 1,
        1, 0,

        // between top rung and middle
        0, 0,
        1, 1,
        0, 1,
        0, 0,
        1, 0,
        1, 1,

        // top of middle rung
        0, 0,
        1, 1,
        0, 1,
        0, 0,
        1, 0,
        1, 1,

        // right of middle rung
        -1, -1,
        2, 2,
        -1, 2,
        -1, -1,
        2, -1,
        2, 2,

        // bottom of middle rung.
        0, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 1,
        1, 0,

        // right of bottom
        0, 0,
        1, 1,
        0, 1,
        0, 0,
        1, 0,
        1, 1,

        // bottom
        0, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 1,
        1, 0,

        // left side
        0, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 1,
        1, 0,
      ]),
      gl.STATIC_DRAW);
}

// Fill the current ARRAY_BUFFER buffer with colors for the 'F'.
function setColors(gl) {
gl.bufferData(
 gl.ARRAY_BUFFER,
 new Uint8Array([
     // left column front
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,

     // top rung front
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,

     // middle rung front
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,
   200,  70, 120,

     // left column back
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,

     // top rung back
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,

     // middle rung back
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,
   80, 70, 200,

     // top
   70, 200, 210,
   70, 200, 210,
   70, 200, 210,
   70, 200, 210,
   70, 200, 210,
   70, 200, 210,

     // top rung right
   200, 200, 70,
   200, 200, 70,
   200, 200, 70,
   200, 200, 70,
   200, 200, 70,
   200, 200, 70,

     // under top rung
   210, 100, 70,
   210, 100, 70,
   210, 100, 70,
   210, 100, 70,
   210, 100, 70,
   210, 100, 70,

     // between top rung and middle
   210, 160, 70,
   210, 160, 70,
   210, 160, 70,
   210, 160, 70,
   210, 160, 70,
   210, 160, 70,

     // top of middle rung
   70, 180, 210,
   70, 180, 210,
   70, 180, 210,
   70, 180, 210,
   70, 180, 210,
   70, 180, 210,

     // right of middle rung
   100, 70, 210,
   100, 70, 210,
   100, 70, 210,
   100, 70, 210,
   100, 70, 210,
   100, 70, 210,

     // bottom of middle rung.
   76, 210, 100,
   76, 210, 100,
   76, 210, 100,
   76, 210, 100,
   76, 210, 100,
   76, 210, 100,

     // right of bottom
   140, 210, 80,
   140, 210, 80,
   140, 210, 80,
   140, 210, 80,
   140, 210, 80,
   140, 210, 80,

     // bottom
   90, 130, 110,
   90, 130, 110,
   90, 130, 110,
   90, 130, 110,
   90, 130, 110,
   90, 130, 110,

     // left side
   160, 160, 220,
   160, 160, 220,
   160, 160, 220,
   160, 160, 220,
   160, 160, 220,
   160, 160, 220,
  ]),
  gl.STATIC_DRAW);
}

const v3 = {
  cross: (a, b) => 
    [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ],
  
  subtract: (a, b) => 
    [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  normalize: v => {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  }
}


const m4 = {
  translation: (tx, ty, tz) =>
    [
      1,  0,  0,  0,
      0,  1,  0,  0,
      0,  0,  1,  0,
      tx, ty, tz, 1,
    ],

  xRotation: (angle) => {
    const radianAngle = degToRad(angle);
    const c = Math.cos(radianAngle),
          s = Math.sin(radianAngle);
    return [
      1,  0,  0,  0,
      0,  c,  s,  0,
      0, -s,  c,  0,
      0,  0,  0,  1,
    ];
  },

  yRotation: (angle) => {
    const radianAngle = degToRad(angle);
    const c = Math.cos(radianAngle),
          s = Math.sin(radianAngle);
    return [
      c,  0, -s,  0,
      0,  1,  0,  0,
      s,  0,  c,  0,
      0,  0,  0,  1,
    ];
  },

  zRotation: (angle) => {
    const radianAngle = degToRad(angle);
    const c = Math.cos(radianAngle),
          s = Math.sin(radianAngle);
    return [
      c,  s,  0,  0,
     -s,  c,  0,  0,
      0,  0,  1,  0,
      0,  0,  0,  1,
    ];
  },

  scaling: (sx, sy, sz) =>
    [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ],
  orthographic: (left, right, bottom, top, near, far) => 
    [
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, 2 / (near - far), 0,
  
      (left + right) / (left - right),
      (bottom + top) / (bottom - top),
      (near + far) / (near - far),
      1,
    ],  
  perspective: (fieldOfView, aspect, near, far) => {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * degToRad(fieldOfView));
    const rangeInv = 1.0 / (near - far);
  
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },
  multiply: function(a, b) {
    const [
      b00, b01, b02, b03,
      b10, b11, b12, b13,
      b20, b21, b22, b23,
      b30, b31, b32, b33,
    ] = b;
    const [
      a00, a01, a02, a03,
      a10, a11, a12, a13,
      a20, a21, a22, a23,
      a30, a31, a32, a33
    ] = a;
  
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },
  inverse: (m) => {
  const [
    m00, m01, m02, m03,
    m10, m11, m12, m13, 
    m20, m21, m22, m23,
    m30, m31, m32, m33,
  ] = m;
  const
    tmp_0  = m22 * m33,
    tmp_1  = m32 * m23,
    tmp_2  = m12 * m33,
    tmp_3  = m32 * m13,
    tmp_4  = m12 * m23,
    tmp_5  = m22 * m13,
    tmp_6  = m02 * m33,
    tmp_7  = m32 * m03,
    tmp_8  = m02 * m23,
    tmp_9  = m22 * m03,
    tmp_10 = m02 * m13,
    tmp_11 = m12 * m03,
    tmp_12 = m20 * m31,
    tmp_13 = m30 * m21,
    tmp_14 = m10 * m31,
    tmp_15 = m30 * m11,
    tmp_16 = m10 * m21,
    tmp_17 = m20 * m11,
    tmp_18 = m00 * m31,
    tmp_19 = m30 * m01,
    tmp_20 = m00 * m21,
    tmp_21 = m20 * m01,
    tmp_22 = m00 * m11,
    tmp_23 = m10 * m01;

    const
    t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
         (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31),
    t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
         (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31),
    t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
         (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31),
    t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
             (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    const d = 1. / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    return [
      d * t0,
      d * t1,
      d * t2,
      d * t3,
      d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
           (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
      d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
           (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
      d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
           (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
      d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
           (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
           (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
           (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
           (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
           (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
           (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
           (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
           (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
           (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
    ];
  },
  transpose: (m) =>
    [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ],
  translate: (m, tx, ty, tz) =>
    m4.multiply(m, m4.translation(tx, ty, tz)),
 
  xRotate: (m, angle) =>
    m4.multiply(m, m4.xRotation(angle)),

  yRotate: (m, angleInRadians) =>
    m4.multiply(m, m4.yRotation(angleInRadians)),

  zRotate: (m, angle) =>
    m4.multiply(m, m4.zRotation(angle)),
 
  scale: (m, sx, sy, sz) =>
    m4.multiply(m, m4.scaling(sx, sy, sz)),
  lookAt: (cameraPosition, target, up) => {
    const zAxis = v3.normalize(v3.subtract(cameraPosition, target));
    const xAxis = v3.normalize(v3.cross(up, zAxis));
    const yAxis = v3.normalize(v3.cross(zAxis, xAxis));

    return [
      xAxis[0], xAxis[1], xAxis[2], 0,
      yAxis[0], yAxis[1], yAxis[2], 0,
      zAxis[0], zAxis[1], zAxis[2], 0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ];
  }
};