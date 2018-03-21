#version 300 es

// These consts should be consistent with those in OpenGLRneder.ts & Particle.ts
#define POSITION_LOCATION 2
#define VELOCITY_LOCATION 3
#define COLOR_LOCATION 4
#define TIME_LOCATION 5
#define ID_LOCATION 6
#define MESH_ATTRACT_LOCATION1 7
#define MESH_ATTRACT_LOCATION2 8

precision highp float;
precision highp int;
precision highp sampler3D;


const float PI = 3.14159;
const float TWO_PI = 6.2831;

// const vec3 attractPos = vec3(0.0, 5.0, 0.0);

uniform vec3 u_inputColor1;
uniform vec3 u_inputColor2;
uniform float u_colChangeFreq;

uniform float u_Time;
uniform vec3  u_Acceleration;
uniform int   u_IsAttract;
uniform vec3  u_AttractPos;
uniform float u_MeshAtrractPointCount;
uniform int   u_MeshSelect;


uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself


layout(location = POSITION_LOCATION) in vec3 a_position;
layout(location = VELOCITY_LOCATION) in vec3 a_velocity;
layout(location = COLOR_LOCATION) in vec3 a_color;
layout(location = TIME_LOCATION) in vec2 a_time; // vec.x is spawn time, vec.y is lifetime
layout(location = ID_LOCATION) in float a_ID;
layout(location = MESH_ATTRACT_LOCATION1) in vec3 a_mesh_attract_pos1;
layout(location = MESH_ATTRACT_LOCATION2) in vec3 a_mesh_attract_pos2;


out vec3 v_position;
out vec3 v_velocity;
out vec3 v_color;
out vec2 v_time; // vec.x spawn time, vec.y lifetime


float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}


vec3 genParticlePosInSphere(float spaceSphereRadius){
        float theta = PI * rand(vec2(a_ID, fract(u_Time) * a_ID));
        float phi   = TWO_PI * rand(vec2(fract(u_Time) * a_ID, a_ID));
        
        return vec3(rand(vec2(a_ID, 1.5 * a_ID)) * spaceSphereRadius * sin(theta)*cos(phi), 
                    rand(vec2(a_ID, 2.5 * a_ID)) * spaceSphereRadius * cos(theta), 
                    rand(vec2(a_ID, 0.5 * a_ID)) * spaceSphereRadius * sin(theta)*sin(phi));
}



void main()
{   

    // if(a_ID > 90000.0){
    //     // -----------------------------------------------------------------
    //     // ---------------- old version particle update --------------------
    //     // -----------------------------------------------------------------

    //     // ************ particles should emit like a fountain **************

    //     // if the particle's spawn is 0.0 or its life time exceeds its life time
    //     if (a_time.x == 0.0 || (u_Time - a_time.x > a_time.y) || a_position.y < -0.5) {
    //     // if (a_time.x == 0.0 || (u_Time - a_time.x > a_time.y)) {

    //         // Generate a new particle
    //         v_position = vec3(0.0, 0.8, 0.0);
            
    //         v_velocity = vec3(rand(vec2(a_ID, 0.0)) - 0.5, rand(vec2(a_ID, a_ID)), rand(vec2(a_ID, 2.0 * a_ID)) - 0.5);
    //         v_velocity *= 1.0;

    //         v_color = vec3(rand(vec2(a_ID, 0.0)), rand(vec2(a_ID, a_ID)), rand(vec2(a_ID, 2.0 * a_ID)));

    //         v_time.x = u_Time; // update spawn time

    //         v_time.y = 2500.0; // set life time
    //     } else {
    //         // Update status information
    //         v_velocity = a_velocity + 0.01 * u_Acceleration;
    //         v_position = a_position + 0.01 * v_velocity;

    //         v_color = a_color;

    //         v_time = a_time;
    //     }
    //     // -----------------------------------------------------------------
    // }

    // else{
        float spaceSphereRadius = 13.0;
        float distToCenter = length(a_position);
        float t = (spaceSphereRadius - distToCenter) / spaceSphereRadius;

        float tmp = 0.5 * (sin(0.001 * u_colChangeFreq * u_Time) + 1.0);
        vec3 color1 = (1.0 - tmp) * u_inputColor1 + tmp * u_inputColor2;
        vec3 color2 = (1.0 - tmp) * u_inputColor2 + tmp * u_inputColor1;

        // a new particle
        if(a_time.x == 0.0 || distToCenter > spaceSphereRadius){
            // setup initial position
            v_position = genParticlePosInSphere(spaceSphereRadius);

            // velocity (random)
            v_velocity = vec3(rand(vec2(a_ID, 0.0)) - 0.5, rand(vec2(a_ID, a_ID)) - 0.5, rand(vec2(2.0 * a_ID, 2.0 * a_ID)) - 0.5);
            v_velocity = normalize(v_velocity);

            // color
            v_color = color1 * (1.0 - t) + color2 * t; // lerp color based on distance

            // spawn time
            v_time.x = u_Time;

            // life time
            v_time.y = 5000.0; 
        }
        // an old particle
        // update particle information
        else{
            // update positin
            float rotationSpeed = 0.1;
            float deltaTime = 0.01;

            vec3 vel = vec3(0.0, 0.0, 0.0);
            bool isUpdatePos = true;

            // mesh attract force
            // so far, very naive version and one vertex will attract one particle
            if(a_ID < float(u_MeshAtrractPointCount)){
                vec3 dirVec = vec3(0.0, 0.0, 0.0);
                float dist = 0.0;

                if(u_MeshSelect == 1){
                dirVec = a_mesh_attract_pos1 - a_position;
                dist = distance(a_mesh_attract_pos1, a_position);
                }
                else if(u_MeshSelect == 2){
                dirVec = a_mesh_attract_pos2 - a_position;
                dist = distance(a_mesh_attract_pos2, a_position);
                }

                // vel = deltaTime * 500.0 * dist * dist * dirVec;
                vel = deltaTime * 1000.0 * dirVec;
            }
            else{
                // original random velcoity
                vel = a_velocity; 

                // tangent direction rotating velcoity
                vec3 tmp = normalize(a_position);
                tmp = cross(vec3(0, 1, 0), tmp); 
                vel += vel + 0.7 * tmp;
            }

            // mouse click attractive/repel force
            if(u_IsAttract != 0){
                vec3 dirVec = u_AttractPos - a_position;
                float dist = length(dirVec);
                dirVec = normalize(dirVec);

                vel = vel + float(u_IsAttract) * deltaTime * 5000.0 * 1.0 / dist * dirVec;
            }
            
            // calculate final position
            if(isUpdatePos){
                v_position = a_position + deltaTime * rotationSpeed * vel;
            }
            else{
                v_position = a_position;
            }

            // keep original random velcoity
            v_velocity = a_velocity; 
            
            // lerp color based on distance
            v_color = color1 * (1.0 - t) + color2 * t; 
    

            v_time = a_time;
        }
    // }
    // ---------------------------------------------
    // can be used for drawing dots

    // vec4 objPos = vec4(v_position, 1.0);
    // vec4 modelPos = u_Model * objPos;
    // gl_Position = modelPos;
}