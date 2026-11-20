"use client";

import { useEffect, useRef } from "react";
import styles from "./film-footer.module.css";

// Noise field adapted from kedhareswer's Noise Dissolve Reveal (21st demo 28906).
// Slow drift and staggered waves keep the grain moving across the footer seam.
const vertex = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragment = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;
uniform vec3 u_color;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21) + 17.0);
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p) {
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * noise(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return sum / 0.9375;
}
void main() {
  vec2 pixel = vec2(v_uv.x, 1.0 - v_uv.y) * u_resolution;
  float y = 1.0 - v_uv.y;
  vec2 drift = vec2(-u_time * 4.5 + u_progress * 15.3, u_time * 1.7);
  float cloud = fbm((pixel + drift) / 34.0);
  float wave = sin(pixel.x * 0.011 - u_time * 1.12) * 0.041
    + sin(pixel.x * 0.023 - u_time * 0.72) * 0.016;
  float density = 1.0 - smoothstep(0.08, 0.94, y + (cloud - 0.5) * 0.36 + wave);
  // Keep the fine grain anchored and advect the soft clusters.
  float grain = mix(hash(floor(pixel / 1.4)), noise((pixel + drift) / 3.5), 0.28);
  float alpha = smoothstep(grain - 0.045, grain + 0.045, density);
  alpha = mix(1.0, alpha, smoothstep(0.0, 0.14, y));
  alpha *= 1.0 - smoothstep(0.90, 1.0, y);
  fragColor = vec4(u_color, alpha);
}`;

export function FooterDissolve() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const shaders: WebGLShader[] = [];
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    let frame = 0;
    let visible = false;
    let lost = false;
    let measure = true;
    let elapsed = 0;
    let lastTime: number | undefined;
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = undefined;
    };
    const dispose = () => {
      pause();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
      delete canvas.dataset.ready;
    };
    if (!program || !buffer) { dispose(); return; }
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type);
      if (!shader) { dispose(); return; }
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { dispose(); return; }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { dispose(); return; }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const progress = gl.getUniformLocation(program, "u_progress");
    const time = gl.getUniformLocation(program, "u_time");
    // Resolve the site's CSS colour through Canvas rather than approximating it.
    const colourCanvas = document.createElement("canvas");
    colourCanvas.width = colourCanvas.height = 1;
    const colourContext = colourCanvas.getContext("2d")!;
    colourContext.fillStyle = getComputedStyle(canvas).getPropertyValue("--color-black").trim();
    colourContext.fillRect(0, 0, 1, 1);
    const rgb = colourContext.getImageData(0, 0, 1, 1).data;
    gl.uniform3f(gl.getUniformLocation(program, "u_color"), rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);

    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || lost) return;
      if (measure) {
        measure = false;
        const bounds = canvas.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const ratio = Math.min(devicePixelRatio, 1.5, Math.sqrt(720_000 / (bounds.width * bounds.height)));
        const width = Math.max(1, Math.floor(bounds.width * ratio));
        const height = Math.max(1, Math.floor(bounds.height * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        gl.uniform2f(resolution, bounds.width, bounds.height);
        gl.uniform1f(progress, reduced.matches ? 0.5 : Math.max(0, Math.min(1, 1 - bounds.top / innerHeight)));
      }
      if (!reduced.matches) {
        if (lastTime !== undefined) elapsed += Math.min(now - lastTime, 50) / 1000;
        lastTime = now;
      }
      gl.uniform1f(time, reduced.matches ? 0 : elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!canvas.dataset.ready) canvas.dataset.ready = "true";
      if (!reduced.matches) schedule();
    };
    const schedule = () => { if (visible && !document.hidden && !lost && !frame) frame = requestAnimationFrame(draw); };
    const updateBounds = () => { measure = true; schedule(); };
    const onScroll = () => { if (!reduced.matches) updateBounds(); };
    const onMotionChange = () => { pause(); updateBounds(); };
    const onVisibilityChange = () => { if (document.hidden) pause(); else updateBounds(); };
    const onLost = () => { lost = true; pause(); delete canvas.dataset.ready; };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) updateBounds();
      else pause();
    });
    const resize = new ResizeObserver(updateBounds);
    observer.observe(canvas);
    resize.observe(canvas);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateBounds);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reduced.addEventListener("change", onMotionChange);
    canvas.addEventListener("webglcontextlost", onLost);
    return () => {
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateBounds);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reduced.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("webglcontextlost", onLost);
      dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.dissolve} aria-hidden="true" />;
}
