import * as THREE from 'three'
import { Component } from '@/libs/mini3d'

export class SequenceFrame extends Component {
  constructor(base, config) {
    super(base)
    this.config = Object.assign(
      {
        texture: '',
        width: 200, // 显示的宽度
        height: 200, // 显示的高度
        frame: 60, //总共的帧数
        column: 10, // 序列图的列
        row: 6, // 序列图的行
        speed: 0.5, // 速度
      },
      config,
    )

    this.create()
  }
  create() {
    let { width, height, texture, speed, column, row, frame } = this.config
    let geometry = new THREE.PlaneGeometry(width, height) //矩形平面

    texture.repeat.set(1 / column, 1 / row) // 从图像上截图第一帧
    let material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: false, //是否对深度缓冲区有任何的影响
    })
    let mesh = new THREE.Mesh(geometry, material)

    let r = 0 // 当前行
    let c = 0 // 当前列
    let t = 0 // 时间
    this.base.animator(() => {
      t += speed
      if (t > frame) t = 0
      c = column - Math.floor(t % column) - 1
      r = Math.floor((t / column) % row)
      texture.offset.x = c / column // 动态更新纹理偏移 播放关键帧动画
      texture.offset.y = r / row // 动态更新纹理偏移 播放关键帧动画
    })

    return mesh
  }
}
