'use strict';

const vertexShaderSource = (`#version 300 es
 
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

const errorRE = /ERROR:\s*\d+:(\d+)/gi;
function addLineNumbersWithError(src, log = '') {
  // Note: Error message formats are not defined by any spec so this may or may not work.
  const matches = [...log.matchAll(errorRE)];
  const lineNoToErrorMap = new Map(matches.map((m, ndx) => {
    const lineNo = parseInt(m[1]);
    const next = matches[ndx + 1];
    const end = next ? next.index : log.length;
    const msg = log.substring(m.index, end);
    return [lineNo - 1, msg];
  }));
  return src.split('\n').map((line, lineNo) => {
    const err = lineNoToErrorMap.get(lineNo);
    return `${lineNo + 1}: ${line}${err ? `\n\n^^^ ${err}` : ''}`;
  }).join('\n');
}

function randomInt(range) {
  return Math.floor(Math.random() * range);
}

function error(msg) {
	if (topWindow.console) {
		if(topWindow.console.error)  topWindow.console.error(msg);

		else if(topWindow.console.log)  topWindow.console.log(msg);
	}
}

function createShader(gl, type, source, opt_errorCallback) {
    const errFn = opt_errorCallback || error;
	// Create the shader object
    const shader = gl.createShader(type);

    // Load the shader source
    gl.shaderSource(shader, source);

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      // Something went wrong during compilation; get the error
      const lastError = gl.getShaderInfoLog(shader);
      errFn(`Error compiling shader: ${lastError}\n${addLineNumbersWithError(shaderSource, lastError)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
}

function createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
    const errFn = opt_errorCallback || error;
    const program = gl.createProgram();
    shaders.forEach(function(shader) {
      gl.attachShader(program, shader);
    });
    if (opt_attribs) {
      opt_attribs.forEach(function(attrib, ndx) {
        gl.bindAttribLocation(
            program,
            opt_locations ? opt_locations[ndx] : ndx,
            attrib);
      });
    }
    gl.linkProgram(program);

    // Check the link status
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        // something went wrong with the link
        const lastError = gl.getProgramInfoLog(program);
        errFn(`Error in program linking: ${lastError}\n${
          shaders.map(shader => {
            const src = addLineNumbersWithError(gl.getShaderSource(shader));
            const type = gl.getShaderParameter(shader, gl.SHADER_TYPE);
            return `${glEnumToString(gl, type)}:\n${src}`;
          }).join('\n')
        }`);

        gl.deleteProgram(program);
        return null;
    }
    return program;
  }

function resizeCanvasToDisplaySize(canvas, multiplier) {
	multiplier = multiplier || 1;
	const width  = canvas.clientWidth  * multiplier | 0;
	const height = canvas.clientHeight * multiplier | 0;
	if (canvas.width !== width ||  canvas.height !== height) {
		canvas.width  = width;
		canvas.height = height;
		return true;
	}
	return false;
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

function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          0, 0,
          100, 0,
          0, 150,
          0, 150,
          100, 0,
          100, 150,
 
          // top rung
          100, 0,
          100, 0,
          100, 100,
          100, 100,
          100, 0,
          100, 100,
 
          // middle rung
          100, 100,
          100, 100,
          100, 100,
          100, 100,
          100, 100,
          100, 100
        ]),
      gl.STATIC_DRAW);
}

function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
    const errFn = opt_errorCallback || error;
    // Create the shader object
    const shader = gl.createShader(shaderType);

    // Load the shader source
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      // Something went wrong during compilation; get the error
      const lastError = gl.getShaderInfoLog(shader);
      errFn(`Error compiling shader: ${lastError}\n${addLineNumbersWithError(shaderSource, lastError)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
}

const defaultShaderType = [
    'VERTEX_SHADER',
    'FRAGMENT_SHADER',
];

function createProgramFromSources(
      gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
    const shaders = [];
    shaderSources.forEach(
        (shaderSource, index) => shaders.push(loadShader(
            gl, shaderSources[index], gl[defaultShaderType[index]], opt_errorCallback
        ))
    );
    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}