import * as THREE from 'three'
import { Component } from '@/libs/mini3d'
/**
 * 网格地面
 */
export class Wall extends Component {
  /**
   *
   * @param {*} base this
   * @param {*} config
   */
  constructor(base, config = {}) {
    super(base)
    this.config = Object.assign(
      {
        coordinates: [], // 坐标
        height: 0.6, //高度
        renderOrder: 1,
        material: new THREE.MeshLambertMaterial({
          color: 0xff0000,
          // map: textureMap,
          side: THREE.DoubleSide,
          transparent: true,
          depthTest: false,
          opacity: 1,
        }),
      },
      config,
    )

    this.create()
  }
  create() {
    var { coordinates, height, renderOrder } = this.config
    // 1、定义一个空几何体
    this.geometry = new THREE.BufferGeometry()
    // 2、围墙每个面有2个三角形组成，生成2个三角形的位置信息
    var positionsArr = []
    // 3、uv坐标位置
    var uvArr = []
    for (var i = 0; i < coordinates.length - 2; i += 2) {
      positionsArr.push(
        coordinates[i],
        coordinates[i + 1],
        0,
        coordinates[i + 2],
        coordinates[i + 3],
        0,
        coordinates[i + 2],
        coordinates[i + 3],
        height,
      )
      positionsArr.push(
        coordinates[i],
        coordinates[i + 1],
        0,
        coordinates[i + 2],
        coordinates[i + 3],
        height,
        coordinates[i],
        coordinates[i + 1],
        height,
      )
      // uv对应位置坐标
      uvArr.push(0, 0, 1, 0, 1, 1)
      uvArr.push(0, 0, 1, 1, 0, 1)
    }
    // 4、设置几何体的位置属性
    this.geometry.attributes.position = new THREE.BufferAttribute(new Float32Array(positionsArr), 3)
    // 5、设置几何体的uv属性
    this.geometry.attributes.uv = new THREE.BufferAttribute(new Float32Array(uvArr), 2)
    // 4、设置后进行法线计算
    this.geometry.computeVertexNormals()
    // 获取顶点数
    const position = this.geometry.attributes.position
    const count = position.count
    const alphaArr = [] // 每个顶点创建一个透明度
    for (let i = 0; i < count; i++) {
      alphaArr.push(1 - position.getZ(i) / height)
    }
    // 设置透明度属性
    this.geometry.attributes.alpha = new THREE.BufferAttribute(new Float32Array(alphaArr), 1)
    this.config.material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
        attribute float alpha; // 透明度分量
        varying float vAlpha;
        void main() {
            vAlpha = alpha;
        `,
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        varying float vAlpha;
        void main() {
        `,
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <output_fragment>',
        `
        #ifdef OPAQUE
        diffuseColor.a = 1.0;
        #endif

        // https://github.com/mrdoob/three.js/pull/22425
        #ifdef USE_TRANSMISSION
        diffuseColor.a *= transmissionAlpha + 0.1;
        #endif

        // gl_FragColor = vec4( outgoingLight, diffuseColor.a );
        gl_FragColor = vec4( outgoingLight, diffuseColor.a*vAlpha  );
      
      `,
      )
    }
    // 5、设置材质
    // this.geometry.rotateX((-1 * Math.PI) / 2)
    this.mesh = new THREE.Mesh(this.geometry, this.config.material)
    this.mesh.renderOrder = renderOrder
  }

  join() {
    this.base.scene.add(this.mesh)
  }
}
