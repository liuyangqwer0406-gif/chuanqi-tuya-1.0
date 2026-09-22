// Inserted into Sylva's existing scene scope: one camera, depth buffer and clock.
var fusionPoints, fusionSources, fusionNormals, fusionSphere, fusionProgress = 0, fusionTravel = 0;
var fusionWorld = new THREE.Vector3(), fusionNormal = new THREE.Vector3();
var fusionPointer = new THREE.Vector3(), fusionPointerStrength = 0;
window.addEventListener('message', function (event) {
  if (event.source !== parent || !event.data || event.data.type !== 'synthesis:fusion') return;
  fusionProgress = REDUCED ? 0 : clamp01(Number(event.data.progress) || 0);
});

function buildPlantFusion(limbs) {
  var count = NARROW.matches ? 1100 : 2200;
  var positions = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var presence = new Float32Array(count);
  var seeds = new Float32Array(count);
  fusionSources = new Float32Array(count * 3);
  fusionNormals = new Float32Array(count * 3);
  fusionSphere = new Float32Array(count * 3);
  var p = new THREE.Vector3(), normal = new THREE.Vector3();
  for (var i = 0; i < count; i++) {
    var fraction = (i * 0.61803398875) % 1;
    limbSurface(limbs[i % Math.min(3, limbs.length)], fraction, (i * 2.39996323) % TAU, p, normal);
    p.addScaledVector(normal, 0.10 + (i % 9) * 0.018);
    fusionSources.set([p.x, p.y, p.z], i * 3);
    fusionNormals.set([normal.x, normal.y, normal.z], i * 3);
    var y = 1 - 2 * (i + 0.5) / count;
    var radius = Math.sqrt(1 - y * y), angle = i * 2.39996323;
    fusionSphere.set([Math.cos(angle) * radius, y, Math.sin(angle) * radius], i * 3);
    seeds[i] = (i * 0.754877666) % 1;
    colors.set(i % 13 === 0 ? [1, 0.27, 0.055] : [0.95, 0.87, 0.73], i * 3);
  }
  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aPresence', new THREE.BufferAttribute(presence, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  geometry.attributes.aPresence.setUsage(THREE.DynamicDrawUsage);
  fusionPoints = new THREE.Points(geometry, new THREE.ShaderMaterial({
    transparent: true, depthTest: true, depthWrite: false,
    uniforms: { uDpr: { value: Math.min(devicePixelRatio || 1, 2) } },
    vertexShader: [
      'attribute vec3 color; attribute float aPresence; attribute float aSeed;',
      'varying vec3 vColor; varying float vDepth; varying float vPresence; uniform float uDpr;',
      'void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);',
      'vColor=color; vPresence=aPresence; vDepth=clamp(1300.0 / -mv.z,0.4,1.0);',
      'gl_Position=projectionMatrix*mv; gl_PointSize=(1.6+1.8*aSeed)*uDpr*vDepth; }'
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
  var a = fusionPoints.geometry.attributes.position.array;
  var presence = fusionPoints.geometry.attributes.aPresence.array;
  var seeds = fusionPoints.geometry.attributes.aSeed.array;
  var narrow = NARROW.matches;
  var radius = Math.min(W * (narrow ? 0.38 : 0.265), H * 0.255);
  var cx = narrow ? W * 0.02 : W * 0.16;
  var cy = H * (narrow ? 0.20 : 0.16);
  var time = REDUCED ? 0 : uTime.value;
  var yaw = time * 0.018 + smooth.x * 0.10 + fusionTravel * 0.32;
  var c = Math.cos(yaw), s = Math.sin(yaw);
  var released = 0, pointerDisplacement = 0;
  for (var i = 0; i < a.length / 3; i++) {
    var k = i * 3, seed = seeds[i];
    fusionWorld.fromArray(fusionSources, k).applyMatrix4(nearGroup.matrixWorld);
    fusionNormal.fromArray(fusionNormals, k).transformDirection(nearGroup.matrixWorld);
    var x = fusionSphere[k], y = fusionSphere[k + 1], z = fusionSphere[k + 2];
    var contour = Math.sin(x * 4.8 + y * 2.1) * Math.cos(z * 4.2 - y * 1.7);
    var r = radius * (0.91 + contour * 0.13);
    var targetX = cx + (x * c + z * s) * r;
    var targetY = cy + y * r * 0.86;
    var targetZ = -120 + (z * c - x * s) * r;
    // Every point starts on the plant. Interleaved delays retain a loose connecting trail.
    var t = sstep(0.06 + seed * 0.30, 0.68 + seed * 0.32, fusionTravel);
    if (i % 7 === 0) t *= 0.72 + seed * 0.22;
    released += t;
    var rest = 1 - t, arc = Math.sin(t * Math.PI);
    var lift = Math.min(H * 0.16, 155);
    // Cubic paths leave along the surface normal, then curl into the target contour.
    var controlX = fusionWorld.x + fusionNormal.x * lift * 0.65;
    var controlY = fusionWorld.y + Math.max(0.25, fusionNormal.y) * lift;
    var controlZ = fusionWorld.z + fusionNormal.z * lift * 0.55;
    var bend = Math.sin(seed * TAU) * radius * 0.42;
    var px = rest * rest * rest * fusionWorld.x + 3 * rest * rest * t * controlX + 3 * rest * t * t * (targetX + bend) + t * t * t * targetX;
    var py = rest * rest * rest * fusionWorld.y + 3 * rest * rest * t * controlY + 3 * rest * t * t * (targetY - lift * 0.30) + t * t * t * targetY;
    var pz = rest * rest * rest * fusionWorld.z + 3 * rest * rest * t * controlZ + 3 * rest * t * t * (targetZ + lift * 0.45) + t * t * t * targetZ;
    // A shared spatial field keeps nearby motes moving together; time stops with the scene.
    var flow = (REDUCED ? 0 : 1) * (2.5 + arc * 19 + (i % 11 === 0 ? rest * 9 : 0));
    px += Math.sin(py * 0.009 + pz * 0.004 + time * 0.32) * flow;
    py += Math.cos(px * 0.008 - pz * 0.006 + time * 0.26) * flow * 0.65;
    pz += Math.sin(py * 0.007 - px * 0.005 + time * 0.22) * flow * 0.55;
    var dx = px - fusionPointer.x, dy = py - fusionPointer.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    var reach = Math.min(W * 0.18, 135);
    var push = Math.pow(Math.max(0, 1 - distance / reach), 2) * 24 * fusionPointerStrength;
    px += dx / Math.max(1, distance) * push;
    py += dy / Math.max(1, distance) * push;
    pointerDisplacement = Math.max(pointerDisplacement, push);
    a[k] = px; a[k + 1] = py; a[k + 2] = pz;
    // Dim irregular gaps in the gathered form instead of drawing a perfectly solid globe.
    var opening = sstep(-0.40, 0.12, contour);
    presence[i] = (0.16 + 0.16 * seed + 0.40 * t + arc * 0.20) * (1 - t * (1 - opening) * 0.90);
  }
  fusionPoints.geometry.attributes.position.needsUpdate = true;
  fusionPoints.geometry.attributes.aPresence.needsUpdate = true;
  window.__fusionState = { count: a.length / 3, progress: fusionTravel, release: released / (a.length / 3), pointerDisplacement: pointerDisplacement, depthTest: fusionPoints.material.depthTest, frames: frames, cameraX: camera.position.x };
}
