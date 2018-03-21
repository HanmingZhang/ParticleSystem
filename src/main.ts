import {vec2, vec3, vec4, mat4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Particle from './particles/Particle';
import Object from './objLoader';

const NUM_PARTICLES = 100000;
const ACCELERATION  = -1.0;

const NULL = 'Null';
const HAND = 'Hand';
const DANTE = 'Dante';


// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {  
  num_particles: NUM_PARTICLES,
  size_particle: 0.4,
  rotate_cam: true,
  Obj: NULL,

  color1: [ 255, 102, 255 ], 
  color2: [ 169, 217, 198 ], 
  color_freq: 1.0,
  
  breath_rate: 1.0,

  'Camera Info': printCameraInfo,
};

var particle: Particle;

var square:   Square; // this is billboard square
let obj_Dante: Object;
let obj_Hand: Object;

// Camera
const camera = new Camera(vec3.fromValues(0, 0, 5.5), vec3.fromValues(0, 0, 0));

// identity model matrix
let identityModel = mat4.create();
mat4.identity(identityModel);

// model matrix that sets the size of particle billboard
var billboardModelMatrix = mat4.create();

var particle_transform : ShaderProgram;
var particle_bg_transform : ShaderProgram;

function printCameraInfo(){
  console.log(camera.position);
  console.log(camera.target);
}

// ------------------------------------------------------------
// TODO: initialize other objects here
function initObjs(){
  obj_Dante = new Object("Dante");
  obj_Hand = new Object("Hand");

}

function loadScene(){
  particle = new Particle(controls.num_particles);
  particle.create();

  square = new Square(vec3.fromValues(0.0, 0.0, 0.0));
  square.create();

  initObjs();
}

// ------------------------------------------------------------
// TODO : add new obj load func as callback of a callback
function LoadObjFromfiles(){
  obj_Dante.create("./obj/dante.obj", function(){
    console.log('dante obj finish loading!');
    obj_Hand.create("./obj/hand.obj", function(){
      console.log('hand obj finish loading!');
      
      particle.setMeshAttactPoints(obj_Hand, obj_Dante);
    });

  });
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }

  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  loadScene();

  // ----------------------------------------------------------------
  // Add controls to the gui
  const gui = new DAT.GUI();
  // gui.add(controls, 'num_particles', 0, 1000000).step(50000).onChange(loadScene);
  gui.add(controls, 'size_particle', 0.1, 1.2).step(0.1).onChange(setParticleSize);
  gui.add(controls, 'Obj', [NULL, HAND, DANTE]).onChange(setObject);  
  gui.add(controls, 'rotate_cam');
  gui.addColor(controls, 'color1').onChange(setParticleColor);
  gui.addColor(controls, 'color2').onChange(setParticleColor);
  gui.add(controls, 'color_freq', 1, 10).step(1).onChange(setParticleColorChangeFreq);
  gui.add(controls, 'breath_rate', 1, 10).step(1).onChange(setParticleDrawBreathRate);
  gui.add(controls, 'Camera Info');

  // ----------------------------------------------------------------
  // Open GL Renderer
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.05, 0.05, 0.05, 1);
  // disable depth test in particle rendering
  // gl.enable(gl.DEPTH_TEST); // depth test

  // enable transparency/color blending
  gl.enable(gl.BLEND); 
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  // ----------------------------------------------------------------
  // setup particle shader with transform feedback(actually, fragment shader is not used here)
  particle_transform = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-transform-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-transform-frag.glsl')),
    ],
    true,
    ['v_position', 'v_velocity', 'v_color', 'v_time']
  );
  particle_transform.setGeometryColor(vec4.fromValues(0.0, 1.0, 1.0, 1.0));
  particle_transform.setTransformAcceleraton(vec3.fromValues(0.0, ACCELERATION, 0.0));
  particle_transform.setMeshAttractCount(0);


  // setup particle draw shaders
  var particle_draw = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-draw-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-draw-frag.glsl')),
  ]);
  particle_draw.setIsAttractToPoint(0); 


  // ----------------------------------------------------------------
  // set particle attract obj
  function setObject(){
    let attractCount ;
    switch(controls.Obj) {
      case NULL:
        particle_transform.setMeshAttractSelect(0);
        particle_transform.setMeshAttractCount(0);
        break;
      case HAND:
        particle_transform.setMeshAttractSelect(1);        
        attractCount = Math.min(obj_Hand.vertices.length, particle.numParticles);
        particle_transform.setMeshAttractCount(attractCount);        
        break;
      case DANTE:
        particle_transform.setMeshAttractSelect(2);        
        attractCount = Math.min(obj_Dante.vertices.length, particle.numParticles);
        particle_transform.setMeshAttractCount(attractCount);    
        break;
    }
  }
  setObject();

  // set particle size
  function setParticleSize(){
    mat4.scale(billboardModelMatrix, identityModel, vec3.fromValues(0.1 * controls.size_particle, 0.1 * controls.size_particle, 1.0));
    particle_draw.setParticleSize(0.5 * controls.size_particle);
  }
  setParticleSize();

  // set particle color
  function setParticleColor(){
    particle_transform.setParticleColor(vec3.fromValues(controls.color1[0] / 255.0, controls.color1[1] / 255.0, controls.color1[2] / 255.0), 
                                        vec3.fromValues(controls.color2[0] / 255.0, controls.color2[1] / 255.0, controls.color2[2] / 255.0));
  }
  setParticleColor();

  // set particle color change frequency
  function setParticleColorChangeFreq(){
    particle_transform.setParticleColorChangeFreq(controls.color_freq);
  }
  setParticleColorChangeFreq();

  // set particle color breath rate
  function setParticleDrawBreathRate(){
    particle_draw.setParticleDrawBreathRate(controls.breath_rate);
  }
  setParticleDrawBreathRate();

  LoadObjFromfiles();

  var appStartTime = Date.now();
  var accumulateTime = 0;

  // ----------------------------------------------------------------
  // This function will be called every frame
  function tick() {

    if(controls.rotate_cam){ 
        camera.update(accumulateTime);
        accumulateTime += 1.0;
    }

    stats.begin();

    // update time
    var time = Date.now() - appStartTime;
    // Set uniforms
    particle_transform.setTimer(time);    
    particle_draw.setTimer(time);

    // particles transform
    renderer.transformParticles(camera, particle_transform, [
      particle
    ], identityModel);


    // Set the viewport
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    // Clear color buffer
    renderer.clear();

    // Render
    renderer.renderParticles(camera, particle_draw, square, [particle], billboardModelMatrix);
    

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  var leftButton = 0;
  var rightButton = 2;
  var isMouseDragging = false;

  canvas.onmousedown = function(ev) {  //Mouse is pressed
    if(ev.button === leftButton){
      console.log('on left mouse button down!');
      particle_transform.setIsAttractToPoint(1.0); // attract

    }
    else if(ev.button === rightButton){
      console.log('on right mouse button down!');
      particle_transform.setIsAttractToPoint(-1.0); // repel
      
    }
    particle_transform.setAttractPos(vec2.fromValues((2.0 * ev.clientX / window.innerWidth) - 1.0, 
                                                      1.0 - (2.0 * ev.clientY / window.innerHeight)), camera);

    isMouseDragging = true;
  };

  canvas.onmouseup = function(ev){ //Mouse is released
    if(ev.button === leftButton){
      console.log('on left mouse button up!');
    }
    else if(ev.button === rightButton){
      console.log('on right mouse button up!');
    }

    particle_transform.setIsAttractToPoint(0); 
    isMouseDragging = false;
  }

  canvas.onmousemove = function(ev) { //Mouse is moved
    if(isMouseDragging){
      console.log('on mouse move!');
    }
  }

  // Start the render loop
  tick();
}

main();
