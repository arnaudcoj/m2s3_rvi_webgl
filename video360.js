"use strict";



/**
 * Global (html5 canvas and gl context)
 * **/
var canvasGL;
var gl;

/**
 * Global (geometry VAO id, shader id, texture id)
 * **/
var sphereVAO;
var triangleVAO;

var shader360;
var texture360;
var modelview;
var projection;
var angle = 0.0;
var angleViewX,angleViewY;
var oldMouseX,oldMouseY;

var mouseDown=false;

var nbCount=0;


/**
 * main, mainLoop
 * **/
window.addEventListener("load",main);

function main() {
    canvasGL=document.getElementById("canvasGL");
    gl=canvasGL.getContext("webgl2");
    if (!gl) {
      alert("cant support webGL2 context");
    }
    else {
      console.log(
        gl.getParameter( gl.VERSION ) + " | " +
        gl.getParameter( gl.VENDOR ) + " | " +
        gl.getParameter( gl.RENDERER ) + " | " +
        gl.getParameter( gl.SHADING_LANGUAGE_VERSION )
      );
      init();
      mainLoop();
   		// callback from mouse down
      canvasGL.addEventListener('mousedown',handleMouseDown,false);
      canvasGL.addEventListener('mousemove',handleMouseMove,false);
      canvasGL.addEventListener('mouseup',handleMouseUp,false);

    }
}

/**
 * mainLoop : update, draw, etc
 * **/
function mainLoop() {
    update();
    draw();
    window.requestAnimationFrame(mainLoop);
}

/**
 * init : webGL and data  initializations
 * **/

function init() {
    gl.clearColor(0,1,1,1);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0,0,canvasGL.width,canvasGL.height);

    projection = new Mat4();
    modelview = new Mat4();
    projection.setFrustum(-0.1, 0.1, -0.1, 0.1, 0.1, 1000);

    shader360 = initProgram("shader360");
    texture360 = initTexture("earthDay");
    sphereVAO = initSphereVAO();
}

function initTriangleVAO() {
    var position = [-0.5, 0.5, 0.0,  0.5, -0.5, 0.0,  -0.7, -0.9, 0.0];
    var texture = [0.15, 0.0, 1.0, 0.7, 0.0, 1.0];
    var element = [0, 1, 2];

    var triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

    var triangleTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);

    var triangleElementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleElementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(element), gl.STATIC_DRAW);

    var vao=gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleElementBuffer);

    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);

    gl.enableVertexAttribArray(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleTextureBuffer);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 0, 0);

    gl.bindVertexArray(null);

    return vao;
}

function initSphereVAO() {
    var nbSlice = 20
    var nbStack = 20

    var sliceStep = 2*Math.PI / nbSlice;
    var stackStep = Math.PI / nbStack;

    var sliceAngle = 0.0;
    var stackAngle = 0.0;

    var position = [];
    var texture = [];
    var element = [];

    for(var i = 0; i < nbStack; i++) {

      sliceAngle = 0.0;
      for(var j = 0; j < nbSlice; j++) {
        position.push(Math.cos(sliceAngle) * Math.sin(stackAngle));
        position.push(Math.cos(stackAngle));
        position.push(Math.sin(sliceAngle) * Math.sin(stackAngle));

        //texture.push(sliceAngle / 2 * Math.PI);
        //texture.push(stackAngle / Math.PI);
        texture.push(1. - sliceAngle / (2. * Math.PI));
        texture.push(1. - stackAngle / Math.PI);
        sliceAngle += sliceStep;


        element.push((i+1)*nbSlice + j + 1); // haut gauche
        element.push(i*nbSlice + j); // bas gauche
        element.push(i*nbSlice + j + 1); // bas droit
        element.push(i*nbSlice + j + 1); // bas droit
        element.push((i+1)*nbSlice + j + 2); // haut droit
        element.push((i+1)*nbSlice + j + 1); // haut gauche
      }

      stackAngle += stackStep;
    }

    //TODO pas de sphere affichée

    var sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

    var sphereTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);

    var sphereElementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereElementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(element), gl.STATIC_DRAW);

    var vao=gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereElementBuffer);

    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);

    gl.enableVertexAttribArray(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTextureBuffer);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 0, 0);

    gl.bindVertexArray(null);

    return vao;

}


/**
 * update :
 * **/

 function update() {
   angle += 0.01;
   modelview.setIdentity();
   modelview.translate(0,0,-4);
   modelview.rotateX(angle);
 }



/**
 * draw
 * **/
function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(shader360);

  var textureLocation = gl.getUniformLocation(shader360, "image");
  gl.uniform1i(textureLocation, 0);

  var modelviewLocation = gl.getUniformLocation(shader360, "modelview");
  gl.uniformMatrix4fv(modelviewLocation, gl.FALSE, modelview.fv);

  var projectionLocation = gl.getUniformLocation(shader360, "projection");
  gl.uniformMatrix4fv(projectionLocation, gl.FALSE, projection.fv);

  gl.bindVertexArray(triangleVAO);
  gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

  gl.bindVertexArray(sphereVAO);
  gl.drawElements(gl.TRIANGLE_STRIP, 3, gl.UNSIGNED_SHORT, 0);

  gl.useProgram(null);
  gl.bindVertexArray(null);

}



/** ****************************************
 *  reads shader (sources in html : tag <script ...type="x-shader"> ) and compile
 * **/
function compileShader(id) {
  var shaderScript = document.getElementById(id);
  var k = shaderScript.firstChild;
  var str=k.textContent;
  console.log(str);
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
     shader = gl.createShader(gl.FRAGMENT_SHADER);
  }
  else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  }
  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(id+"\n"+gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
 }

/** ******************************************* */
/** create the program shader (vertex+fragment) :
 *   - sources are in html script tags : id+"-vs" for the vertex shader, id+"-fs" for the fragment shader
 *
 */
function initProgram(id) {
	var programShader=gl.createProgram();
	var vert=compileShader(id+"-vs");
	var frag=compileShader(id+"-fs");
	gl.attachShader(programShader,vert);
	gl.attachShader(programShader,frag);
	gl.linkProgram(programShader);
	if (!gl.getProgramParameter(programShader,gl.LINK_STATUS)) {
		alert(gl.getProgramInfoLog(programShader));
		return null;
	}
	return programShader;
}

/** *****************************************************
 * Init texture from html id
 * **/

function initTexture(id) {
	var imageData=document.getElementById(id);
	console.log(imageData.nodeType);

	var textureId=gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,textureId);

	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageData);

	return textureId;

}


/** ******************************************* */
/** call the picking when mouse down (automatically called : see initGL() for the callback set)
 *
 */
function handleMouseDown(event) {
	// get the mouse relative to canvas
	oldMouseX = event.layerX-canvasGL.offsetLeft;
	oldMouseY = canvasGL.height-(event.layerY-canvasGL.offsetTop)-1.0;
	mouseDown=true;
}

function handleMouseMove(event) {
	// get the mouse relative to canvas
	if (mouseDown) {
	var mouseX = event.layerX-canvasGL.offsetLeft;
	var mouseY = canvasGL.height-(event.layerY-canvasGL.offsetTop)-1.0;



	oldMouseX=mouseX;
	oldMouseY=mouseY;
	}
}

function handleMouseUp(event) {
	mouseDown=false;
}
