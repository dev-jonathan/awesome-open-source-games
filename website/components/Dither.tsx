'use client';

import { useRef, useEffect } from 'react';

// ── Combined single-pass shader: wave generation + bayer dithering ──────────
const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uWaveSpeed;
uniform float uWaveFrequency;
uniform float uWaveAmplitude;
uniform vec3 uWaveColor;
uniform vec2 uMousePos;
uniform int uEnableMouseInteraction;
uniform float uMouseRadius;
uniform float uColorNum;
uniform float uPixelSize;
uniform sampler2D uIconTexture;
uniform vec2 uImageResolution;
uniform int uHasIcons;

out vec4 fragColor;

// ── Perlin noise helpers ────────────────────────────────────────────────────
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

// ── FBM ─────────────────────────────────────────────────────────────────────
const int OCTAVES = 4;
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = uWaveFrequency;
  for (int i = 0; i < OCTAVES; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= uWaveAmplitude;
  }
  return value;
}

float pattern(vec2 p) {
  vec2 p2 = p - uTime * uWaveSpeed;
  return fbm(p + fbm(p2));
}

// ── Bayer 8×8 dithering ─────────────────────────────────────────────────────
const float bayerMatrix8x8[64] = float[64](
   0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
  32.0/64.0, 16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0, 19.0/64.0, 47.0/64.0, 31.0/64.0,
   8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0, 59.0/64.0,  7.0/64.0, 55.0/64.0,
  40.0/64.0, 24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0, 27.0/64.0, 39.0/64.0, 23.0/64.0,
   2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0, 49.0/64.0, 13.0/64.0, 61.0/64.0,
  34.0/64.0, 18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0, 17.0/64.0, 45.0/64.0, 29.0/64.0,
  10.0/64.0, 58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0, 57.0/64.0,  5.0/64.0, 53.0/64.0,
  42.0/64.0, 26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0, 25.0/64.0, 37.0/64.0, 21.0/64.0
);

vec3 dither(vec2 fragCoord, vec3 color) {
  vec2 scaledCoord = floor(fragCoord / uPixelSize);
  int x = int(mod(scaledCoord.x, 8.0));
  int y = int(mod(scaledCoord.y, 8.0));
  float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
  float stepSize = 1.0 / (uColorNum - 1.0);
  color += threshold * stepSize;
  float bias = 0.2;
  color = clamp(color - bias, 0.0, 1.0);
  return floor(color * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// ── Main ────────────────────────────────────────────────────────────────────
void main() {
  // Pixelate UV
  vec2 pixelatedCoord = floor(gl_FragCoord.xy / uPixelSize) * uPixelSize;

  vec2 uv = pixelatedCoord / uResolution;
  uv -= 0.5;
  uv.x *= uResolution.x / uResolution.y;

  float f = pattern(uv);
  f = smoothstep(0.2, 0.9, f);  

  if (uEnableMouseInteraction == 1) {
    vec2 mouseNDC = (uMousePos / uResolution - 0.5) * vec2(1.0, -1.0);
    mouseNDC.x *= uResolution.x / uResolution.y;
    float dist = length(uv - mouseNDC);
    float effect = 1.0 - smoothstep(0.0, uMouseRadius, dist);
    f -= 0.5 * effect;
  }

  vec3 col = mix(vec3(0.0), uWaveColor, f);
  col = dither(gl_FragCoord.xy, col);

  if (uHasIcons == 1) {
    vec2 rs = uResolution;
    vec2 is = uImageResolution;
    float scale = max(rs.x / max(is.x, 1.0), rs.y / max(is.y, 1.0));
    vec2 coverSize = is * scale;
    vec2 offset = (coverSize - rs) / 2.0;
    vec2 texCoord = (gl_FragCoord.xy + offset) / coverSize;
    texCoord.y = 1.0 - texCoord.y;
    vec4 iconColor = texture(uIconTexture, texCoord);
    
    if (iconColor.a > 0.0) {
      // Very light noise/grain for texture
      float noise = random(pixelatedCoord + uTime * 0.01);
      float visibility = 1.0 - smoothstep(0.05, 0.3, f);
      
      // Subtle grain
      float grain = 0.95 + noise * 0.1;
      
      // Multiply color by alpha to restore blur smoothness (pre-multiplied alpha),
      // preventing the shadow from appearing as a solid block.
      vec3 premultipliedColor = iconColor.rgb * iconColor.a;
      
      // Add color to the canvas. We use 0.8 intensity to keep it subtle and uncluttered,
      // while maintaining the luminous neon effect (white center, purple/blue glow on edges).
      col += premultipliedColor * grain * visibility * 0.8;
      col = clamp(col, 0.0, 1.0);
    }
  }

  fragColor = vec4(col, 1.0);
}
`;

// ── WebGL helpers ───────────────────────────────────────────────────────────
function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vs: string,
  fs: string,
): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  return program;
}

// ── Props ───────────────────────────────────────────────────────────────────
interface DitherProps {
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  waveColor?: [number, number, number];
  colorNum?: number;
  pixelSize?: number;
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
  backgroundImageUrl?: string;
}

export default function Dither({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.5, 0.5, 0.5],
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 1,
  backgroundImageUrl,
}: DitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Icon system state ───────────────────────────────────────────
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const iconImagesRef = useRef<HTMLImageElement[]>([]);
  const iconInstancesRef = useRef<any[]>([]);
  const loadedIconsRef = useRef(false);

  useEffect(() => {
    if (!backgroundImageUrl) return;

    const img = new Image();
    img.onload = () => {
      iconImagesRef.current = [img];
      loadedIconsRef.current = true;
    };
    img.onerror = () => {
      console.error('Failed to load dither background image');
    };
    img.src = backgroundImageUrl;
  }, [backgroundImageUrl]);

  // Store mutable props in refs to avoid re-running the heavy effect
  const propsRef = useRef({
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    waveColor,
    colorNum,
    pixelSize,
    disableAnimation,
    enableMouseInteraction,
    mouseRadius,
  });
  propsRef.current = {
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    waveColor,
    colorNum,
    pixelSize,
    disableAnimation,
    enableMouseInteraction,
    mouseRadius,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // ── Build shader program ───────────────────────────────────
    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(program);

    // ── Full-screen triangle (more efficient than quad) ────────
    const posAttr = gl.getAttribLocation(program, 'aPosition');
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // Single triangle that covers the entire clip space
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // ── Uniform locations ──────────────────────────────────────
    const loc = {
      resolution: gl.getUniformLocation(program, 'uResolution'),
      time: gl.getUniformLocation(program, 'uTime'),
      waveSpeed: gl.getUniformLocation(program, 'uWaveSpeed'),
      waveFrequency: gl.getUniformLocation(program, 'uWaveFrequency'),
      waveAmplitude: gl.getUniformLocation(program, 'uWaveAmplitude'),
      waveColor: gl.getUniformLocation(program, 'uWaveColor'),
      mousePos: gl.getUniformLocation(program, 'uMousePos'),
      enableMouse: gl.getUniformLocation(program, 'uEnableMouseInteraction'),
      mouseRadius: gl.getUniformLocation(program, 'uMouseRadius'),
      colorNum: gl.getUniformLocation(program, 'uColorNum'),
      pixelSize: gl.getUniformLocation(program, 'uPixelSize'),
      iconTexture: gl.getUniformLocation(program, 'uIconTexture'),
      imageResolution: gl.getUniformLocation(program, 'uImageResolution'),
      hasIcons: gl.getUniformLocation(program, 'uHasIcons'),
    };

    // ── Texture initialization ─────────────────────────────────
    const iconTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, iconTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // ── Mouse tracking ─────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });

    // ── Resize handling ────────────────────────────────────────
    let width = 0;
    let height = 0;
    let needsTextureUpdate = false;
    let iconsWereLoaded = false;

    const resize = () => {
      const dpr = 1; // Fixed DPR = 1 for performance (matches original)
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (width !== w || height !== h) {
        width = w;
        height = h;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        needsTextureUpdate = true;
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    // ── Animation loop ─────────────────────────────────────────
    let animId = 0;
    let startTime = performance.now();

    const render = () => {
      if (loadedIconsRef.current && !iconsWereLoaded) {
        iconsWereLoaded = true;
        needsTextureUpdate = true;
      }

      if (needsTextureUpdate && iconsWereLoaded) {
        const img = iconImagesRef.current[0];
        if (img) {
          gl.bindTexture(gl.TEXTURE_2D, iconTexture);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img,
          );
        }
        needsTextureUpdate = false;
      }

      const p = propsRef.current;
      const time = p.disableAnimation
        ? 0
        : (performance.now() - startTime) / 1000;

      gl.uniform2f(loc.resolution, width, height);
      gl.uniform1f(loc.time, time);
      gl.uniform1f(loc.waveSpeed, p.waveSpeed);
      gl.uniform1f(loc.waveFrequency, p.waveFrequency);
      gl.uniform1f(loc.waveAmplitude, p.waveAmplitude);
      gl.uniform3f(
        loc.waveColor,
        p.waveColor[0],
        p.waveColor[1],
        p.waveColor[2],
      );
      gl.uniform2f(loc.mousePos, mouse.x, mouse.y);
      gl.uniform1i(loc.enableMouse, p.enableMouseInteraction ? 1 : 0);
      gl.uniform1f(loc.mouseRadius, p.mouseRadius);
      gl.uniform1f(loc.colorNum, p.colorNum);
      gl.uniform1f(loc.pixelSize, p.pixelSize);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, iconTexture);
      gl.uniform1i(loc.iconTexture, 0);
      
      const img = iconImagesRef.current[0];
      if (img && img.width > 0) {
        gl.uniform2f(loc.imageResolution, img.width, img.height);
      } else {
        gl.uniform2f(loc.imageResolution, 1.0, 1.0);
      }
      
      gl.uniform1i(loc.hasIcons, iconsWereLoaded ? 1 : 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    // ── Cleanup ────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteTexture(iconTexture);
    };
  }, [backgroundImageUrl]); // Dependencies match hooks used from variables

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
