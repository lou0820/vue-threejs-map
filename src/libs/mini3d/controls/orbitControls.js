import { Vector3 } from 'three'
import { OrbitControls as threeOrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Component } from '../components'
class OrbitControls extends Component {
  constructor(base) {
    super(base)
    const { camera, renderer } = base
    this.base.orbitControls = new threeOrbitControls(camera, renderer.domElement)
    this.base.orbitControls.enableDamping = true
    this.base.orbitControls.target = new Vector3(0, 0, 0)
  }
  join() {
    this.base.animator.add(() => this.update())
  }
  update() {
    this.base.orbitControls && this.base.orbitControls.update()
  }
}

export { OrbitControls }
