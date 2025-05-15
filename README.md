#### This project is my first attempt at creating something with WebGL2.

## Availability
Your browser must support WebGL2 to use this project. Check if your browser does here: https://caniuse.com/webgl2.


## Usage
To test the project, download all files into a single folder. Then, to test it locally, install [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) and from there [http-server](https://www.npmjs.com/package/http-server#as-a-dependency-in-your-npm-package) write the following command into terminal:
```bash
http-server -c-1 -p 8080
```
Then open this page: http://127.0.0.1:8080.

## Contents
The page contains a Canvas element that fills the entire viewport and several sliders for controlling various transformations and properties of the 3D object. You can adjust rotation, scaling, translation, field of view, camera angle, and shininess using the sliders. To move the sliders precisely, scroll your mouse wheel over them.

Additionally, you can use keyboard controls for quick adjustments:
- **Alt + Arrow Keys**: Adjust scaling.
- **Ctrl + Arrow Keys**: Adjust rotation.
- **Arrow Keys**: Adjust translation.

Each slider is labeled, and hovering over it provides a caption explaining its function.