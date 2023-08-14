import { Component } from '../components'

class Resizer extends Component {
  constructor(base) {
    super(base)
    this.tasks = []
  }
  add(task) {
    this.tasks.push(task)
  }
  resize() {
    this.base.width = this.base.container.offsetWidth
    this.base.height = this.base.container.offsetHeight
    const { width, height } = this.base

    // 重新设置相机的位置
    let rate = width / height

    // 必須設置相機的比例，重置的時候才不会变形
    this.base.camera.aspect = rate

    // 渲染器执行render方法的时候会读取相机对象的投影矩阵属性projectionMatrix
    // 但是不会每渲染一帧，就通过相机的属性计算投影矩阵(节约计算资源)
    // 如果相机的一些属性发生了变化，需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
    this.base.camera.updateProjectionMatrix()
    this.base.renderer.setSize(width, height)

    for (var i = 0; i < this.tasks.length; i++) {
      this.tasks[i] && this.tasks[i]()
    }
  }
  addListenerResize() {
    window.addEventListener('resize', () => this.resize())
  }
  removeListenerResize() {
    window.removeEventListener('resize', () => this.resize())
  }
}

export { Resizer }
