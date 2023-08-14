import TWEEN from '@tweenjs/tween.js'
import * as THREE from 'three'
import { InteractionManager } from '../libs/three.interactive'
import emitter from '../libs/emitter'
import { Animator, Resizer } from '../components'
// import {Interaction} from "three.interaction/src/index.js";
class Base {
  constructor(el = '#canvas') {
    // 容器
    this.container = document.querySelector(el)
    this.width = this.container.offsetWidth || window.innerWidth
    this.height = this.container.offsetHeight || window.innerHeight
    // 场景
    this.scene = new THREE.Scene()
    this.camera = this.createCamera()
    this.renderer = this.createRenderer()
    this.animator = new Animator(this)
    this.resizer = new Resizer(this)
    this.emitter = emitter
    this.interactionManager = new InteractionManager(this.renderer, this.camera, this.renderer.domElement)
    this.animator.add(() => this.interactionManager.update())
    this.renderer.render(this.scene, this.camera)

    // this.interaction = new Interaction(this.renderer, this.scene, this.camera);


    this.addEventListener()
  }
  createCamera() {
    let { width, height } = this
    let rate = width / height
    // 设置45°的透视相机,更符合人眼观察
    let camera = new THREE.PerspectiveCamera(45, rate, 0.1, 1500)
    // camera.up.set(0, 0, 1)
    camera.position.set(100, 100, 100)
    camera.lookAt(0, 0, 0)
    return camera
  }
  createRenderer() {
    let { width, height } = this
    let renderer = new THREE.WebGLRenderer({
      antialias: true, // 锯齿
    })
    // 设置canvas的分辨率
    renderer.setPixelRatio(window.devicePixelRatio)
    // 设置canvas 的尺寸大小
    renderer.setSize(width, height)
    // 设置背景色
    // renderer.setClearColor(0x000000, 1)
    renderer.setClearColor(0xffffff, 0.0001)
    // 插入到dom中
    this.container.appendChild(renderer.domElement)

    return renderer
  }
  addEventListener() {
    this.resizer.addListenerResize()
  }
  removeEventListener() {
    this.resizer.removeListenerResize()
  }
  start() {
    this.animator.add(() => TWEEN.update())
    this.animator.update()
  }
  stop() {
    TWEEN.removeAll()
    this.animator.stop()
    this.interactionManager.dispose()
  }
}

export { Base }
