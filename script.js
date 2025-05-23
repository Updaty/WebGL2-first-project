'use strict';

const { createProgramFromSources, resizeCanvasToDisplaySize } = webglUtils;

// Get A WebGL context
const gl = cvs.getContext('webgl2');

if(!gl) console.error('Oopsie... WebGL2Context is not allowed');


// Use our boilerplate utils to compile the shaders and link into a program
const program = createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);

// look up where the vertex data needs to go.
const positionAttribLocation = gl.getAttribLocation(program, 'a_position');
const texcoordAttributeLocation = gl.getAttribLocation(program, 'a_texcoord');
const normalLocation = gl.getAttribLocation(program, "a_normal");

// look up uniform locations
const worldViewMatrixLocation = gl.getUniformLocation(program, "u_worldViewProjection");
const worldInverseTransposeMatrixLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
const worldMatrixLocation = gl.getUniformLocation(program, "u_world");
const lightPositionLocation = gl.getUniformLocation(program, "u_lightPosition");
const viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
const shininessLocation = gl.getUniformLocation(program, "u_shininess");
const lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
const innerLimitLocation = gl.getUniformLocation(program, "u_innerLimit");
const outerLimitLocation = gl.getUniformLocation(program, "u_outerLimit");

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

// create the texcoord buffer, make it the current ARRAY_BUFFER
// and copy in the texcoord values
const texcoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
setTexcoords(gl);

// Turn on the attribute
gl.enableVertexAttribArray(texcoordAttributeLocation);
	
{
	// Tell the attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
	const
	size = 2,          // 2 components per iteration
	type = gl.FLOAT,   // the data is 32bit floating point values
	normalize = true,  // convert from 0-255 to 0.0-1.0
	stride = 0,        // 0 = move forward size * sizeof(type) each iteration to get the next color
	offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(
		texcoordAttributeLocation, size, type, normalize, stride, offset);
}

// Create a texture.
const texture = gl.createTexture();

// use texture unit 0
gl.activeTexture(gl.TEXTURE0 + 0);

// bind to the TEXTURE_2D bind point of texture unit 0
gl.bindTexture(gl.TEXTURE_2D, texture);

// Fill the texture with a 1x1 blue pixel.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
	new Uint8Array([0, 0, 255, 255]));


// Create a buffer for normals.
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(normalLocation);
gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

// Set normals.
setNormals(gl);

			
// Asynchronously load an image
const image = new Image();
image.src = "./1000000420.jpg";
image.addEventListener('load', () => {
	// Now that the image has loaded make copy it to the texture.
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	
	requestAnimationFrame(drawScene);
});


const rangeInputs = Array.from(document.querySelectorAll('input[type=range]'));

const 
 rotation = rangeInputs.slice(0,3),
 scale = rangeInputs.slice(3,6),
 translation = rangeInputs.slice(6,9),
 fov = rangeInputs[9],
 cameraAngle = rangeInputs[10],
 shininess = rangeInputs[11];


webglUtils.resizeCanvasToDisplaySize(gl.canvas);


gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

function drawScene(e){
	const radius = 200;
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

	if(e && e.target?.type=='range') {
		const changedSlider = e.target;
		changedSlider.nextElementSibling.value = changedSlider.value;
	}

	//Compute the matrix
	let matrix = m4.perspective(
			Number(fov.value),                              //field of view
			gl.canvas.clientWidth / gl.canvas.clientHeight, //aspect ratio
			 1,                                             //z near
			 2000                                           //z far
	);
	

	const camera = [100, 150, 200];
	
	const cameraMatrix = m4.translate(
		m4.yRotation(Number(cameraAngle.value)),
		0, 0, radius * 1.5
	)
	
	const rotationMatrix =  m4.zRotate(
							m4.yRotate(
							m4.xRotation(
								360-Number(rotation[0].value)),
								360-Number(rotation[1].value)),
								360-Number(rotation[2].value));
	
	const worldInverseTransposeMatrix = m4.transpose(m4.inverse(rotationMatrix));

	matrix = m4.multiply(matrix, m4.inverse(cameraMatrix));

	matrix = m4.translate(matrix, Number(translation[0].value), Number(translation[1].value), Number(translation[2].value));
	matrix = m4.xRotate(matrix, 360-Number(rotation[0].value));
	matrix = m4.yRotate(matrix, 360-Number(rotation[1].value));
	matrix = m4.zRotate(matrix, 360-Number(rotation[2].value));
	matrix = m4.scale(matrix, Number(scale[0].value),Number(scale[1].value),Number(scale[2].value));
	
	gl.uniformMatrix4fv(worldMatrixLocation, false, rotationMatrix);
	gl.uniformMatrix4fv(worldViewMatrixLocation, false, matrix);
	gl.uniformMatrix4fv(worldInverseTransposeMatrixLocation, false, worldInverseTransposeMatrix);

	// set the light properties.
	gl.uniform3fv(lightPositionLocation, [20, 30, -50]);

	gl.uniform3fv(viewWorldPositionLocation, camera);

	gl.uniform3fv(lightDirectionLocation, [0, -1, 0]);

    gl.uniform1f(innerLimitLocation, Math.cos(degToRad(20)));
    gl.uniform1f(outerLimitLocation, Math.cos(degToRad(40)));
	 
	// set the shininess
	gl.uniform1f(shininessLocation, shininess.value);
		
	//Draw a distinct triangle.
	gl.drawArrays(
		gl.TRIANGLES, //primitiveType
		0,            //offset
		16 * 6        //count
	);
}

rangeInputs.forEach(elem => {
	elem.addEventListener('input', drawScene);
	elem.addEventListener('change', drawScene);
	
	elem.addEventListener('mousewheel', e => {
		const input = e.target;
		addToSlider(input,Number(input.step||1)*(e.deltaY>0?1:-1));
	})
});

document.body.addEventListener('keydown', e => {
	let property;
	if (e.altKey){
		property = scale;
	} else if (e.ctrlKey){
		property = rotation;
	} else {
		property = translation;
	}
	const toAdd = Number(property[0].step||1)*(property==translation?5:1);
	switch(e.code){
		case 'KeyA':
			addToSlider(property[0], -toAdd);
			break;
		case 'KeyD':
			addToSlider(property[0], toAdd);
			break;
		case 'KeyW':
			addToSlider(property[2], -toAdd);
			break;
		case 'KeyS':
			addToSlider(property[2], toAdd);
			break;
		case 'ShiftLeft':
			addToSlider(property[1], -toAdd);
			break;
		case 'Space':
			addToSlider(property[1], toAdd);
			break;
		default:
			console.log(e)
	}
});