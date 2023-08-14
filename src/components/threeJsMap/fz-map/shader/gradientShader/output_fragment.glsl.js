export default /* glsl */ `
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= transmissionAlpha + 0.1;
#endif
vec3 gradient = mix(uColor1, uColor2, vPosition.z/uHeight);

outgoingLight = outgoingLight*gradient;


gl_FragColor = vec4( outgoingLight, diffuseColor.a  );
`
