import * as THREE from 'three'
import { Component } from '@/libs/mini3d'

export class Lights extends Component {
  constructor(base, config = {}) {
    super(base)
    const lights = []
    const {color, intensity, distance, position} = config;
    lights[0] = new THREE.PointLight(color || 0xffffff, intensity || 10, distance || 100)
    lights[0].name = 'pointLight'
    // lights[0].castShadow = true;

    if(position){
      lights[0].position.set(...position)
    }else {
      lights[0].position.set(-30, 30, 30)
    }
    this.lights = lights
  }
  join() {
    const sphereSize = 1
    this.lights.forEach(light => {
      const pointLightHelper = new THREE.PointLightHelper(light, sphereSize)
      this.base.scene.add(pointLightHelper)
    })
    this.base.scene.add(...this.lights)
  }
}
