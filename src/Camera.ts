import * as CameraControls from '3d-view-controls';
import {vec3, mat4} from 'gl-matrix';

class Camera {
  // controls: any;
  projectionMatrix: mat4 = mat4.create();
  viewMatrix: mat4 = mat4.create();
  fovy: number = 45;
  aspectRatio: number = 1;
  near: number = 0.1;
  far: number = 1000;
  position: vec3 = vec3.create();
  direction: vec3 = vec3.create();
  target: vec3 = vec3.create();
  up: vec3 = vec3.create();
  right: vec3 = vec3.create();
  forward: vec3 = vec3.create();

  rotRadius: number;

  constructor(position: vec3, target: vec3) {
    // this.controls = CameraControls(document.getElementById('canvas'), {
    //   eye: position,
    //   center: target,
    // });

    this.position[0] = position[0];
    this.position[1] = position[1];
    this.position[2] = position[2];

    this.target[0] = target[0];
    this.target[1] = target[1];
    this.target[2] = target[2];

    let dir = vec3.create();
    vec3.subtract(dir, target, position);
    this.rotRadius = vec3.length(dir); 

    // vec3.add(this.target, this.position, this.direction);
    this.up = vec3.fromValues(0, 1, 0);
    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);

    vec3.subtract(this.forward, this.target, this.position);
    vec3.normalize(this.forward, this.forward);
    vec3.cross(this.right, this.forward, this.up);
    vec3.normalize(this.right, this.right);
  }

  setAspectRatio(aspectRatio: number) {
    this.aspectRatio = aspectRatio;
  }

  updateProjectionMatrix() {
    mat4.perspective(this.projectionMatrix, this.fovy, this.aspectRatio, this.near, this.far);
  }

  // rotate camera
  update(t: number) {
    // this.controls.tick();
    
    let cosTheta = Math.cos(0.001 * t);
    let sinTheta = Math.sin(0.001 * t);

    // this.position = vec3.fromValues(this.controls.eye[0], this.controls.eye[1], this.controls.eye[2]);

    this.position = vec3.fromValues(this.rotRadius * cosTheta + this.target[0],
                                    this.target[1],
                                    this.rotRadius * sinTheta + this.target[2]);

    // this.target = vec3.fromValues(this.controls.center[0], this.controls.center[1], this.controls.center[2]);
    // mat4.lookAt(this.viewMatrix, this.controls.eye, this.controls.center, this.controls.up);
    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    
    // this.position = this.controls.eye;
    // this.up = vec3.fromValues(this.controls.up[0], this.controls.up[1], this.controls.up[2]);
    // vec3.normalize(this.up, this.up);
    vec3.subtract(this.forward, this.target, this.position);
    vec3.normalize(this.forward, this.forward);
    vec3.cross(this.right, this.forward, this.up);
    vec3.normalize(this.right, this.right);
    vec3.cross(this.up, this.right, this.forward);
    vec3.normalize(this.up, this.up);
  }
};

export default Camera;
