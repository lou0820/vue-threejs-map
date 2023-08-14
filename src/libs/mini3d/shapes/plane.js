import { Vector3, PlaneGeometry, MeshBasicMaterial, Mesh } from 'three'
import { Component } from '../components/component.js'

export class Plane extends Component {
  constructor(base, options) {
    super(base)
    this.options = Object.assign(
      {},
      {
        width: 10,
        scale: 1,
        position: new Vector3(0, 0, 0),
        needRotate: false,
        rotateSpeed: 0.001,
        material: new MeshBasicMaterial({
          transparent: true,
          opacity: 1,
          depthTest: true,
        }),
      },
      options,
    )
    let plane = new PlaneGeometry(this.options.width, this.options.width)
    let mesh = new Mesh(plane, this.options.material)
    mesh.position.copy(this.options.position)
    mesh.scale.set(this.options.scale, this.options.scale, this.options.scale)
    this.mesh = mesh
  }
  join() {
    this.base.scene.add(this.mesh)
    this.base.animator.add(() => this.update())
  }
  update() {
    if (this.options.needRotate) {
      this.mesh.rotation.z += this.options.rotateSpeed
    }
  }
}
