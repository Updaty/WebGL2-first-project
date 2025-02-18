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



const rangeInputs = Array.from(document.querySelectorAll('input[type=range]'));

const rotation = rangeInputs[0],
	  scale = rangeInputs.slice(1,3),
	  translation = rangeInputs.slice(3,5);

translation[0].max = gl.canvas.width;
translation[1].max = gl.canvas.height;

const [isMonochrome, isClockwise] = document.querySelectorAll('input[type=checkbox]');


function drawScene(e){
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Tell it to use our program (pair of shaders)
	gl.useProgram(program);

	if(e && e.target.type=='range') {
		const changedSlider = e.target;
		changedSlider.nextElementSibling.value = changedSlider.value;
	}
	

	//Compute the matrices
	let matrix = m3.projection(gl.canvas.clientWidth,gl.canvas.clientHeight);
	matrix = m3.translate(matrix, Number(translation[0].value),Number(translation[1].value));
	matrix = m3.rotate(matrix, isClockwise.checked ? (360-Number(rotation.value)) : Number(rotation.value));
	matrix = m3.scale(matrix, Number(scale[0].value),Number(scale[1].value));
	
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
		
	    if(/^([xyz]_)?rotation$/.test(input.id)){
			if(newValue<min)
				input.value = max;
			else if(newValue>max)
				input.value = min;
		}

		drawScene({target: input})
		})
	});

isMonochrome.addEventListener('click', drawScene);
isClockwise.addEventListener('click', drawScene);