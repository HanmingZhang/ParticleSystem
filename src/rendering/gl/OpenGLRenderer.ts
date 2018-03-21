import {mat3, mat4, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';
import Particle from '../../particles/Particle';

// These consts should be consistent with those in Particle.ts & particle-vert.glsl

const POSITION_LOCATION = 2;
const VELOCITY_LOCATION = 3;
const COLOR_LOCATION = 4;
const TIME_LOCATION = 5;
const ID_LOCATION = 6;
const MESH_ATTRACT_LOCATION1 = 7;
const MESH_ATTRACT_LOCATION2 = 8;


const NUM_LOCATIONS = 7;

var currentSourceIdx = 0;

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>) {
    let model = mat4.create();
    let viewProj = mat4.create();
    //let color = vec4.fromValues(1, 0, 0, 1);

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    //prog.setGeometryColor(color);

    for (let drawable of drawables) {
      prog.draw(drawable);
    }
  }

  transformParticles(camera: Camera, prog: ShaderProgram, particles: Array<Particle>, model: mat4){
    if(particles.length !== 0){
    let viewProj = mat4.create();

    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);

    prog.use();

    var destinationIdx = (currentSourceIdx + 1) % 2;

    for(let i = 0; i < particles.length; i++){
      // Toggle source and destination VBO
      var sourceVAO = particles[i].getVAO(currentSourceIdx);
      var destinationTransformFeedback = particles[i].getTransformFeedbacks(destinationIdx);

      gl.bindVertexArray(sourceVAO);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, destinationTransformFeedback);

      // NOTE: The following four lines shouldn't be necessary, but are required to work in ANGLE
      // due to a bug in its handling of transform feedback objects.
      // https://bugs.chromium.org/p/angleproject/issues/detail?id=2051
      var vbo = particles[i].getVBO(destinationIdx);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, vbo[POSITION_LOCATION]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, vbo[VELOCITY_LOCATION]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, vbo[COLOR_LOCATION]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, vbo[TIME_LOCATION]);
      


       // -------------------------------------------------------------
       // -------------- this portion is different --------------------
       // -------------------------------------------------------------

       // Attributes per-vertex when doing transform feedback needs setting to 0 when doing transform feedback
       gl.vertexAttribDivisor(POSITION_LOCATION, 0);
       gl.vertexAttribDivisor(VELOCITY_LOCATION, 0);
       gl.vertexAttribDivisor(COLOR_LOCATION, 0);
       gl.vertexAttribDivisor(TIME_LOCATION, 0);
      
       
       // Turn off rasterization - we are not drawing
       gl.enable(gl.RASTERIZER_DISCARD);

       // Update position and rotation using transform feedback
       gl.beginTransformFeedback(gl.POINTS);
       gl.drawArrays(gl.POINTS, 0, particles[i].numParticles);
       gl.endTransformFeedback();

       // Restore state
       gl.disable(gl.RASTERIZER_DISCARD);
       gl.useProgram(null);
       gl.bindBuffer(gl.ARRAY_BUFFER, null);
       gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
       // -------------------------------------------------------------

      // // Draw particles using transform feedback
      // gl.beginTransformFeedback(gl.POINTS);
      // gl.drawArrays(gl.POINTS, 0, particles[i].numParticles);
      // gl.endTransformFeedback();
    }

     // Ping pong the buffers
     currentSourceIdx = (currentSourceIdx + 1) % 2;
  }
  }

  renderParticles(camera: Camera, prog: ShaderProgram, drawable: Drawable, particles: Array<Particle>, model: mat4) {
    if(particles.length !== 0){
    let viewProj = mat4.create();
    let color = vec4.fromValues(1, 0, 0, 1);
    // Each column of the axes matrix is an axis. Right, Up, Forward.
    let axes = mat3.fromValues(camera.right[0], camera.right[1], camera.right[2],
                               camera.up[0], camera.up[1], camera.up[2],
                               camera.forward[0], camera.forward[1], camera.forward[2]);


    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    prog.setCameraAxes(axes);
    

    for(let i = 0; i < particles.length; i++){
      var sourceVAO = particles[i].getVAO(currentSourceIdx);
      gl.bindVertexArray(sourceVAO);

      // Attributes per-instance when drawing sets back to 1 when drawing instances
      gl.vertexAttribDivisor(POSITION_LOCATION, 1);
      gl.vertexAttribDivisor(COLOR_LOCATION, 1);
      
      // draw instances
      prog.draw(drawable, true, particles[i].numParticles);
    }      
  }
  }
};

export default OpenGLRenderer;
