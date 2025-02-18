'use strict';

const { createProgramFromSources, resizeCanvasToDisplaySize } = webglUtils;

// Get A WebGL context
const gl = c.getContext('webgl2');

if(!gl) console.error('Oopsie... WebGL2Context is not allowed');


// Use our boilerplate utils to compile the shaders and link into a program
const program = createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);

// look up where the vertex data needs to go.
const positionAttribLocation = gl.getAttribLocation(program, 'a_position');
const colorAttributeLocation = gl.getAttribLocation(program, 'a_color');

// look up uniform locations
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

setGeometry(gl);

// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
{
	const
	size = 3,           // 3 components per iteration
	type = gl.FLOAT,   // the data is 32bit floats
	normalize = false,// don't normalize the data
	stride = 0,		  // 0 = move forward size * sizeof(type) each iteration to get the next position
	offset = 0;		  // start at the beginning of the buffer
	gl.vertexAttribPointer(
		positionAttribLocation, size, type, normalize, stride, offset)
}
				
// create the color buffer, make it the current ARRAY_BUFFER
// and copy in the color values
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
setColors(gl);

// Turn on the attribute
gl.enableVertexAttribArray(colorAttributeLocation);
 
// Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
{
	const
	size = 3,          // 3 components per iteration
	type = gl.UNSIGNED_BYTE,   // the data is 8bit unsigned bytes
	normalize = true,  // convert from 0-255 to 0.0-1.0
	stride = 0,        // 0 = move forward size * sizeof(type) each iteration to get the next color
	offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(
		colorAttributeLocation, size, type, normalize, stride, offset);
}



const rangeInputs = Array.from(document.querySelectorAll('input[type=range]'));

const rotation = rangeInputs.slice(0,3),
	  scale = rangeInputs.slice(3,6),
	  translation = rangeInputs.slice(6,9);

translation[0].max = gl.canvas.width;
translation[1].max = gl.canvas.height;


function drawScene(e){
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

	if(e && e.target.type=='range') {
		const changedSlider = e.target;
		changedSlider.nextElementSibling.value = changedSlider.value;
	}
	let matrix;
	//Compute the matrix
	{
		const 
		left = 0,
		right = gl.canvas.clientWidth,
		bottom = gl.canvas.clientHeight,
		top = 0,
		near = 200,
		far = -200;
		matrix = m4.orthographic(left, right, bottom, top, near, far);
	}
	matrix = m4.translate(matrix, Number(translation[0].value), Number(translation[1].value), Number(translation[2].value));
	matrix = m4.xRotate(matrix, 360-Number(rotation[0].value));
	matrix = m4.yRotate(matrix, 360-Number(rotation[1].value));
	matrix = m4.zRotate(matrix, 360-Number(rotation[2].value));
	matrix = m4.scale(matrix, Number(scale[0].value),Number(scale[1].value),Number(scale[2].value));
	
	gl.uniformMatrix4fv(matrixLocation, false, matrix);
		
	//Draw a distinct triangle.
	{
		const
		primitiveType = gl.TRIANGLES,
		offset = 0,
		count = 16 * 6;
		gl.drawArrays(primitiveType, offset, count);
	}
}
drawScene();

rangeInputs.forEach(elem => {
		elem.addEventListener('input', drawScene);
		elem.addEventListener('change', drawScene);
		
		elem.addEventListener('mousewheel', e => {
			console.log(e)
			const input = e.target;
			const
			 value = Number(input.value),
			 max = Number(input.max),
			 min = Number(input.min);

			const newValue = (value + Number(input.step||1)*(e.deltaY>0?1:-1));

		input.value = newValue;
		
	    if(/^[xyz]_rotation$/.test(input.id)){
			if(newValue<min)
				input.value = max;
			else if(newValue>max)
				input.value = min;
		}

		drawScene({target: input})
		})
	});