/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import React, { useEffect, useRef } from "react";

interface SpiralDiscProps {
  onRelease?: () => void;
  className?: string;
}

/**
 * SpiralScene replica
 * Reverse-engineered from contentarchitecture.dev chunk 4526xt2za6pm9 (SpiralScene)
 * + util module 281783 + setupCursorTracking / CursorLabel.
 * Renders with raw WebGL2 (no OGL) — same shaders & CPU timing model.
 */

const TEXT = "WEN YIFAN · VISUAL SYNTHESIS · 2026 .";
const DOT_CHAR_INDEX = TEXT.indexOf("."); // period slot in atlas = the "dot" glyph
const LETTER_INDICES = Array.from(TEXT).map((_, i) => i).filter((i) => i !== DOT_CHAR_INDEX);
const ATLAS_COLS = 8;
const ATLAS_ROWS = Math.ceil(TEXT.length / ATLAS_COLS);
const CELL = 64;
const RING_COUNT = 30;
const RIPPLE_SLOTS = 16;
const BG = "#07080a";
const PX_TO_DESIGN = 1 / 540; // 0.001851851851851852
const LABELS = {
  idle: "Click & hold",
  holding: "Keep holding",
  charged: "Release",
  idleTouch: "Tap & hold",
};

// ---------- utils (module 281783) ----------
const BASE_QUAD_POSITION = new Float32Array([
  -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,
  -0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
]);
const BASE_QUAD_UV = new Float32Array([
  0, 0, 1, 0, 1, 1,
  0, 0, 1, 1, 0, 1,
]);

function getMonoFontCss(sizePx: number, weight = 400): string {
  const mono =
    getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() ||
    "ui-monospace, monospace";
  return `${weight} ${Math.floor(sizePx)}px ${mono}`;
}

function hexToRgb01(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function smoothstep01(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Inverse of smoothstep on [0,1] via Newton (entrance ring arrival times). */
function smoothstepInverse(e: number): number {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  let t = e;
  for (let n = 0; n < 6; n++) {
    const n2 = t * t;
    const f = 3 * n2 - 2 * n2 * t - e;
    const df = 6 * t - 6 * n2;
    if (df === 0) break;
    t -= f / df;
  }
  return Math.max(0, Math.min(1, t));
}

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function isTouchDevice() {
  // Prefer coarse pointer; maxTouchPoints alone is true on many desktop browsers.
  return matchMedia("(pointer: coarse)").matches;
}

// ---------- glyph atlas (canvas 2d → texture) ----------
function buildAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = CELL * ATLAS_COLS;
  canvas.height = CELL * ATLAS_ROWS;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = getMonoFontCss(57.6);
  for (let i = 0; i < TEXT.length; i++) {
    const x = ((i % ATLAS_COLS) + 0.5) * CELL;
    const y = (Math.floor(i / ATLAS_COLS) + 0.55) * CELL;
    const ch = TEXT[i];
    if (ch === ".") {
      ctx.beginPath();
      ctx.arc(x, y, 5.76, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.fillText(ch ?? "", x, y);
  }
  return canvas;
}

// ---------- ring layout ----------
function buildRings() {
  const rings = Array(RING_COUNT);
  for (let t = 0; t < RING_COUNT; t++) {
    const a = t / (RING_COUNT - 1);
    const radius = 0.06 + 1.39 * a;
    const speed = (t % 2 === 0 ? 1 : -1) * (0.006 + (1 - a) * 0.029);
    const letterSizePx = 14 + 16 * a;
    const charsCount = Math.max(
      8,
      Math.floor((2 * Math.PI * radius) / (0.6 * letterSizePx * PX_TO_DESIGN))
    );
    const bandCenter =
      Math.random() < 0.15
        ? Math.random() * Math.PI * 2
        : 0.25 + (Math.random() - 0.5) * 0.65 * Math.PI;
    const bandScale =
      Math.random() < 0.1
        ? 0.05 + 0.15 * Math.random()
        : 0.25 + 0.35 * a + 0.3 * Math.random();
    rings[t] = {
      radius,
      charsCount,
      speed,
      letterSizePx,
      bandCenter,
      bandHalfWidth: Math.min(0.98, bandScale) * Math.PI,
      bandSoftness: Math.PI * (0.07 + 0.13 * Math.random()),
    };
  }
  return rings;
}

/** Fill each ring with letter runs + random dot gaps (original packing). */
function packLetters(count: number) {
  const isLetter = new Uint8Array(count);
  const letterIdx = new Uint16Array(count);
  let o = 0;
  while (o < count) {
    for (let n = 0; n < LETTER_INDICES.length && o < count; n++) {
      isLetter[o] = 1;
      letterIdx[o] = LETTER_INDICES[n] ?? 0;
      o++;
    }
    const gap = 1 + Math.floor(3 * Math.random());
    for (let t = 0; t < gap && o < count; t++) o++;
  }
  return { isLetter, letterIdx };
}

function buildInstances(rings: any[]) {
  let total = 0;
  for (const r of rings) total += r.charsCount;

  const aRadius = new Float32Array(total);
  const aTheta0 = new Float32Array(total);
  const aSpeed = new Float32Array(total);
  const aSize = new Float32Array(total);
  const aCharIdx = new Float32Array(total);
  const aRingIdx = new Float32Array(total);

  let s = 0;
  for (let ri = 0; ri < rings.length; ri++) {
    const ring = rings[ri];
    if (!ring) continue;
    const { isLetter, letterIdx } = packLetters(ring.charsCount);
    const phase0 = Math.random() * Math.PI * 2;
    const step = (2 * Math.PI) / ring.charsCount;
    const outer = ring.bandHalfWidth + ring.bandSoftness;
    const inner = Math.max(0, ring.bandHalfWidth - ring.bandSoftness);

    for (let e = 0; e < ring.charsCount; e++) {
      const theta = phase0 + e * step;
      const ang = Math.abs(wrapAngle(theta - ring.bandCenter));
      const w = smoothstep01(outer, inner, ang);
      const placeLetter =
        isLetter[e] === 1 && (w > 0.7 || (!(w < 0.3) && Math.random() < w));

      aRadius[s] = ring.radius;
      aTheta0[s] = theta;
      aSpeed[s] = ring.speed;
      aRingIdx[s] = ri;
      if (placeLetter) {
        aCharIdx[s] = letterIdx[e] ?? 0;
        aSize[s] = ring.letterSizePx * (0.85 + 0.15 * w);
      } else {
        aCharIdx[s] = DOT_CHAR_INDEX;
        aSize[s] = 5;
      }
      s++;
    }
  }
  return { aRadius, aTheta0, aSpeed, aSize, aCharIdx, aRingIdx, total };
}

// ---------- shaders (verbatim from site, with DOT index baked) ----------
const VS = `#version 300 es
precision highp float;

in vec2 position;
in vec2 uv;
in float aRadius;
in float aTheta0;
in float aSpeed;
in float aSize;
in float aCharIdx;
in float aRingIdx;

uniform float uTime;
uniform vec2 uFitScale;
uniform vec2 uCenter;
uniform vec2 uAtlasGrid;
uniform float uPxToDesign;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform float uMouseRadius;
uniform float uRingCharge[30];
uniform float uRingGather[30];
uniform float uRippleStarts[16];
uniform float uRingOffsets[30];
uniform float uRingArrivalTime[30];

const float RIPPLE_DURATION_S = 1.8000;
const float RIPPLE_MAX_RADIUS_S = 1.6000;
const float RIPPLE_WIDTH_S = 0.8500;
const float RIPPLE_RADIAL_PUSH_S = 0.0450;
const float RIPPLE_SCALE_BOOST_S = 0.5000;
const float DOT_SIZE_PX_S = 5.0000;
const float ENTRANCE_FADE_S = 0.5000;
const float HOLD_GATHER_SCALE_S = 0.1200;
const float HOLD_SHAKE_AMPLITUDE_S = 0.0020;
const float HOLD_SHAKE_FRACTION_S = 0.1800;
const float HOLD_GLITCH_RATE_S = 9.0000;
const float HOLD_GLITCH_FRACTION_S = 0.1500;
const float DOT_CHAR = ${DOT_CHAR_INDEX}.0;

out vec2 vUv;
out float vRingT;
out float vAlpha;

void main() {
  float rippleInfluence = 0.0;
  for (int r = 0; r < 16; r++) {
    float start = uRippleStarts[r];
    if (start < 0.0) continue;
    float elapsed = uTime - start;
    if (elapsed < 0.0 || elapsed >= RIPPLE_DURATION_S) continue;
    float t = elapsed / RIPPLE_DURATION_S;
    float waveRadius = smoothstep(0.0, 1.0, t) * RIPPLE_MAX_RADIUS_S;
    float bell = 1.0 - smoothstep(0.0, RIPPLE_WIDTH_S * 0.5, abs(aRadius - waveRadius));
    float lifeFade = smoothstep(0.0, 0.22, t) * (1.0 - smoothstep(0.78, 1.0, t));
    rippleInfluence = max(rippleInfluence, bell * lifeFade);
  }

  float holdCharge = uRingCharge[int(aRingIdx)];
  float gatherAmt = uRingGather[int(aRingIdx)];
  float effectiveRadius = aRadius * (1.0 - gatherAmt * HOLD_GATHER_SCALE_S)
    + rippleInfluence * RIPPLE_RADIAL_PUSH_S;

  float theta = aTheta0 + uTime * aSpeed + uRingOffsets[int(aRingIdx)];
  float c = cos(theta);
  float s = sin(theta);
  vec2 ringCenter = vec2(c, s) * effectiveRadius;

  float mouseDist = length(ringCenter - uMouse);
  float hoverInfluence = (1.0 - smoothstep(0.0, uMouseRadius, mouseDist)) * uMouseInfluence;

  float strength = max(hoverInfluence * 2.5, rippleInfluence);
  float seed = aTheta0 * 7.13 + aRadius * 13.97;
  float threshold = fract(sin(seed * 12.9898) * 43758.5453);
  float isDot = step(threshold, strength);

  float glitchTick = floor(uTime * HOLD_GLITCH_RATE_S);
  float glitchNoise = fract(sin(seed * 91.7 + glitchTick * 7.31) * 43758.5453);
  isDot = max(isDot, step(glitchNoise, holdCharge * HOLD_GLITCH_FRACTION_S));
  float charIdxNow = mix(aCharIdx, DOT_CHAR, isDot);
  float sizePx = mix(aSize, DOT_SIZE_PX_S, isDot) * (1.0 + rippleInfluence * RIPPLE_SCALE_BOOST_S);

  float designSize = sizePx * uPxToDesign;
  vec2 rotated = vec2(
    -position.x * s - position.y * c,
    position.x * c - position.y * s
  ) * designSize;

  float shakeSeed = fract(sin(aTheta0 * 91.17 + aRadius * 47.91) * 24634.6345);
  float shakes = step(shakeSeed, HOLD_SHAKE_FRACTION_S);
  vec2 tremor = vec2(
    sin(uTime * (38.0 + shakeSeed * 14.0) + shakeSeed * 271.0),
    cos(uTime * (34.0 + shakeSeed * 17.0) + shakeSeed * 113.0)
  ) * (holdCharge * shakes * HOLD_SHAKE_AMPLITUDE_S);

  vec2 worldPos = (ringCenter + rotated + tremor) * uFitScale + uCenter;

  float col = mod(charIdxNow, uAtlasGrid.x);
  float row = floor(charIdxNow / uAtlasGrid.x);
  vUv = vec2((col + uv.x) / uAtlasGrid.x, (row + (1.0 - uv.y)) / uAtlasGrid.y);

  vRingT = clamp(aRadius, 0.0, 1.2);

  float arrival = uRingArrivalTime[int(aRingIdx)];
  vAlpha = clamp((uTime - arrival) / ENTRANCE_FADE_S, 0.0, 1.0);

  gl_Position = vec4(worldPos, 0.0, 1.0);
}
`;

const FS = `#version 300 es
precision mediump float;

uniform sampler2D tAtlas;

in vec2 vUv;
in float vRingT;
in float vAlpha;

out vec4 fragColor;

void main() {
  vec4 sampled = texture(tAtlas, vUv);
  float dim = mix(0.85, 1.0, smoothstep(0.0, 0.85, vRingT));
  fragColor = vec4(vec3(dim), sampled.a * vAlpha);
}
`;

// ---------- WebGL helpers ----------
function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || "shader compile failed");
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || "link failed");
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

function createAtlasTexture(gl: WebGL2RenderingContext, image: TexImageSource): WebGLTexture {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  return tex;
}

// ---------- main scene ----------
function mountSpiral(container: HTMLElement, labelEl: HTMLElement, onRelease?: () => void) {
  // labelEl passed as argument
  const touch = isTouchDevice();
  if (touch) {
    labelEl.classList.add("touch-fixed", "show");
    labelEl.textContent = LABELS.idleTouch;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) {
    document.getElementById("fallback").style.display = "grid";
    return () => {};
  }

  const [cr, cg, cb] = hexToRgb01(BG);
  gl.clearColor(cr, cg, cb, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  let atlasImage = buildAtlas();
  let atlasTex = createAtlasTexture(gl, atlasImage);

  const rings = buildRings();
  const inst = buildInstances(rings);

  // entrance arrival times (same formula as site)
  const arrival = new Float32Array(RING_COUNT);
  for (let e = 0; e < RING_COUNT; e++) {
    const ring = rings[e];
    const a = Math.max(0, ring.radius - 0.425);
    arrival[e] = 1.8 * smoothstepInverse(Math.min(1, a / 1.6));
  }

  const program = link(gl, VS, FS);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  function attrib(name, size, data, instanced) {
    const loc = gl.getAttribLocation(program, name);
    if (loc < 0) return null;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    if (instanced) gl.vertexAttribDivisor(loc, 1);
    return buf;
  }

  attrib("position", 2, BASE_QUAD_POSITION, false);
  attrib("uv", 2, BASE_QUAD_UV, false);
  attrib("aRadius", 1, inst.aRadius, true);
  attrib("aTheta0", 1, inst.aTheta0, true);
  attrib("aSpeed", 1, inst.aSpeed, true);
  attrib("aSize", 1, inst.aSize, true);
  attrib("aCharIdx", 1, inst.aCharIdx, true);
  attrib("aRingIdx", 1, inst.aRingIdx, true);

  gl.useProgram(program);
  const U = {
    uTime: gl.getUniformLocation(program, "uTime"),
    uFitScale: gl.getUniformLocation(program, "uFitScale"),
    uCenter: gl.getUniformLocation(program, "uCenter"),
    uAtlasGrid: gl.getUniformLocation(program, "uAtlasGrid"),
    uPxToDesign: gl.getUniformLocation(program, "uPxToDesign"),
    uMouse: gl.getUniformLocation(program, "uMouse"),
    uMouseInfluence: gl.getUniformLocation(program, "uMouseInfluence"),
    uMouseRadius: gl.getUniformLocation(program, "uMouseRadius"),
    uRingCharge: gl.getUniformLocation(program, "uRingCharge"),
    uRingGather: gl.getUniformLocation(program, "uRingGather"),
    uRippleStarts: gl.getUniformLocation(program, "uRippleStarts"),
    uRingOffsets: gl.getUniformLocation(program, "uRingOffsets"),
    uRingArrivalTime: gl.getUniformLocation(program, "uRingArrivalTime"),
    tAtlas: gl.getUniformLocation(program, "tAtlas"),
  };

  gl.uniform2f(U.uAtlasGrid, ATLAS_COLS, ATLAS_ROWS);
  gl.uniform1f(U.uPxToDesign, PX_TO_DESIGN);
  gl.uniform1f(U.uMouseRadius, 0.35);
  gl.uniform1fv(U.uRingArrivalTime, arrival);
  gl.uniform1i(U.tAtlas, 0);

  // CPU state
  let width = 1, height = 1;
  const fitScale = new Float32Array([1, 1]);
  const center = new Float32Array([0, 0]);
  const mouseTarget = new Float32Array([999, 999]);
  const mouseSmooth = new Float32Array([999, 999]);
  let mouseInfTarget = 0;
  let mouseInf = 0;

  let holding = false;
  let charged = false;
  let charge = 0; // eg
  let gather = 0; // ev
  let releaseT = -1; // eR
  const ripples: { start: number; strength: number }[] = [];
  const ringCharge = new Float32Array(RING_COUNT);
  const ringGather = new Float32Array(RING_COUNT);
  const freezeAccum = new Float32Array(RING_COUNT); // e_
  const spinVel = new Float32Array(RING_COUNT); // eu
  const spinPos = new Float32Array(RING_COUNT); // ed
  const offsets = new Float32Array(RING_COUNT);
  const rippleStarts = new Float32Array(RIPPLE_SLOTS).fill(-1);

  let scrollVel = 0; // optional; site uses Lenis velocity
  let scrollBoost = 0; // eA

  let mode = "idle";
  function setMode(next: keyof typeof LABELS | "holding" | "charged") {
    if (mode === next) return;
    mode = next;
    if (touch) {
      labelEl.textContent = next === "idle" ? LABELS.idleTouch : LABELS[next];
    } else {
      labelEl.textContent = LABELS[next];
    }
  }

  let time = 0;
  let last = performance.now();
  let raf = 0;
  let visible = true;
  let pageVisible = !document.hidden;
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  let motionOk = !reduceMQ.matches;

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = width / height;
    if (aspect >= 1) {
      fitScale[0] = 1;
      fitScale[1] = aspect;
    } else {
      fitScale[0] = 1 / aspect;
      fitScale[1] = 1;
    }
  }

  function designFromLocal(localX: number, localY: number) {
    // NDC-ish design space matching site eD()
    const ndcX = (localX / width) * 2 - 1;
    const ndcY = -((localY / height) * 2 - 1);
    return [
      (ndcX - center[0]) / fitScale[0],
      (ndcY - center[1]) / fitScale[1],
    ];
  }

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);

    gl.uniform1f(U.uTime, time);
    gl.uniform2fv(U.uFitScale, fitScale);
    gl.uniform2fv(U.uCenter, center);
    gl.uniform2fv(U.uMouse, mouseSmooth);
    gl.uniform1f(U.uMouseInfluence, mouseInf);
    gl.uniform1fv(U.uRingCharge, ringCharge);
    gl.uniform1fv(U.uRingGather, ringGather);
    gl.uniform1fv(U.uRippleStarts, rippleStarts);
    gl.uniform1fv(U.uRingOffsets, offsets);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, inst.total);
  }

  const rawCharge = new Float32Array(RING_COUNT);
  const rawGather = new Float32Array(RING_COUNT);

  function tickClean(now: number) {
    const dt = Math.min(0.05, (now - last) * 0.001);
    last = now;
    if (motionOk) time += dt;

    while (ripples.length > 0) {
      const r = ripples[0];
      if (!r || time - r.start < 1.8) break;
      ripples.shift();
    }
    for (let i = 0; i < RIPPLE_SLOTS; i++) {
      rippleStarts[i] = ripples[i] ? ripples[i].start : -1;
    }

    const kInf = 1 - Math.exp(-6 * dt);
    mouseInf += (mouseInfTarget - mouseInf) * kInf;
    const kPos = 1 - Math.exp(-14 * dt);
    mouseSmooth[0] += (mouseTarget[0] - mouseSmooth[0]) * kPos;
    mouseSmooth[1] += (mouseTarget[1] - mouseSmooth[1]) * kPos;

    if (holding) {
      charge = Math.min(1, charge + dt / 0.9);
      gather = 1 - (1 - gather) * Math.exp(-dt / 4);
      if (!charged && charge >= 1) {
        charged = true;
        setMode("charged");
      }
    } else {
      charge *= Math.exp(-10 * dt);
      gather *= Math.exp(-10 * dt);
    }

    const decay = Math.exp(-10 * dt);
    const sinceRelease = time - releaseT;
    const releasing = releaseT >= 0 && sinceRelease < 1.8;
    const waveEdge = releasing
      ? 1.6 * smoothstep01(0, 1, sinceRelease / 1.8) + 0.425
      : Infinity;

    for (let i = 0; i < RING_COUNT; i++) {
      const ring = rings[i];
      let o = rawCharge[i];
      let n = rawGather[i];
      if (holding) {
        const k = 1 - Math.exp(-14 * dt);
        o += (charge - o) * k;
        n += (smoothstep01(0, 1, charge) * gather - n) * k;
      } else if (!releasing || waveEdge >= ring.radius) {
        o *= decay;
        n *= decay;
      }
      rawCharge[i] = o;
      rawGather[i] = n;
      ringGather[i] = n;
      const r = smoothstep01(0, 1, o);
      ringCharge[i] = r;
      freezeAccum[i] -= r * ring.speed * dt;
    }

    scrollVel *= Math.exp(-5 * dt);
    const d = Math.min(40, Math.abs(scrollVel));
    scrollBoost += (d - scrollBoost) * (1 - Math.exp(-4 * dt));
    const kSpin = 1 - Math.exp(-3 * dt);

    for (let i = 0; i < RING_COUNT; i++) {
      const ring = rings[i];
      let o = 0;
      for (const e of ripples) {
        const t = time - e.start;
        if (t < 0 || t >= 1.8) continue;
        const n = t / 1.8;
        const waveR = 1.6 * smoothstep01(0, 1, n);
        const bell =
          1 - smoothstep01(0, 0.425, Math.abs(ring.radius - waveR));
        const life =
          smoothstep01(0, 0.22, n) * (1 - smoothstep01(0.78, 1, n));
        const strength = bell * life * e.strength;
        if (strength > o) o = strength;
      }
      const dir = Math.sign(ring.speed) || 1;
      spinVel[i] += (0.55 * o * dir + ring.speed * scrollBoost) * dt;
      spinPos[i] += (spinVel[i] - spinPos[i]) * kSpin;
      offsets[i] = spinPos[i] + freezeAccum[i];
    }

    render();
    raf = visible && pageVisible && motionOk ? requestAnimationFrame(tickClean) : 0;
  }

  function ensureLoop() {
    if (visible && pageVisible && motionOk) {
      if (raf === 0) {
        last = performance.now();
        raf = requestAnimationFrame(tickClean);
      }
    } else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      render();
    }
  }

  // pointer
  function localXY(ev) {
    const r = container.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function moveLabel(x, y) {
    if (touch) return;
    labelEl.style.left = `${x}px`;
    labelEl.style.top = `${y}px`;
  }

  const onMove = (ev: PointerEvent) => {
    const { x, y } = localXY(ev);
    moveLabel(x, y);
    const [dx, dy] = designFromLocal(x, y);
    mouseTarget[0] = dx;
    mouseTarget[1] = dy;
  };
  const onEnter = (ev: PointerEvent) => {
    const { x, y } = localXY(ev);
    moveLabel(x, y);
    const [dx, dy] = designFromLocal(x, y);
    mouseTarget[0] = dx;
    mouseTarget[1] = dy;
    mouseSmooth[0] = dx;
    mouseSmooth[1] = dy;
    mouseInfTarget = 1;
    if (!touch) labelEl.classList.add("show");
  };
  const onLeave = () => {
    mouseInfTarget = 0;
    holding = false;
    charged = false;
    setMode("idle");
    if (!touch) labelEl.classList.remove("show");
  };
  const onDown = () => {
    holding = true;
    charged = false;
    setMode("holding");
  };
  const onUp = () => {
    if (!holding) return;
    holding = false;
    if (charged) {
      releaseT = time;
      onRelease?.();
      ripples.push({ start: time, strength: 0.7 + 0.6 * gather });
      while (ripples.length > RIPPLE_SLOTS) ripples.shift();
    }
    charged = false;
    setMode("idle");
  };

  container.addEventListener("pointermove", onMove, { passive: true });
  container.addEventListener("pointerenter", onEnter);
  container.addEventListener("pointerleave", onLeave);
  container.addEventListener("pointercancel", onLeave);
  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointerup", onUp);
  window.addEventListener(
    "wheel",
    (e) => {
      scrollVel += e.deltaY * 0.02;
    },
    { passive: true }
  );

  const ro = new ResizeObserver(() => {
    resize();
    if (raf === 0) render();
  });
  ro.observe(container);

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e) return;
      visible = e.isIntersecting;
      if (visible) resize();
      ensureLoop();
    },
    { threshold: 0 }
  );
  io.observe(container);

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    ensureLoop();
  });
  reduceMQ.addEventListener("change", () => {
    motionOk = !reduceMQ.matches;
    ensureLoop();
  });

  // fonts ready → rebuild atlas
  document.fonts.ready.then(() => {
    atlasImage = buildAtlas();
    gl.deleteTexture(atlasTex);
    atlasTex = createAtlasTexture(gl, atlasImage);
    render();
  });

  // entrance ripple
  if (motionOk) {
    ripples.push({ start: 0, strength: 1 });
  } else {
    time = 2.3;
  }

  resize();
  render();
  ensureLoop();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    container.removeEventListener("pointermove", onMove);
    container.removeEventListener("pointerenter", onEnter);
    container.removeEventListener("pointerleave", onLeave);
    container.removeEventListener("pointercancel", onLeave);
    container.removeEventListener("pointerdown", onDown);
    container.removeEventListener("pointerup", onUp);
    try {
      container.removeChild(canvas);
    } catch {}
  };
}



export function SpiralDisc({ onRelease, className = "" }: SpiralDiscProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const labelEl = labelRef.current;
    if (!container || !labelEl) return;

    const cleanup = mountSpiral(container, labelEl, onRelease);
    return () => {
      cleanup?.();
    };
  }, [onRelease]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }} className={className}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", background: "#07080a" }} />
      <div
        ref={labelRef}
        id="cursor-label"
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10,
          transform: "translate(20px, 20px)",
          whiteSpace: "nowrap",
          background: "#ff5500",
          color: "#fff",
          padding: "3px 8px",
          fontFamily: "ui-monospace, monospace",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderRadius: "4px",
          opacity: 0,
          boxShadow: "0 0 15px rgba(255, 85, 0, 0.4)",
          transition: "opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        Click &amp; hold
      </div>
    </div>
  );
}