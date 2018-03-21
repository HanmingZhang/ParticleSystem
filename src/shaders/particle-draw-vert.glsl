#version 300 es

// These consts should be consistent with those in OpenGLRneder.ts & Particle.ts
#define POSITION_LOCATION 2
// #define VELOCITY_LOCATION 3
#define COLOR_LOCATION 4
// #define TIME_LOCATION 5
// #define ID_LOCATION 6

precision highp float;
precision highp int;
precision highp sampler3D;



uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

// uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
//                             // This allows us to transform the object's normals properly
//                             // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)


layout(location = POSITION_LOCATION) in vec3 a_position;
layout(location = COLOR_LOCATION) in vec3 a_color;




in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place

out vec4 fs_Pos;
out vec4 fs_Col;

void main()
{
    // object space position
    fs_Pos = vs_Pos;

    // particle color
    fs_Col = vec4(a_color, 1.0);

    // get particle postion
    vec3 offset = a_position;

    // model space position
    vec4 modelPos = u_Model * vs_Pos;

    // move billboard to partice position
    vec3 billboardPos = offset + modelPos.x * u_CameraAxes[0] + modelPos.y * u_CameraAxes[1];

    gl_Position = u_ViewProj * vec4(billboardPos, 1.0);
}