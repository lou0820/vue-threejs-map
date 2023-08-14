import * as THREE from 'three'
import { Component, getBoundingBox } from '@/libs/mini3d'
import { geoProjection, transfromGeoJSON } from '../utils'
import mapConfig from '../../config'
export class BaseMap extends Component {
  constructor(base, config = {}, areaColor) {
    super(base)
    this.mapGroup = new THREE.Group()
    this.mapGroup.receiveShadow = true;
    this.coordinates = []
    this.config = Object.assign(
      {
        data: '',
        renderOrder: 1,
        topFaceMaterial: new THREE.MeshLambertMaterial({
          color: 0x18263b,
          transparent: true,
          opacity: 1,
        }),
        sideMaterial: new THREE.MeshBasicMaterial({
          color: 0x07152b,
          transparent: true,
          opacity: 1,
        }),
        depth: 0.1,
      },
      config,
    )
    let mapData = transfromGeoJSON(this.config.data)
    this.areaColor = areaColor;
    this.create(mapData);


  }
  create(mapData) {
    mapData.features.forEach(feature => {
      const group = new THREE.Object3D()
      let { name, center = [], centroid = [], adcode } = feature.properties
      this.coordinates.push({ name, center, centroid, adcode })
      if (name === mapConfig.provinceName) {
        return false
      }
      feature.geometry.coordinates.forEach(multiPolygon => {
        multiPolygon.forEach(polygon => {
          // 绘制shape
          const shape = new THREE.Shape()
          for (let i = 0; i < polygon.length; i++) {
            if (!polygon[i][0] || !polygon[i][1]) {
              return false
            }
            const [x, y] = geoProjection(polygon[i])
            if (i === 0) {
              shape.moveTo(x, -y)
            }
            shape.lineTo(x, -y)
          }
          // 拉伸设置
          const extrudeSettings = {
            depth: this.config.depth,
            bevelEnabled: true,
            bevelSegments: 1,
            bevelThickness: 0.1,
          }
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
          geometry.translate(0, 0, this.config.depth)

          let topFaceMaterial;
          if(this.areaColor){
            let textureLoader = new THREE.TextureLoader();
            let texture = textureLoader.load('/data/waternormals.jpg');
            // let texture = textureLoader.load('/data/map2.png');
            texture.repeat.set(0.1, 0.1)
            texture.offset.set(0.55, 0.65)
            texture.wrapS = THREE.MirroredRepeatWrapping
            texture.wrapT = THREE.MirroredRepeatWrapping


            let color = this.areaColor[adcode] ? new THREE.Color(this.areaColor[adcode]) : 0x0a3b66 ;
            topFaceMaterial = new THREE.MeshBasicMaterial({
              color: color,
              transparent: false,
              opacity: 1,
              map: texture,
            })
          }else {
            topFaceMaterial = this.config.topFaceMaterial.clone();
          }

          const mesh = new THREE.Mesh(geometry, [topFaceMaterial, this.config.sideMaterial])
          mesh.receiveShadow = false;
          mesh.renderOrder = this.config.renderOrder
          group.add(mesh)
          // this.addClick(mesh)
        })
      })
      this.mapGroup.add(group)
    })

    // console.log(getBoundingBox(this.mapGroup))
    // console.log(JSON.stringify(points))
  }
  getCoordinates() {
    return this.coordinates
  }
  join() {
    this.base.scene.add(this.mapGroup);
  }
  addClick(mesh){
    // mesh.on('click', function(ev) {
    //   mesh.material[0].color.set(0xff0000);
    // });
  }
  remove(){
    this.base.scene.remove(this.mapGroup)
  }
  click(){

  }
}
