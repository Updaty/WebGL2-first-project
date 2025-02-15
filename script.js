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
const matrixLocation =      gl.getUniformLocation(program, "u_matrix");

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
	  translation = rangeInputs.slice(3,5),
	  clones = rangeInputs[5];

translation[0].max = gl.canvas.width;
translation[1].max = gl.canvas.height;

const isMonochrome = document.querySelector('input[type=checkbox]');

function drawScene(e){
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Tell it to use our program (pair of shaders)
	gl.useProgram(program);

	if(e && e.srcElement.type=='range') {
		const changedSlider = e.srcElement;
		changedSlider.nextElementSibling.value = changedSlider.value;
	}

	//Compute the matrices
	const
	rotationMatrix = m3.rotation(Number(rotation.value)),
	scaleMatrix = m3.scaling(Number(scale[0].value),Number(scale[1].value)),
	translationMatrix = m3.translation(Number(translation[0].value),Number(translation[1].value));
	
	//Multiply the matrices
	let matrix = m3.identity;

	for (let j = 0; j < Number(clones.value)+1; j++) {
		matrix = m3.multiply(m3.multiply(m3.multiply(matrix,translationMatrix),rotationMatrix),scaleMatrix);
		
		gl.uniformMatrix3fv(matrixLocation, false, matrix);

		for (let i = 0; i < 6; i++) {
			if(!isMonochrome.checked || i===0){
				gl.uniform4f(colorLocation, randFloat(.5), randFloat(.5), randFloat(.5), 1);
			}
		
			setGeometry(gl, i);
			
			//Draw a distinct triangle.
			{
				const primitiveType = gl.TRIANGLES,
				offset = 0,
				count = 3;
				gl.drawArrays(primitiveType, offset, count);
			}
		}
	}
}
drawScene();

rangeInputs.forEach(elem => {
		elem.addEventListener('input', drawScene);
		elem.addEventListener('change', drawScene);
	});

isMonochrome.addEventListener('click', drawScene);