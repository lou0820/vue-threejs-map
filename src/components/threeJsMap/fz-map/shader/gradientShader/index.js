import * as THREE from 'three'
import outputFragment from './output_fragment.glsl.js'
import { Component } from '@/libs/mini3d'
/**
 * 渐变上升shader
 */
export class GradientShader extends Component {
  /**
   *
   * @param {*} base this
   */
  constructor(base, config = {}) {
    super(base)

    this.config = Object.assign(
      {
        height: 2.0, // 高度
        color1: new THREE.Color('#ffffff'), // 颜色
        color2: new THREE.Color('#ff0000'), // 颜色
        material: new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          side: THREE.DoubleSide,
          opacity: 1,
          depthTest: false,
        }),
      },
      config,
    )
    this.create()
  }
  create() {
    this.config.material.onBeforeCompile = shader => {
      this.shader = shader

      shader.uniforms = {
        ...shader.uniforms,
        uColor1: { value: this.config.color1 },
        uColor2: { value: this.config.color2 },
        uHeight: { value: this.config.height },
      }
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
        attribute float alpha;
        varying vec3 vPosition;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vPosition = position;
      `,
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        varying vec3 vPosition;
        varying float vAlpha;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uHeight;

        void main() {
      `,
      )
      shader.fragmentShader = shader.fragmentShader.replace('#include <output_fragment>', outputFragment)
    }
  }
  getMaterial() {
    return this.config.material
  }
}
