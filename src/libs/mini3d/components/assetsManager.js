import { Component } from './component'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { FileLoader, TextureLoader } from 'three'
import { v4 as uuidv4 } from 'uuid'
class AssetsManager extends Component {
  constructor(base, list, config) {
    super(base)
    this.uuid = uuidv4() // 唯一uuid
    // 资源列表
    this.assetsList = list // {name,type,path}
    const {
      onProgress = () => {},
      onComplete = () => {},
      loadType = 'paralle', // serial 串行   paralle 并行
      useDracoLoader = false,
      dracoDecoderPath = '',
    } = config
    this.config = { loadType, useDracoLoader, dracoDecoderPath }
    // 已加载的项
    this.loadedItems = {}
    // 已加载数
    this.loaded = 0
    // 总数
    this.total = list.length
    // 当前加载的资源
    this.currentLoad = 0
    // 当前资源的进度
    this.currentLoaded = 0
    // 加载器
    this.loaders = {}
    this.setLoaders()
    if (useDracoLoader) {
      this.setDracoLoader()
    }
    this.startLoading()
    // 监听资源进度
    onProgress && this.base.emitter.$on('assetsProgress' + this.uuid, onProgress)
    // 监听资源完成
    onComplete && this.base.emitter.$on('assetsReady' + this.uuid, onComplete)
  }
  startLoading() {
    if (this.config.loadType === 'paralle') {
      this.startParallelLoading()
    } else {
      this.startSerialLoading()
    }
  }
  setLoaders() {
    this.loaders.file = new FileLoader()
    this.loaders.font = new FontLoader()
    this.loaders.texture = new TextureLoader()
    this.loaders.gltf = new GLTFLoader()
    this.loaders.obj = new OBJLoader()
  }
  setDracoLoader() {
    if (!this.config.dracoDecoderPath) {
      console.warn('请设置dracoDecoderPath路径')
      return false
    }
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(this.config.dracoDecoderPath)
    dracoLoader.preload()
    this.loaders.gltf.setDRACOLoader(dracoLoader)
  }
  // 串行加载
  async startSerialLoading() {
    for (const item of this.assetsList) {
      this.currentLoaded = 0
      this.currentLoad += 1
      const data = await this.loaders[item.type].loadAsync(item.path, xhr => this.currentProgress(xhr))
      this.resourceLoaded(item.name, data)
    }
  }
  // 并行加载
  startParallelLoading() {
    this.assetsList.forEach(item => {
      for (const key in this.loaders) {
        if (key === item.type) {
          this.currentLoaded = 0

          this.loaders[key].load(
            item.path,
            data => {
              this.resourceLoaded(item.name, data)
            },
            null,
            // function (xhr) {
            //   console.log(item.name, (xhr.loaded / xhr.total) * 100 + '% loaded')
            // },
            err => {
              console.log(err)
            },
          )
        }
      }
    })
  }
  // 当前文件的进度
  currentProgress(xhr) {
    this.currentLoaded = Math.ceil((xhr.loaded / xhr.total) * 100)
    this.base.emitter.$emit('assetsProgress' + this.uuid, this.currentLoad, this.currentLoaded)
  }
  // 资源加载
  resourceLoaded(name, data) {
    this.currentLoaded = 100
    this.loaded += 1
    this.loadedItems[name] = data
    if (this.config.loadType === 'paralle') {
      this.base.emitter.$emit('assetsProgress' + this.uuid, this.loadProgress(), null)
    } else {
      this.base.emitter.$emit('assetsProgress' + this.uuid, this.currentLoad, this.currentLoaded)
    }
    if (this.isLoaded()) {
      setTimeout(() => {
        this.base.emitter.$emit('assetsReady' + this.uuid)
      }, 0)
    }
  }
  // 获取是否加载完成
  isLoaded() {
    return this.loaded === this.total
  }
  // 获取所有的进度
  loadProgress() {
    return Math.ceil((this.loaded / this.total) * 100)
  }
}
export { AssetsManager }
