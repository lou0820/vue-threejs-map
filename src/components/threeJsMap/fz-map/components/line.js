import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
// import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { geoProjection, transfromGeoJSON } from '../utils'
import { Component } from '@/libs/mini3d'
import config from '../../config'
/**
 * 网格地面
 */
export class Line extends Component {
  /**
   *
   * @param {*} base this
   * @param {*} config
   */
  constructor(base, config = {}) {
    super(base)
    this.config = Object.assign(
      {
        data: '', // 数据
        material: new THREE.LineBasicMaterial({ color: 0xffffff }), // LineBasicMaterial | LineMaterial
        type: 'LineLoop', // 线类型：LineLoop | Line2
        renderOrder: 1,
      },
      config,
    )

    let mapData = transfromGeoJSON(this.config.data)
    let lineGroup = this.create(mapData)
    this.lineGroup = lineGroup
  }
  create(data) {
    const { type } = this.config
    let features = data.features
    let lineGroup = new THREE.Group()
    for (let i = 0; i < features.length; i++) {
      const element = features[i]
      if (element.properties.name === config.provinceName) {
        continue
      }
      element.geometry.coordinates.forEach(coords => {
        const points = []
        let line = null

        if (type === 'Line2') {
          coords[0].forEach(item => {
            const [x, y] = geoProjection(item)
            points.push(x, -y, 0)
          })
          line = this.createLine2(points)
        } else {
          coords[0].forEach(item => {
            const [x, y] = geoProjection(item)
            points.push(new THREE.Vector3(x, -y, 0))
            line = this.createLine(points)
          })
        }
        // 将线条插入到组中
        lineGroup.add(line)
      })
    }
    return lineGroup
  }
  createLine2(points) {
    const { material, renderOrder } = this.config
    const geometry = new LineGeometry()
    geometry.setPositions(points)
    let line = new Line2(geometry, material)
    line.name = 'mapLine2'
    line.renderOrder = renderOrder
    line.computeLineDistances()
    return line
  }
  createLine(points) {
    const { material, renderOrder, type } = this.config
    const geometry = new THREE.BufferGeometry()
    geometry.setFromPoints(points)
    let line = new THREE[type](geometry, material)
    line.renderOrder = renderOrder
    line.name = 'mapLine'
    return line
  }
  join() {
    this.base.scene.add(this.lineGroup)
  }
}
