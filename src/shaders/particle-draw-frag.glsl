 #version 300 es
precision highp float;
precision highp int;

uniform vec4 u_Color;
uniform float u_Time;
uniform float u_ParticleRadius;    // a particle radius related to the whole billboard
uniform float u_BreathRate;

in vec4 fs_Pos;
in vec4 fs_Col;

out vec4 out_Col;


void main()
{
    float dist = 1.0 - (length(fs_Pos.xyz) * 1.0 / u_ParticleRadius);

    float scale = 0.5 * (sin(0.0005 * u_BreathRate * u_Time) + 1.0) + 0.35;
    if(scale > 1.15){
        scale = 1.15;
    }

    out_Col = vec4(dist) * fs_Col * scale;
}