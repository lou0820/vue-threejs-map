import * as THREE from 'three'
import outputFragment from './output_fragment.glsl.js'
import { Component } from '@/libs/mini3d'
/**
 * 渐变上升shader
 */
export class UpShader extends Component {
  /**
   *
   * @param {*} base this
   */
  constructor(base, config = {}) {
    super(base)

    this.config = Object.assign(
      {
        start: 0.0, // 开始点
        end: 100.0, // 结束点
        height: 1.0, // 光环高度
        maxTime: 10.0, // 最大时间
        speed: 0.01,
        color: new THREE.Color('#ffffff'), // 颜色
        material: new THREE.MeshBasicMaterial({
          color: 0x07152b,
          transparent: true,
          opacity: 1,
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
        uTime: { value: 0.0 },
        uHeight: { value: this.config.height.toFixed(2) },
        uColor: { value: this.config.color },
        uStart: { value: this.config.start.toFixed(2) },
        uSpeed: { value: this.config.speed.toFixed(2) },
      }
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
      `,
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        varying vec3 vPosition;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uSpeed;
        uniform float uStart;
        uniform float uHeight;
        void main() {
      `,
      )
      shader.fragmentShader = shader.fragmentShader.replace('#include <output_fragment>', outputFragment)
    }
    var clock = new THREE.Clock()

    this.base.animator.add(() => {
      if (this.shader) {
        let deltaTime = clock.getDelta()
        this.shader.uniforms.uTime.value += deltaTime
        if (this.shader.uniforms.uTime.value >= this.config.maxTime) {
          this.shader.uniforms.uTime.value = 0.0
        }
      }
    })
  }
  getMaterial() {
    return this.config.material
  }
}
