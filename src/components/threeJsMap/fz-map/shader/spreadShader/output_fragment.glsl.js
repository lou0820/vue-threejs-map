export default /* glsl */ `
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= transmissionAlpha + 0.1;
#endif

// 半径
float r = uRadius + uTime * uSpeed;
// 宽度
float w = uWidth;
vec3 center = uCenter;
// 距离圆心的距离
float rDistance = distance(vPosition.xy,center.xy);
if(rDistance > r && rDistance < r+2.0 * w){
    float per = 0.0;
    if(rDistance < r + w){
        per = (rDistance - r) / w;
        outgoingLight = mix(outgoingLight,uColor,per);
    }else{
        per = (rDistance - r - w) / w;
        outgoingLight = mix(uColor,outgoingLight,per);
    }
    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
}else{
    gl_FragColor = vec4( outgoingLight,  0.0);
}

`
