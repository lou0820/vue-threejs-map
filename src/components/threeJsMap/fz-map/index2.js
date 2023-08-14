import * as THREE from 'three'
import {
	mergeGeometries
} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
	LineMaterial
} from 'three/examples/jsm/lines/LineMaterial.js'
import {
	Base,
	OrbitControls,
	State,
	AssetsManager,
	Plane,
	getBoundingBox
} from '@/libs/mini3d'
import {
	Grid
} from './components/grid'
import {
	BaseMap
} from './components/map'
import {
	Line
} from './components/line'
import {
	Lights
} from './components/lights'
import {
	Wall
} from './components/wall'
import {
	UpShader
} from './shader/upShader/index'
import {
	SpreadShader
} from './shader/spreadShader/index'
import {
	GradientShader
} from './shader/gradientShader/index'
import _ from 'lodash'
import {
	Label2d
} from '@/libs/mini3d/extra/label2d'
import config from '../config'
import {
	geoProjection,
	transfromGeoJSON,
	center,
	exportGLTF
} from './utils'
import {
	random
} from './utils/utils'
let assets = [
	{
		name: 'china',
		type: 'file',
		path: './data/中华人民共和国.json'
	},
	{
		name: 'province',
		type: 'file',
		path: './data/浙江省.json'
	},
	{
		name: 'city',
		type: 'file',
		path: './data/safeArea.json'
	},
	// {
	// 	name: 'cityMarket',
	// 	type: 'file',
	// 	path: './data/market.json'
	// },
	{
		name: 'rotationBorder1',
		type: 'texture',
		path: './data/rotationBorder1.png'
	},
	{
		name: 'rotationBorder2',
		type: 'texture',
		path: './data/rotationBorder2.png'
	},
]

function getRndInteger(min, max) {
	// console.log(Math.floor(Math.random() * (max - min)) + min)
	return Math.floor(Math.random() * (max - min)) + min;
}

export class Map3d extends Base {
	// type: 1 安全监督；2 市场营销
	constructor(el, mapData, type = 1) {
		super(el)
		// 颜色范围
		this.colorRange = [
			'#0a3b66',
			'#0d4271',
			'#10497c',
			'#2369a3',
			'#2770ad'
		]
		this.camera.lookAt(...center, 0)
		this.camera.position.set(-1, -10, 13)
		this.valBoxs = []
		this.barGroup = null;
		this.labelArray = []; // 存放柱子数据
		this.city = null; // 市级地图

		this.renderer.setClearColor(0x191919, 1)
		let ambientLight = new THREE.AmbientLight(0xffffff)
		this.scene.add(ambientLight)
		this.mainMap = {}
		this.mapData = mapData;
		this.colorRangeArray = []; //
		this.areaColor = {};
		this.setColorRange();
		this.getColors();
		assets.forEach(item => {
			if (item.name === 'city') {
				if (type === 2) {
					item.path = './data/market.json'
				} else {
					item.path = './data/safeArea.json'
				}

			}
		})

		this.assetsManager = new AssetsManager(this, assets, {
			onProgress: (current, total) => {
				// console.log(current, total)
			},
			onComplete: () => {
				// console.log('加载完成', this.assetsManager)
				this.start()
			},
		})
	}
	start() {
		super.start()
		this.helperTools()
		this.create()
		// this.animator.add(() => {
		//   console.log(this.camera.position)
		// })
	}
	/**
	 * 开启辅助工具
	 */
	helperTools() {
		// 内存监测
		// let state = new State(this)
		// state.join()
		// 轨道控制器
		let orbit = new OrbitControls(this)
		this.orbitControls.target = new THREE.Vector3(...center, 0)
		orbit.join()
		// 坐标轴辅助
		let axes = new THREE.AxesHelper(200)
		axes.position.set(...center, 0)
		// this.scene.add(axes)
	}
	create() {
		// 添加雾
		// this.scene.fog = new THREE.Fog(0x191919, 0, 70)
		// 获取中心坐标点并将其放到缓存中
		this.getCenterPoint()

		// 创建地图网格
		this.createGrid()
		// 创建中国地图
		this.createChinaMap()
		// 创建省份地图
		this.createProvinceMap()
		// 创建城市地图
		this.createCityMap()
		// 创建点光源
		this.createLight({ color: 0xffffff, intensity: 10, distance: 100, position: [20, -15, 30] })
		this.createLight({ color: 0xffffff, intensity: 10, distance: 100, position: [20, -15, 50] })
		// 创建地图的反光材质
		// this.createRotateBorder()
		// 创建波纹动画
		// this.createPlane()

		// 创建城市标签
		this.createLabel()
		// 创建某个点的透明围墙
		// this.createWall()
		// 创建柱状图
		// this.createBar()
		this.createValBox()
	}
	createGui() { }
	// 获取中心点位置
	getCenterPoint() {
		let data = transfromGeoJSON(this.assetsManager.loadedItems.province)
		let cityData = data.features.filter(item => item.properties.name === config.cityName)
		if (cityData.length) {
			// this.mainMap.center =  [121.757654, 29.86747]
			this.mainMap.center = cityData[0].properties.centroid || [0, 0]
			localStorage.setItem('center', JSON.stringify(this.mainMap.center))
		}
	}
	createGrid() {
		// 添加网格
		let grid = new Grid(this, {
			position: new THREE.Vector3(...center, 0)
		})
		grid.gridGroup.rotateX(Math.PI / 2)
		grid.join()
	}
	createChinaMap() {
		try {
			let china = new BaseMap(this, {
				data: this.assetsManager.loadedItems.china,
				topFaceMaterial: new THREE.MeshBasicMaterial({
					color: new THREE.Color('#020a1a'),
					transparent: true,
					opacity: 1,
				}),
				// topFaceMaterial: shaderMaterial.getMaterial(),
				sideMaterial: new THREE.MeshBasicMaterial({
					color: 0x000000,
					transparent: true,
					opacity: 1,
				}),
				renderOrder: 2,
			})
			china.join()
			let chinaLine = new Line(this, {
				data: this.assetsManager.loadedItems.china,
				material: new THREE.LineBasicMaterial({
					color: new THREE.Color('#343b62'),
					depthTest: false
				}),
				renderOrder: 5,
			})
			// chinaLine.join()
			chinaLine.lineGroup.position.z += 0.31
		} catch (error) {
			console.log(error)
		}
	}
	createProvinceMap() {
		let province = new BaseMap(this, {
			data: this.assetsManager.loadedItems.province,
			topFaceMaterial: new THREE.MeshBasicMaterial({
				color: new THREE.Color('#020a1a'),
				transparent: true,
				opacity: 1,
				// depthTest: false,

			}),
			sideMaterial: new THREE.MeshBasicMaterial({
				color: 0x000000,
				transparent: true,
				opacity: 1,
			}),
			renderOrder: 2,
		})
		province.join()
		let provinceLine = new Line(this, {
			data: this.assetsManager.loadedItems.province,
			material: new THREE.LineBasicMaterial({
				color: new THREE.Color('#20253f'),
			}),
			// material: new LineMaterial({ color: 0x6393bd, linewidth: 0.002 }),
			// type: 'Line2',
			renderOrder: 5,
		})
		// console.log(LineMaterial)

		provinceLine.join()
		provinceLine.lineGroup.position.z += 0.32
	}
	createCityMap() {
		try {
			const sideMaterial = new UpShader(this, {
				// start: -0.2, // 开始点
				// end: 0.6, // 结束点
				height: 1, // 光环高度
				// maxTime: 6, // 最大时间
				// speed: 0.2,
				color: new THREE.Color('#1A64E0'), // 颜色
				material: new THREE.MeshLambertMaterial({
					color: 0x011d4d,
					transparent: true,
					opacity: .8,
				}),
			})
			// 添加市地图
			this.city = new BaseMap(this, {
				data: this.assetsManager.loadedItems.city,
				topFaceMaterial: new THREE.MeshLambertMaterial({
					color: 0x002959,
					emissive: 0x002959,
					transparent: true,
					opacity: 1,
				}),
				sideMaterial: sideMaterial.getMaterial(),
				renderOrder: 2,
				depth: 0.3,
			}, this.areaColor)
			this.city.mapGroup.position.z += 0.1
			this.mainMap.coordinates = this.city.getCoordinates()
			this.mainMap.box = getBoundingBox(this.city.mapGroup)
			// console.log('box', getBoundingBox(city.mapGroup))
			this.city.join()

			let cityLine = new Line(this, {
				data: this.assetsManager.loadedItems.city,
				material: new THREE.LineBasicMaterial({
					color: new THREE.Color('#359DF8'), // 颜色
					// depthWrite: false,
					// depthTest: false,
				}),
				renderOrder: 2,
			})
			cityLine.join()
			cityLine.lineGroup.position.z += 0.81
		} catch (error) {
			console.log(error)
		}
	}
	createLight(config) {
		const lights = new Lights(this, config)
		lights.join()
	}
	createRotateBorder() {
		let plane01 = new Plane(this, {
			width: 10,
			needRotate: true,
			rotateSpeed: 0.003,
			material: new THREE.MeshBasicMaterial({
				map: this.assetsManager.loadedItems.rotationBorder1,
				transparent: true,
				opacity: 0.6,
				side: THREE.DoubleSide,
				depthWrite: false,
			}),
			position: new THREE.Vector3(...center, 0.33),
		})
		plane01.mesh.renderOrder = 6
		plane01.join()
		//
		let plane02 = new Plane(this, {
			width: 10,
			needRotate: true,
			rotateSpeed: 0.008,
			material: new THREE.MeshBasicMaterial({
				map: this.assetsManager.loadedItems.rotationBorder2,
				transparent: true,
				opacity: 0.4,
				side: THREE.DoubleSide,
				depthWrite: false,
			}),
			position: new THREE.Vector3(...center, 0.34),
		})
		plane02.mesh.renderOrder = 6
		plane02.join()
	}
	// 创建城市标签
	setMainMapData() {
		let valObj = {};
		this.mapData.forEach(item => {
			valObj[item.adcode] = item.value;
		})
		this.mainMap.coordinates = this.mainMap.coordinates.map(item => {
			return {
				...item,
				value: valObj[item.adcode] || 0,
			}
		})
	}
	removeValBox() {
		this.valBoxs.forEach(el => {
			this.scene.remove(el)
		})
	}
	// 创建数据栏
	createValBox(type) {
		if(type == 5) return 
		let sortArr = this.mainMap.coordinates.filter(v => !v.name.includes("嘉兴")).sort((a, b) => b.value - a.value)
		this.valBoxs = []
		this.mainMap.coordinates.forEach((item, index) => {
			if (!item.centroid || !item.center) {
				return false
			}
			let [x, y] = geoProjection(item.centroid || item.center)
			let label = null
			if (type == 6) {
				let arr = []
				for (const k in item.value) {
					arr.push({ k: k, v: item.value[k] })
				}
				let dom = ''
				console.log(arr);
				arr.forEach(el => {
					dom += `<div class="${el.k + el.v}"></div>`
				});
				label = this.createLabelItem(dom, new THREE.Vector3(x, -y , 0.6), 'mapSortBox')
			} else {
				let rateDom = `<div class="delta-${item.value > 0 ? 'red' : 'green'}"></div>`
				let dom = `<div class='sort'>${(sortArr.findIndex(v => v.name === item.name) + 1) || ''}</div>
				${type > 1 ? rateDom : ''}
				<div class='value'>${Math.abs(item.value).toFixed(type ? 2 : 4)}%</div>`
				label = this.createLabelItem(dom, new THREE.Vector3(x, -y, 0.6), 'mapValBox')
			}
			this.valBoxs.push(label)
		})
	}
	//创建县名称栏
	createLabel() {
		this.label2d = new Label2d(this);
		this.setMainMapData();

		this.mainMap.coordinates.forEach((item, index) => {
			if (!item.centroid || !item.center) {
				return false
			}
			let [x, y] = geoProjection(item.centroid || item.center)
			this.createLabelItem(item.name, new THREE.Vector3(x, -y, 0.6), item.name.includes('嘉兴') ? 'mapLabel jiaxing' : 'mapLabel')
		})
	}
	createLabelItem(name, position, className = 'mapLabel') {
		const label = this.label2d.create(name, className)
		label.show(name, position)
		this.scene.add(label)
		return label;
	}
	// 创建透明围墙
	createWall() {
		let data = transfromGeoJSON(this.assetsManager.loadedItems.province)
		let fzData = data.features.filter(item => item.properties.name === config.cityName)
		let coordinates = []
		fzData[0].geometry.coordinates[0].map(coords => {
			coords.map(cood => {
				let [x, y] = geoProjection(cood)
				coordinates.push(x, -y)
			})
		})
		let wall = new Wall(this, {
			coordinates: coordinates,
			height: 1.2, //高度
			renderOrder: 10,
			material: new THREE.MeshBasicMaterial({
				color: 0x158ef4,
				side: THREE.DoubleSide,
				transparent: true,
				depthTest: false,
				opacity: 0.2,
			}),
		})
		wall.mesh.position.z += 0.81
		wall.join()
	}
	// 创建波纹shader
	createPlane() {
		let shaderMaterial = new SpreadShader(this, {
			radius: 0.0,
			center: new THREE.Vector3(...center, 0),
			width: 1.0,
			maxTime: 4.0,
			speed: 40.0,
			color: new THREE.Color('#1A64E0'),
			material: new THREE.MeshLambertMaterial({
				color: 0x011d4d,
				transparent: true,
				depthWrite: false,
			}),
		})
		let [x0, y0] = center
		let geoArr = []
		let cityBox = {
			min: {
				x: -9.402891159057617,
				y: -9.644509315490723,
				z: 0.3000000029802322
			},
			max: {
				x: 12.942660331726074,
				y: 6.478987216949463,
				z: 0.799999988079071
			},
		}
		for (let i = 0; i < 5000; i++) {
			let x = random(x0 - 50, x0 + 50)
			let y = random(y0 - 50, y0 + 50)
			let z = random(1, 5) / 10
			if (x > cityBox.min.x && x < cityBox.max.x && y > cityBox.min.y && y < cityBox.max.y) {
				continue
			}

			let w = random(1, 20) / 30
			let cubeGeo = new THREE.BoxGeometry(w, w, w)
			cubeGeo.rotateX(THREE.MathUtils.degToRad(random(0, 360)))
			cubeGeo.rotateY(THREE.MathUtils.degToRad(random(0, 360)))
			cubeGeo.rotateZ(THREE.MathUtils.degToRad(random(0, 360)))
			cubeGeo.translate(x, y, z + w)
			geoArr.push(cubeGeo)
		}
		var allGeometry = mergeGeometries(geoArr)
		// var cubeMesh = new THREE.Mesh(allGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff })) //网格模型对象
		var cubeMesh = new THREE.Mesh(allGeometry, shaderMaterial.getMaterial()) //网格模型对象
		cubeMesh.renderOrder = 8
		cubeMesh.position.set(...center, 0)
		this.scene.add(cubeMesh)
		const geo = new THREE.PlaneGeometry(1000, 1000)
		const mesh = new THREE.Mesh(geo, shaderMaterial.getMaterial())
		mesh.renderOrder = -5
		this.scene.add(mesh)
	}

	// 创建柱状图
	createBar() {
		this.barGroup = new THREE.Group()
		this.barGroup.castShadow = true;
		// 最大高度
		const height = 3
		// 渐变材质
		const material = new GradientShader(this, {
			height: height,
			color1: new THREE.Color('rgb(167,104,81)'),
			color2: new THREE.Color('rgb(164,107,85)'),
			material: new THREE.MeshLambertMaterial({
				transparent: true,
				side: THREE.DoubleSide,
				opacity: 1,
			}),
		}).getMaterial()

		// 获取z轴的位置
		let {
			z
		} = this.mainMap.box.box3.max

		// 大量柱状图性能检测
		// let arr = [];
		// for(let i=0;i<100;i++){
		// 	// console.log(Math.round(Math.random()*15))
		// 	arr.push(this.mainMap.coordinates[Math.round(Math.random()*15)])
		// }
		// console.log(this.mainMap.coordinates)
		let cityArea = _.orderBy(this.mainMap.coordinates, ['value'], ['desc'])
		let max = _.maxBy(this.mainMap.coordinates, function (o) {
			return o.value || 0
		})?.value || 0
		// let cityArea = _.orderBy(arr, ['value'], ['desc'])
		// let max = _.maxBy(arr, function(o) {
		// 	return o.value
		// }).value



		cityArea.map((item, index) => {
			if (!item.centroid || !item.center) {
				return false
			}
			// 网格
			let geoHeight = height * (item.value / max);
			geoHeight = geoHeight <= 0.01 ? 0.01 : geoHeight;
			geoHeight = geoHeight || 0;
			const geo = new THREE.BoxGeometry(0.1, 0.1, geoHeight)
			// 上移
			geo.translate(0, 0, geoHeight / 2)
			const mesh = new THREE.Mesh(geo, material)
			mesh.castShadow = true;
			let areaBar = mesh
			let [x, y] = geoProjection(item.centroid || item.center)

			areaBar.position.set(x, -y, z)
			this.barGroup.add(areaBar)

			let label = this.createLabelItem(
				// `<span class="sort">${index + 1}</span> ${item.name} ${item.value}`,
				`<span class="sort">${item.value}</span>`,
				new THREE.Vector3(x, -y, z + geoHeight + 0.3),
				'barLabel',
			)

			this.labelArray.push(label)

			// if (index < 3) {
			// 	this.createLabelItem(
			// 		// `<span class="sort">${index + 1}</span> ${item.name} ${item.value}`,
			// 		`<span class="sort">${index + 1}</span>`,
			// 		new THREE.Vector3(x, -y, z + geoHeight + 0.3),
			// 		'barLabel',
			// 	)
			// } else {
			// 	this.createLabelItem(`${item.value}`, new THREE.Vector3(x, -y, z + geoHeight + 0.3),
			// 		'barLabel')
			// }
		})
		this.scene.add(this.barGroup)
	}

	removeBar() {
		this.scene.remove(this.barGroup);
		this.city.remove();
		this.labelArray.forEach(item => {
			this.scene.remove(item)
		})
	}

	//  更新柱子数据
	updateMapData(data, type) {
		console.log(data);
		this.mapData = data;
		this.colorRangeArray = []; //
		this.areaColor = {};
		this.setColorRange();
		this.getColors();
		this.setMainMapData();
		// this.createBar();
		this.createValBox(type)
		this.createCityMap()
	}

	// 导出模型
	exportModel() {
		exportGLTF(this.scene)
	}
	//  设置颜色范围
	setColorRange() {
		let mapData = this.mapData
		if (mapData.length === 0) {
			return
		}
		let vals = mapData.map(v => v.value);
		let max = Math.max(...vals);
		let min = Math.min(...vals);
		let step = Math.floor(max - min) / 5;
		if (step <= 0 || !step) {
			return;
		}

		for (let i = 0; i < 5; i++) {
			this.colorRangeArray.push({
				min: min + step * i,
				max: min + step * (i + 1),
				color: this.colorRange[i]
			})
		}
	}

	//  获取地图区域颜色
	getMapAreaColor(val) {
		if (this.colorRangeArray.length === 0) {
			return this.colorRange[0]
		}
		let color = ''
		this.colorRangeArray.forEach((item, i) => {
			if (val >= item.min && val < item.max) {
				color = item.color;
			}
			if (i === 4 && val >= item.max) {
				color = item.color;
			}
		})
		return color;
	}

	getColors() {
		this.mapData.forEach(item => {
			this.areaColor[item.adcode] = this.getMapAreaColor(item.value);
		})
	}
}
