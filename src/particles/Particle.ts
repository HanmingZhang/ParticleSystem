import {gl} from '../globals';
import Object from '../objLoader';

// These consts should be consistent with those in OpenGLRneder.ts & particle-vert.glsl
const POSITION_LOCATION = 2;
const VELOCITY_LOCATION = 3;
const COLOR_LOCATION = 4;
const TIME_LOCATION = 5;
const ID_LOCATION = 6;
const MESH_ATTRACT_LOCATION1 = 7;
const MESH_ATTRACT_LOCATION2 = 8;

const NUM_LOCATIONS = 7;


class Particle{
    numParticles: number;
    particlePositions: Float32Array;
    particleVelocities: Float32Array;
    particleColors: Float32Array;
    particleTime: Float32Array;
    particleIDs: Float32Array;
    particleMeshAttractPositions1: Float32Array;
    particleMeshAttractPositions2: Float32Array;
    

    // vertex arrays and buffers
    particleVAOs: WebGLVertexArrayObject[];
    particleTransformFeedbacks: WebGLTransformFeedback[];
    particleVBOs: WebGLBuffer[][];

    constructor(_numParticles: number){
        this.numParticles = _numParticles;

        // Construct particle data
        this.particlePositions  = new Float32Array(this.numParticles * 3);
        this.particleVelocities = new Float32Array(this.numParticles * 3);
        this.particleColors     = new Float32Array(this.numParticles * 3);
        this.particleTime   = new Float32Array(this.numParticles * 2);
        this.particleIDs        = new Float32Array(this.numParticles);
        this.particleMeshAttractPositions1 = new Float32Array(this.numParticles * 3); // at most, every paticle has a attract point
        this.particleMeshAttractPositions2 = new Float32Array(this.numParticles * 3); // at most, every paticle has a attract point
        
        // Init Vertex Arrays and Buffers
        this.particleVAOs = [gl.createVertexArray(), gl.createVertexArray()];
         
        // Transform feedback objects track output buffer state
        this.particleTransformFeedbacks = [gl.createTransformFeedback(), gl.createTransformFeedback()];
        
    }

    create(){
        // Initialize particle values
        for (let p = 0; p < this.numParticles; ++p) {
            this.particlePositions[p * 3] = 0.0;
            this.particlePositions[p * 3 + 1] = 0.8;
            this.particlePositions[p * 3 + 2] = 0.0;
            
            this.particleVelocities[p * 3] = 0.0;
            this.particleVelocities[p * 3 + 1] = 0.0;
            this.particleVelocities[p * 3 + 2] = 0.0;
            
            this.particleColors[p * 3] = 0.0;
            this.particleColors[p * 3 + 1] = 0.0;
            this.particleColors[p * 3 + 2] = 0.0;

            this.particleTime[p * 2] = 0.0;
            this.particleTime[p * 2 + 1] = 0.0;
            
            this.particleIDs[p] = p;

            this.particleMeshAttractPositions1[p * 3] = 0.0;
            this.particleMeshAttractPositions1[p * 3 + 1] = 0.0;
            this.particleMeshAttractPositions1[p * 3 + 2] = 0.0;

            this.particleMeshAttractPositions2[p * 3] = 0.0;
            this.particleMeshAttractPositions2[p * 3 + 1] = 0.0;
            this.particleMeshAttractPositions2[p * 3 + 2] = 0.0;
        }

       
       
        this.particleVBOs = new Array(this.particleVAOs.length);

        for (let i = 0; i < this.particleVAOs.length; ++i) {
            this.particleVBOs[i] = new Array(NUM_LOCATIONS);

            gl.bindVertexArray(this.particleVAOs[i]);

            this.particleVBOs[i][POSITION_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][POSITION_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.particlePositions, gl.STREAM_COPY);
            gl.vertexAttribPointer(POSITION_LOCATION, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(POSITION_LOCATION);
    
            this.particleVBOs[i][VELOCITY_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][VELOCITY_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.particleVelocities, gl.STREAM_COPY);
            gl.vertexAttribPointer(VELOCITY_LOCATION, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(VELOCITY_LOCATION);

            this.particleVBOs[i][COLOR_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][COLOR_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.particleVelocities, gl.STREAM_COPY);
            gl.vertexAttribPointer(COLOR_LOCATION, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(COLOR_LOCATION);

            this.particleVBOs[i][TIME_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][TIME_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.particleTime, gl.STREAM_COPY);
            gl.vertexAttribPointer(TIME_LOCATION, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(TIME_LOCATION);
     
            this.particleVBOs[i][ID_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][ID_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.particleIDs, gl.STATIC_READ);
            gl.vertexAttribPointer(ID_LOCATION, 1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(ID_LOCATION);
            
            // // static Mesh portion
            // this.particleVBOs[i][MESH_ATTRACT_LOCATION1] = gl.createBuffer();
            // gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][MESH_ATTRACT_LOCATION1]);
            // gl.bufferData(gl.ARRAY_BUFFER, this.particleMeshAttractPositions1, gl.STATIC_READ);
            // gl.vertexAttribPointer(MESH_ATTRACT_LOCATION1, 3, gl.FLOAT, false, 0, 0);
            // gl.enableVertexAttribArray(MESH_ATTRACT_LOCATION1);
            gl.disableVertexAttribArray(MESH_ATTRACT_LOCATION1);


            // this.particleVBOs[i][MESH_ATTRACT_LOCATION2] = gl.createBuffer();
            // gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][MESH_ATTRACT_LOCATION2]);
            // gl.bufferData(gl.ARRAY_BUFFER, this.particleMeshAttractPositions2, gl.STATIC_READ);
            // gl.vertexAttribPointer(MESH_ATTRACT_LOCATION2, 3, gl.FLOAT, false, 0, 0);
            // gl.enableVertexAttribArray(MESH_ATTRACT_LOCATION2);
            gl.disableVertexAttribArray(MESH_ATTRACT_LOCATION2);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            
            // Set up output
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.particleTransformFeedbacks[i]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.particleVBOs[i][POSITION_LOCATION]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.particleVBOs[i][VELOCITY_LOCATION]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, this.particleVBOs[i][COLOR_LOCATION]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, this.particleVBOs[i][TIME_LOCATION]);
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        }
    }

    setMeshAttactPoints(obj1: Object, obj2: Object){

        let totalAttractPointsNum = Math.min(obj1.vertices.length, this.numParticles);
        for(let i = 0; i < totalAttractPointsNum; i++){
            this.particleMeshAttractPositions1[i * 3]     = obj1.vertices[i][0];
            this.particleMeshAttractPositions1[i * 3 + 1] = obj1.vertices[i][1];
            this.particleMeshAttractPositions1[i * 3 + 2] = obj1.vertices[i][2];
        }

        totalAttractPointsNum = Math.min(obj2.vertices.length, this.numParticles);
        for(let i = 0; i < totalAttractPointsNum; i++){
            this.particleMeshAttractPositions2[i * 3]     = obj2.vertices[i][0];
            this.particleMeshAttractPositions2[i * 3 + 1] = obj2.vertices[i][1];
            this.particleMeshAttractPositions2[i * 3 + 2] = obj2.vertices[i][2];
        }

        for (let i = 0; i < this.particleVAOs.length; ++i) {
            gl.bindVertexArray(this.particleVAOs[i]);

           // static Mesh portion
           this.particleVBOs[i][MESH_ATTRACT_LOCATION1] = gl.createBuffer();
           gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][MESH_ATTRACT_LOCATION1]);
           gl.bufferData(gl.ARRAY_BUFFER, this.particleMeshAttractPositions1, gl.STATIC_READ);
           gl.vertexAttribPointer(MESH_ATTRACT_LOCATION1, 3, gl.FLOAT, false, 0, 0);
           gl.enableVertexAttribArray(MESH_ATTRACT_LOCATION1);

           this.particleVBOs[i][MESH_ATTRACT_LOCATION2] = gl.createBuffer();
           gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][MESH_ATTRACT_LOCATION2]);
           gl.bufferData(gl.ARRAY_BUFFER, this.particleMeshAttractPositions2, gl.STATIC_READ);
           gl.vertexAttribPointer(MESH_ATTRACT_LOCATION2, 3, gl.FLOAT, false, 0, 0);
           gl.enableVertexAttribArray(MESH_ATTRACT_LOCATION2);

           gl.bindBuffer(gl.ARRAY_BUFFER, null);           
        }

        console.log('set mesh attract points finished!');        

    }

    getVAO(idx: number): WebGLVertexArrayObject{
        return this.particleVAOs[idx];
    }

    getTransformFeedbacks(idx: number): WebGLTransformFeedback{
        return this.particleTransformFeedbacks[idx];
    }

    getVBO(idx: number): WebGLBuffer[]{
        return this.particleVBOs[idx];
    }
}

export default Particle;