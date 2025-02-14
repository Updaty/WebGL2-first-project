'use strict';

const { createProgramFromSources, resizeCanvasToDisplaySize } = webglUtils;

// Get A WebGL context
const gl = c.getContext('webgl2');

if(!gl) console.error('Oopsie... WebGL2Context is not allowed');


// Use our boilerplate utils to compile the shaders and link into a program
const program = createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);

// look up where the vertex data needs to go.
const positionAttribLocation = gl.getAttribLocation(program, 'a_position');

// look up uniform locations
const resolutionLocation =  gl.getUniformLocation(program, 'u_resolution');
const colorLocation =       gl.getUniformLocation(program, "u_color");
const translationLocation = gl.getUniformLocation(program, "u_translation");
const rotationLocation =    gl.getUniformLocation(program, "u_rotation");
const scaleLocation =    gl.getUniformLocation(program, "u_scale");

//Create a buffer
const positionBuffer = gl.createBuffer();

// Create a vertex array object (attribute state)
const vao = gl.createVertexArray();

// and make it the one we're currently working with
gl.bindVertexArray(vao);

// Turn on the attribute
gl.enableVertexAttribArray(positionAttribLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
{
		const size = 2,           // 2 components per iteration
				type = gl.FLOAT,   // the data is 32bit floats
				normalize = false,// don't normalize the data
				stride = 0,		  // 0 = move forward size * sizeof(type) each iteration to get the next position
				offset = 0;		  // start at the beginning of the buffer
		gl.vertexAttribPointer(
				positionAttribLocation, size, type, normalize, stride, offset)
}

resizeCanvasToDisplaySize(gl.canvas);

// Tell WebGL how to convert from clip space to pixels
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// Clear the canvas
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Tell it to use our program (pair of shaders)
gl.useProgram(program);

// Bind the attribute/buffer set we want.
//    gl.bindVertexArray(vao);

// Pass in the canvas resolution so we can convert from
// pixels to clipspace in the shader
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

const rangeInputs = Array.from(document.querySelectorAll('input[type=range]'));

const rotation = rangeInputs[0],
	  scale = rangeInputs.slice(1,3),
	  translation = rangeInputs.slice(3,5);

translation[0].max = gl.canvas.width;
translation[1].max = gl.canvas.height;

const isMonochrome = document.querySelector('input[type=checkbox]');

function drawScene(e){
	if(e && e.srcElement.type=='range') {
		const changedSlider = e.srcElement;
		changedSlider.nextElementSibling.value = changedSlider.value;
	}

	// Set the rotation.
	const radAngle = degToRad(Number(rotation.value)+90);
	gl.uniform2fv(rotationLocation, [Math.cos(radAngle),Math.sin(radAngle)]);
	
	//Set the scale
	gl.uniform2fv(scaleLocation, [scale[0].value, scale[1].value]);
	
	// Set the translation.
	gl.uniform2fv(translationLocation, translation.map(e=>Number(e.value)));
	
	for (let i = 0; i < 6; i++) {
		if(!isMonochrome.checked || i===0){
			gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
		}
	
		setGeometry(gl, i);
		
		//Draw a distinct F letter.
		{
			const primitiveType = gl.TRIANGLES,
			offset = 0,
			count = 3;
			gl.drawArrays(primitiveType, offset, count);
		}
	}
}
drawScene();

rangeInputs.forEach(elem => {
		elem.addEventListener('input', drawScene);
		elem.addEventListener('change', drawScene);
	});

isMonochrome.addEventListener('click', drawScene);