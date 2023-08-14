import threeStats from 'three/examples/jsm/libs/stats.module'
import { Component } from '../components'
class State extends Component {
  constructor(base) {
    super(base)
    this.base.stats = new threeStats()
    this.base.container.appendChild(this.base.stats.dom)
    this.join()
  }
  join() {
    this.base.animator.add(() => this.update())
  }
  update() {
    this.base.stats.update()
  }
}
export { State }
