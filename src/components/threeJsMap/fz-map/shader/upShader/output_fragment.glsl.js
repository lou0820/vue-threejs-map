export default /* glsl */ `
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= transmissionAlpha + 0.1;
#endif
vec3 gradient = mix(vec3(0,0,0),vec3(1.0,1.0,1.0), vPosition.z/1.15);
outgoingLight = outgoingLight*gradient;
// 开始的位置
float y = uStart + uTime * uSpeed;
// 高度
float h = uHeight / 2.0;
if(vPosition.z > y && vPosition.z < y + h * 2.0) {
    float per = 0.0;
    if(vPosition.z < y + h){
        per = (vPosition.z - y) / h;
        outgoingLight = mix(outgoingLight,uColor,per);
    }else{
        per = (vPosition.z - y - h) / h;
        outgoingLight = mix(uColor,outgoingLight,per);
    }
}

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`
