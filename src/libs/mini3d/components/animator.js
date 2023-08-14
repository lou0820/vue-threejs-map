class Animator {
  constructor(base) {
    this.base = base
    this.tasks = []
  }
  add(task) {
    this.tasks.push(task)
  }
  update() {
    this.base.renderer.setAnimationLoop(time => {
      for (var i = 0; i < this.tasks.length; i++) {
        this.tasks[i] && this.tasks[i](time)
      }
      this.base.renderer.render(this.base.scene, this.base.camera)
    })
  }
  stop() {
    this.base.renderer.setAnimationLoop(null) // 传入null停止动画
  }
}

export { Animator }
