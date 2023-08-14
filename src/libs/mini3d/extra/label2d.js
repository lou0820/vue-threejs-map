import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { Component } from '../components'
export class Label2d extends Component {
  constructor(base) {
    super(base)
    let { width, height, container } = base
    let css2dRender = new CSS2DRenderer() // 实例化css2d渲染器
    css2dRender.setSize(width, height) // 设置渲染器的尺寸
    css2dRender.domElement.style.position = 'absolute' // 设置定位位置
    css2dRender.domElement.style.left = '0px'
    css2dRender.domElement.style.top = '0px'
    css2dRender.domElement.style.pointerEvents = 'none' // 设置不能被选中
    container.appendChild(css2dRender.domElement) // 插入到容器当中
    this.css2dRender = css2dRender
    this.base.animator.add(() => this.update())
    this.base.resizer.add(() => this.resize())
  }
  /**
   * 创建2d标签
   * @param {*} name  标签内容
   * @param {*} className 标签class
   * @returns
   */
  create(name = '', className = '', fn) {
    let tag = document.createElement('div')
    tag.innerHTML = name
    tag.className = className
    tag.style.pointerEvents = 'visible'
    tag.style.visibility = 'hidden'
    tag.style.position = 'absolute'
    if (fn)  tag.onclick = fn;
    // 如果className不存在，用以下样式
    if (!className) {
      tag.style.padding = '10px'
      tag.style.color = '#fff'
      tag.style.fontSize = '12px'
      tag.style.textAlign = 'center'
      tag.style.background = 'rgba(0,0,0,0.6)'
      tag.style.borderRadius = '4px'
    }
    let label = new CSS2DObject(tag)
    /**
     * 标签显示，
     * @param {*} name 显示内容
     * @param {*} point 显示坐标
     */
    label.show = (name, point) => {
      label.element.innerHTML = name
      label.element.style.visibility = 'visible'
      label.position.copy(point)
    }
    label.showLabel = () => {
      label.element.style.visibility = 'visible'
    }
    label.hideWithoutName = (showName) => {
      if(showName !== name){
        label.element.style.visibility = 'hidden'
      }
    }
    /**
     * 隐藏
     */
    label.hide = () => {
      label.element.style.visibility = 'hidden'
    }
    return label
  }
  update() {
    let { scene, camera } = this.base
    this.css2dRender.render(scene, camera)
  }
  resize() {
    let { width, height } = this.base
    this.css2dRender.setSize(width, height)
  }
}
