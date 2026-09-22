// Inserted into Sylva's existing scene scope: one camera, depth buffer and clock.
var fusionPoints, fusionReleaseLut, fusionProgress = 0, fusionTravel = 0;
var fusionPointer = new THREE.Vector3(), fusionPointerStrength = 0;
window.addEventListener('message', function (event) {
  if (event.source !== parent || !event.data || event.data.type !== 'synthesis:fusion') return;
  fusionProgress = REDUCED ? 0 : clamp01(Number(event.data.progress) || 0);
});

function buildPlantFusion(limbs) {
  var count = NARROW.matches ? 1100 : 2200;
  var sources = new Float32Array(count * 3);
  var normals = new Float32Array(count * 3);
  var sphere = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var seeds = new Float32Array(count);
  var lanes = new Float32Array(count * 2);
  var p = new THREE.Vector3(), normal = new THREE.Vector3();
  for (var i = 0; i < count; i++) {
    var fraction = (i * 0.61803398875) % 1;
    limbSurface(limbs[i % Math.min(3, limbs.length)], fraction, (i * 2.39996323) % TAU, p, normal);
    p.addScaledVector(normal, 0.10 + (i % 9) * 0.018);
    sources.set([p.x, p.y, p.z], i * 3);
    normals.set([normal.x, normal.y, normal.z], i * 3);
    var y = 1 - 2 * (i + 0.5) / count;
    var radius = Math.sqrt(1 - y * y), angle = i * 2.39996323;
    sphere.set([Math.cos(angle) * radius, y, Math.sin(angle) * radius], i * 3);
    seeds[i] = (i * 0.754877666) % 1;
    lanes[i * 2] = i % 7 === 0 ? 1 : 0;
    lanes[i * 2 + 1] = i % 11 === 0 ? 1 : 0;
    colors.set(i % 13 === 0 ? [1, 0.27, 0.055] : [0.95, 0.87, 0.73], i * 3);
  }
  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(sources, 3));
  geometry.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('aSphere', new THREE.BufferAttribute(sphere, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aLane', new THREE.BufferAttribute(lanes, 2));
  fusionReleaseLut = new Float32Array(129);
  for (var step = 0; step < fusionReleaseLut.length; step++) {
    var travel = step / (fusionReleaseLut.length - 1), released = 0;
    for (var particle = 0; particle < count; particle++) {
      var release = sstep(0.06 + seeds[particle] * 0.30, 0.68 + seeds[particle] * 0.32, travel);
      if (lanes[particle * 2]) release *= 0.72 + seeds[particle] * 0.22;
      released += release;
    }
    fusionReleaseLut[step] = released / count;
  }
  var uniforms = {
    uDpr: { value: Math.min(devicePixelRatio || 1, 2) },
    uNearMatrix: { value: nearGroup.matrixWorld },
    uViewport: { value: new THREE.Vector2(W, H) },
    uPointer: { value: fusionPointer },
    uPointerStrength: { value: 0 },
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uSmoothX: { value: 0 },
    uReduced: { value: REDUCED ? 1 : 0 }
  };
  fusionPoints = new THREE.Points(geometry, new THREE.ShaderMaterial({
    transparent: true, depthTest: true, depthWrite: false,
    uniforms: uniforms,
    vertexShader: [
      'attribute vec3 aNormal; attribute vec3 aSphere; attribute vec3 color;',
      'attribute float aSeed; attribute vec2 aLane;',
      'varying vec3 vColor; varying float vDepth; varying float vPresence;',
      'uniform float uDpr; uniform float uProgress; uniform float uTime;',
      'uniform float uSmoothX; uniform float uPointerStrength; uniform float uReduced;',
      'uniform vec2 uViewport; uniform vec3 uPointer; uniform mat4 uNearMatrix;',
      'void main(){',
      '  vec3 source=(uNearMatrix*vec4(position,1.0)).xyz;',
      '  vec3 normal=normalize(mat3(uNearMatrix)*aNormal);',
      '  float radius=min(uViewport.x*(uViewport.x<=900.0?0.38:0.265),uViewport.y*0.255);',
      '  float cx=uViewport.x*(uViewport.x<=900.0?0.02:0.16);',
      '  float cy=uViewport.y*(uViewport.x<=900.0?0.20:0.16);',
      '  float yaw=uTime*0.018+uSmoothX*0.10+uProgress*0.32;',
      '  float c=cos(yaw), s=sin(yaw);',
      '  float contour=sin(aSphere.x*4.8+aSphere.y*2.1)*cos(aSphere.z*4.2-aSphere.y*1.7);',
      '  float r=radius*(0.91+contour*0.13);',
      '  vec3 target=vec3(cx+(aSphere.x*c+aSphere.z*s)*r,cy+aSphere.y*r*0.86,-120.0+(aSphere.z*c-aSphere.x*s)*r);',
      '  float t=smoothstep(0.06+aSeed*0.30,0.68+aSeed*0.32,uProgress);',
      '  t*=mix(1.0,0.72+aSeed*0.22,aLane.x);',
      '  float rest=1.0-t, arc=sin(t*3.14159265), lift=min(uViewport.y*0.16,155.0);',
      '  vec3 control=source+vec3(normal.x*lift*0.65,max(0.25,normal.y)*lift,normal.z*lift*0.55);',
      '  float bend=sin(aSeed*6.28318531)*radius*0.42;',
      '  vec3 p=rest*rest*rest*source+3.0*rest*rest*t*control;',
      '  p+=3.0*rest*t*t*(target+vec3(bend,-lift*0.30,lift*0.45))+t*t*t*target;',
      '  float flow=(1.0-uReduced)*(2.5+arc*19.0+aLane.y*rest*9.0);',
      '  p.x+=sin(p.y*0.009+p.z*0.004+uTime*0.32)*flow;',
      '  p.y+=cos(p.x*0.008-p.z*0.006+uTime*0.26)*flow*0.65;',
      '  p.z+=sin(p.y*0.007-p.x*0.005+uTime*0.22)*flow*0.55;',
      '  vec2 delta=p.xy-uPointer.xy;',
      '  float distanceToPointer=length(delta);',
      '  float reach=min(uViewport.x*0.18,135.0);',
      '  float push=pow(max(0.0,1.0-distanceToPointer/reach),2.0)*24.0*uPointerStrength;',
      '  p.xy+=delta/max(1.0,distanceToPointer)*push;',
      '  float opening=smoothstep(-0.40,0.12,contour);',
      '  vPresence=(0.16+0.16*aSeed+0.40*t+arc*0.20)*(1.0-t*(1.0-opening)*0.90);',
      '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
      '  vColor=color; vDepth=clamp(1300.0/-mv.z,0.4,1.0);',
      '  gl_Position=projectionMatrix*mv; gl_PointSize=(1.6+1.8*aSeed)*uDpr*vDepth;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vColor; varying float vDepth; varying float vPresence;',
      'void main(){ float r=length(gl_PointCoord-0.5); if(r>0.5) discard;',
      'float alpha=(1.0-smoothstep(0.12,0.5,r))*vPresence*vDepth;',
      'gl_FragColor=vec4(vColor,alpha); }'
    ].join('\n')
  }));
  fusionPoints.name = 'plant-particle-fusion';
  fusionPoints.renderOrder = 5;
  fusionPoints.frustumCulled = false;
  scene.add(fusionPoints);
}

function updatePlantFusion(dt) {
  if (!fusionPoints) return;
  nearGroup.updateMatrixWorld(true);
  // Follow scroll with a short, reversible settle rather than an autonomous morph.
  fusionTravel = REDUCED ? 0 : fusionTravel + (fusionProgress - fusionTravel) * (1 - Math.exp(-dt * 10));
  var pointerEase = 1 - Math.exp(-dt * 8);
  if (mouseLive && !REDUCED) {
    if (fusionPointerStrength < 0.01) fusionPointer.copy(hitWorld);
    else fusionPointer.lerp(hitWorld, pointerEase);
  }
  fusionPointerStrength += ((mouseLive && !REDUCED ? 1 : 0) - fusionPointerStrength) * pointerEase;
  var uniforms = fusionPoints.material.uniforms;
  uniforms.uViewport.value.set(W, H);
  uniforms.uPointerStrength.value = fusionPointerStrength;
  uniforms.uProgress.value = fusionTravel;
  uniforms.uTime.value = REDUCED ? 0 : uTime.value;
  uniforms.uSmoothX.value = smooth.x;
  uniforms.uReduced.value = REDUCED ? 1 : 0;
  var releaseIndex = fusionTravel * (fusionReleaseLut.length - 1);
  var releaseStart = Math.floor(releaseIndex);
  var releaseEnd = Math.min(fusionReleaseLut.length - 1, releaseStart + 1);
  var releaseMix = releaseIndex - releaseStart;
  var release = fusionReleaseLut[releaseStart] * (1 - releaseMix) + fusionReleaseLut[releaseEnd] * releaseMix;
  window.__fusionState = {
    count: fusionPoints.geometry.attributes.position.count,
    progress: fusionTravel,
    release: release,
    pointerDisplacement: 24 * fusionPointerStrength,
    depthTest: fusionPoints.material.depthTest,
    frames: frames,
    cameraX: camera.position.x
  };
}
