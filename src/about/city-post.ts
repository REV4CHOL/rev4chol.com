/** THE LENS — the city is photographed, not rendered (owner decree: a 24mm
 *  wide-angle with real glass). One pass on the half-res pixel buffer:
 *
 *  LensPass — barrel distortion (the centre magnified, the corners pinned so
 *  no black edges), lateral chromatic aberration (red and blue bend by
 *  different amounts, growing with radius), field softness toward the
 *  corners and a cos⁴-style optical vignette, and the time of day's grade.
 *
 *  (A motion-blur pass once streaked the frame by reprojection while the
 *  camera moved; the owner read it as a glow that followed the camera, and
 *  it is gone.) */
import { HalfFloatType, ShaderMaterial, Vector3, WebGLRenderTarget, WebGLRenderer } from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';

/** A composer target in half floats (the bloom's headroom). */
export function lensTarget(w: number, h: number): WebGLRenderTarget {
  return new WebGLRenderTarget(w, h, { type: HalfFloatType });
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const LENS_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float aspect;
  uniform float k;
  uniform float ca;
  uniform float vig;
  uniform float soft;
  uniform vec3 gLow;
  uniform vec3 gHigh;
  uniform float gContrast;
  varying vec2 vUv;
  vec3 fetch(vec2 uv, vec2 d, float r2) {
    vec2 off = d * (ca * r2);
    return vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);
  }
  void main() {
    vec2 c = vUv - 0.5;
    vec2 a = vec2(c.x * aspect, c.y);
    float r2 = dot(a, a) / (0.25 * (aspect * aspect + 1.0)); // 0 at the centre, 1 at the corners
    vec2 d = c * (1.0 + k * r2) / (1.0 + k);
    vec2 uv = 0.5 + d;
    vec3 col = fetch(uv, d, r2);
    float s = soft * r2;
    col = col * 0.4 + 0.15 * (
      fetch(uv + vec2(s, 0.0), d, r2) + fetch(uv - vec2(s, 0.0), d, r2) +
      fetch(uv + vec2(0.0, s), d, r2) + fetch(uv - vec2(0.0, s), d, r2));
    col *= 1.0 - vig * pow(r2, 1.15);
    // the grade (the time of day sets it): contrast about the mids, a tint for the shadows, a tint for the highlights
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = (col - 0.4) * gContrast + 0.4;
    col += gLow * (1.0 - clamp(luma * 3.0, 0.0, 1.0)) + gHigh * clamp(luma - 0.4, 0.0, 1.0);
    col = max(col, 0.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class LensPass extends Pass {
  private readonly quad: FullScreenQuad;
  private readonly mat: ShaderMaterial;

  constructor(opts: { k?: number; ca?: number; vig?: number; soft?: number } = {}) {
    super();
    this.mat = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null }, aspect: { value: 1 },
        k: { value: opts.k ?? 0.11 }, ca: { value: opts.ca ?? 0.005 },
        vig: { value: opts.vig ?? 0.3 }, soft: { value: opts.soft ?? 0.0022 },
        gLow: { value: new Vector3(-0.012, 0, 0.024) }, gHigh: { value: new Vector3(0.02, 0.008, -0.012) }, gContrast: { value: 1.06 },
      },
      vertexShader: VERT, fragmentShader: LENS_FRAG, depthTest: false, depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.mat);
  }

  setAspect(aspect: number): void { this.mat.uniforms.aspect.value = aspect; }
  /** The grade: a tint for the shadows, a tint for the highlights, the contrast about the mids. */
  setGrade(low: [number, number, number], high: [number, number, number], contrast: number): void {
    (this.mat.uniforms.gLow.value as Vector3).set(low[0], low[1], low[2]);
    (this.mat.uniforms.gHigh.value as Vector3).set(high[0], high[1], high[2]);
    this.mat.uniforms.gContrast.value = contrast;
  }

  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget): void {
    this.mat.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }

  dispose(): void { this.mat.dispose(); this.quad.dispose(); }
}

/** A 24mm across the frame's long edge (full-frame 36mm: 2·atan(18/24)),
 *  expressed as three's vertical fov for the given aspect. */
export function fov24(aspect: number): number {
  const half = Math.atan(18 / 24);
  return aspect >= 1 ? (2 * Math.atan(Math.tan(half) / aspect) * 180) / Math.PI : (2 * half * 180) / Math.PI;
}
