import {vec2, vec4, mat3, mat4, vec3} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';
import Camera from '../../Camera';

var activeProgram: WebGLProgram = null;

const ANGLE2RADIUS = 3.1415926 / 180.0;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;
  unifTimer: WebGLUniformLocation;

  unifDrawTimeLocation: WebGLUniformLocation;
  unifDrawAcceleratonLocation: WebGLUniformLocation;
  unifDrawColorLocation: WebGLUniformLocation;

  unifCameraAxes: WebGLUniformLocation;
  unifParticleRadius: WebGLUniformLocation;
  unifIsAttractToPoint: WebGLUniformLocation;
  unifAttractPos: WebGLUniformLocation;
  unifMeshAttractPointsCount: WebGLUniformLocation;

  unifParticleCol1: WebGLUniformLocation;
  unifParticleCol2: WebGLUniformLocation;
  unifParticleColChangeFreq: WebGLUniformLocation;
  unifParticleAttractMeshSelect: WebGLUniformLocation;
  unifParticleDrawBreathRate: WebGLUniformLocation;

  constructor(shaders: Array<Shader>, isTransformFeedback: boolean = false, varyings: string[] = []) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }

    // setup transformFeedback stuff
    if(isTransformFeedback){
      gl.transformFeedbackVaryings(this.prog, varyings, gl.SEPARATE_ATTRIBS);
    }

    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
    this.unifTimer      = gl.getUniformLocation(this.prog, "u_Time");
    this.unifCameraAxes = gl.getUniformLocation(this.prog, "u_CameraAxes");
    this.unifParticleRadius = gl.getUniformLocation(this.prog, "u_ParticleRadius");
    this.unifIsAttractToPoint = gl.getUniformLocation(this.prog, "u_IsAttract");
    this.unifAttractPos = gl.getUniformLocation(this.prog, "u_AttractPos");
    this.unifMeshAttractPointsCount = gl.getUniformLocation(this.prog, "u_MeshAtrractPointCount");

    this.unifParticleCol1 = gl.getUniformLocation(this.prog, "u_inputColor1");
    this.unifParticleCol2 = gl.getUniformLocation(this.prog, "u_inputColor2");
    this.unifParticleColChangeFreq = gl.getUniformLocation(this.prog, "u_colChangeFreq");
    this.unifParticleAttractMeshSelect = gl.getUniformLocation(this.prog, "u_MeshSelect");
    this.unifParticleDrawBreathRate = gl.getUniformLocation(this.prog, "u_BreathRate");

    // Get uniform locations for the draw program
    this.unifDrawAcceleratonLocation = gl.getUniformLocation(this.prog, 'u_Acceleration');
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setCameraAxes(axes: mat3) {
    this.use();
    if (this.unifCameraAxes !== -1) {
      gl.uniformMatrix3fv(this.unifCameraAxes, false, axes);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  setTimer(time: number) {
    this.use();
    if (this.unifTimer !== -1) {
      gl.uniform1f(this.unifTimer, time);
    }
  }


  setTransformAcceleraton(accel: vec3) {
    this.use();
    if (this.unifDrawAcceleratonLocation !== -1) {
      let scale = 5.0;
      gl.uniform3f(this.unifDrawAcceleratonLocation, scale * accel[0], scale * accel[1], scale * accel[2]);
    }
  }
  
  setParticleSize(particleRadius: number){
    this.use();
    if(this.unifParticleRadius !== -1){
      gl.uniform1f(this.unifParticleRadius, particleRadius);
    }
  }

  setIsAttractToPoint(isAttract: number){
    this.use();
    if(this.unifIsAttractToPoint !== -1){
      gl.uniform1i(this.unifIsAttractToPoint, isAttract);
    }
  }

  setAttractPos(ndcPos: vec2, cam: Camera){
    this.use();
    if(this.unifAttractPos !== -1){
      let len_vec = vec3.create();
      vec3.subtract(len_vec, cam.target, cam.position);
      let len = 1.35 * vec3.length(len_vec);

      let tanFovByTwo = Math.tan(0.5 * cam.fovy * ANGLE2RADIUS);

      let v = vec3.fromValues(cam.up[0] * len * tanFovByTwo, 
                              cam.up[1] * len * tanFovByTwo, 
                              cam.up[2] * len * tanFovByTwo);

      let h = vec3.fromValues(cam.right[0] * len * cam.aspectRatio * tanFovByTwo, 
                              cam.right[1] * len * cam.aspectRatio * tanFovByTwo, 
                              cam.right[2] * len * cam.aspectRatio * tanFovByTwo);
      
      let world_pos = vec3.fromValues(cam.target[0] + ndcPos[0] * h[0] + ndcPos[1] * v[0],
                                      cam.target[1] + ndcPos[0] * h[1] + ndcPos[1] * v[1],
                                      cam.target[2] + ndcPos[0] * h[2] + ndcPos[1] * v[2]);


      // let viewProj = mat4.create();
      // mat4.multiply(viewProj, cam.projectionMatrix, cam.viewMatrix);
      // let Inv_viewProj = mat4.create();
      // mat4.invert(Inv_viewProj, viewProj);

      // let ndcPos_vec4 = vec4.fromValues(ndcPos[0], ndcPos[1], 0.5, 1.0);
      
      // let world_pos_vec4 = vec4.create();
      // vec4.transformMat4(world_pos_vec4, ndcPos_vec4, Inv_viewProj);

      // let ray_dir = vec3.fromValues(world_pos_vec4[0]-cam.position[0], 
      //                               world_pos_vec4[1]-cam.position[1], 
      //                               world_pos_vec4[2]-cam.position[2]);
      // vec3.normalize(ray_dir, ray_dir);

      // let world_pos = vec3.create();
      // world_pos[0] = cam.position[0] + len * ray_dir[0];
      // world_pos[1] = cam.position[1] + len * ray_dir[1];
      // world_pos[2] = cam.position[2] + len * ray_dir[2];
      
      
      gl.uniform3fv(this.unifAttractPos, world_pos);
    }
  }

  setMeshAttractCount(count: number){
    this.use();
    if(this.unifMeshAttractPointsCount !== -1){
      gl.uniform1f(this.unifMeshAttractPointsCount, count);
    }
  }

  setMeshAttractSelect(idx: number){
    this.use();
    if(this.unifParticleAttractMeshSelect !== -1){
      gl.uniform1i(this.unifParticleAttractMeshSelect, idx);
    }
  }

  setParticleColor(color1: vec3, color2: vec3){
    this.use();
    if(this.unifParticleCol1 !== -1){
      gl.uniform3fv(this.unifParticleCol1, color1);
    }
    if(this.unifParticleCol2 !== -1){
      gl.uniform3fv(this.unifParticleCol2, color2);
    }
  }

  setParticleColorChangeFreq(freq: number){
    this.use();
    if(this.unifParticleColChangeFreq !== -1){
      gl.uniform1f(this.unifParticleColChangeFreq, freq);
    }
  }

  setParticleDrawBreathRate(rate: number){
    this.use();
    if(this.unifParticleDrawBreathRate !== -1){
      gl.uniform1f(this.unifParticleDrawBreathRate, rate);
    }
  }


  draw(d: Drawable, isInstanced: boolean = false, numInstances: number = 0) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    if(isInstanced){
      gl.drawElementsInstanced(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0, numInstances);      
    }
    else{
      gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);
    }

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
