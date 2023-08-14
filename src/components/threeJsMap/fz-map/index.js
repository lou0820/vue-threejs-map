import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import {
  Base,
  OrbitControls,
  State,
  AssetsManager,
  Plane,
  getBoundingBox,
} from "@/libs/mini3d";
import { Grid } from "./components/grid";
import { BaseMap } from "./components/map";
import { Line } from "./components/line";
import { Lights } from "./components/lights";
import { Points } from "./components/point";
import { Wall } from "./components/wall";
import { UpShader } from "./shader/upShader/index";
import { SpreadShader } from "./shader/spreadShader/index";
import { GradientShader } from "./shader/gradientShader/index";
import _ from "lodash";
import { Label2d } from "@/libs/mini3d/extra/label2d";
import config from "../config";
import { geoProjection, transfromGeoJSON, center, exportGLTF } from "./utils";
import pointSvg from '@/assets/imgs/point.svg'

let assets = [
  {
    name: "china",
    type: "file",
    path: "./data/中华人民共和国.json",
  },
  {
    name: "province",
    type: "file",
    path: "./data/浙江省.json",
  },
  {
    name: "city",
    type: "file",
    path: "./data/safeArea.json",
  },
  {
    name: "rotationBorder1",
    type: "texture",
    path: "./data/rotationBorder1.png",
  },
  {
    name: "rotationBorder2",
    type: "texture",
    path: "./data/rotationBorder2.png",
  },

  //
  {
    name: "yuyao",
    type: "file",
    path: './data/余姚市.json',
  },
  {
    name: "cixi",
    type: "file",
    path: './data/慈溪市.json',
  },
  {
    name: "haishu",
    type: "file",
    path: './data/海曙区.json',
  },
  {
    name: "jiangbei",
    type: "file",
    path: './data/江北区.json',
  },
  {
    name: "zhenhai",
    type: "file",
    path: './data/镇海区.json',
  },
  {
    name: "fenghua",
    type: "file",
    path: './data/奉化区.json',
  },
  {
    name: "yinzhou",
    type: "file",
    path: './data/鄞州区.json',
  },
  {
    name: "beilun",
    type: "file",
    path: './data/北仑区.json',
  },
  {
    name: "ninghai",
    type: "file",
    path: './data/宁海县.json',
  },
  {
    name: "xiangshan",
    type: "file",
    path: './data/象山县.json',
  },
];
let nameObj = {
  "余姚市": "yuyao",
  "慈溪市": "cixi",
  "海曙区": "haishu",
  "江北区": "jiangbei",
  "镇海区": "zhenhai",
  "奉化区": "fenghua",
  "鄞州区": "yinzhou",
  "北仑区": "beilun",
  "宁海县": "ninghai",
  "象山县": "xiangshan",
}

function getRndInteger(min, max) {
  // console.log(Math.floor(Math.random() * (max - min)) + min)
  return Math.floor(Math.random() * (max - min)) + min;
}

export class Map3d extends Base {
  // type: 1 安全监督；2 市场营销
  constructor(el, mapData, type = 1, clickPoint) {
    super(el);
    this.clickPoint = clickPoint;
    this.currentLevel = 1; // 1: 市级；2：县级
    // 颜色范围
    this.colorRange = ["#0a3b66", "#0d4271", "#10497c", "#2369a3", "#2770ad"];
    this.camera.lookAt(...center, 0);
    this.camera.position.set(-1, -17, 14);
    this.pointTexture = new THREE.TextureLoader().load(pointSvg);

    this.barGroup = null;
	this.pointGroup = [];
    this.labelArray = []; // 存放柱子数据
    this.city = null; // 市级地图，scene可重复添加
    this.cityLine = null;

    this.county = null; // 县级地图，每次需要重新建立对象。
    this.countyLine = null; // 县级地图，每次需要重新建立对象。

    // this.renderer.setClearColor(0x191919, 1);
    let ambientLight = new THREE.AmbientLight(0xffffff);
    this.scene.add(ambientLight);
    this.mainMap = {};
    this.mapData = mapData.barData;
	this.pointData = mapData.pointData;
    this.colorRangeArray = []; //
    this.areaColor = {};
    this.setColorRange();
    this.getColors();
    assets.forEach((item) => {
      if (item.name === "city") {
        if (type === 2) {
          item.path = "./data/market.json";
        } else {
          item.path = "./data/safeArea.json";
        }
      }
    });

    this.assetsManager = new AssetsManager(this, assets, {
      onProgress: (current, total) => {
        // console.log(current, total)
      },
      onComplete: () => {
        // console.log('加载完成', this.assetsManager)

        this.start();
      },
    });
  }
  start() {
    super.start();
    this.helperTools();
    this.create();

  }
  /**
   * 开启辅助工具
   */
  helperTools() {
    // 内存监测
    // let state = new State(this)
    // state.join()
    // 轨道控制器
    let orbit = new OrbitControls(this);
    this.orbitControls.target = new THREE.Vector3(...center, 0);
    orbit.join();
    // 坐标轴辅助
    // let axes = new THREE.AxesHelper(200);
    // axes.position.set(...center, 0);
    // this.scene.add(axes)
  }
  create() {
    // 添加雾
    // this.scene.fog = new THREE.Fog(0x191919, 0, 70)
    // 获取中心坐标点并将其放到缓存中
    this.getCenterPoint();

    // 创建地图网格
    // this.createGrid();

    // 创建省份地图
    // this.createProvinceMap();
    // 创建城市地图
    this.createCityMap();
    // 创建点光源
    this.createLight({
      color: 0xffffff,
      intensity: 10,
      distance: 100,
      position: [20, -15, 30],
    });
    this.createLight({
      color: 0xffffff,
      intensity: 10,
      distance: 100,
      position: [20, -15, 50],
    });


    // 创建城市标签
    this.createLabel();

    // 创建柱状图
    this.createBar();

    // 创建点位
    this.createPoint();

  }
  createPoint(pointData){
    let data = pointData || this.pointData;
    let points = new Points(this);
    data.forEach(item => {
      const { lng, lat, companyId, region } = item;
      if(lng && lat){
        const [x, y] = geoProjection([lng, lat]);
        let sprite = points.create(x, -y, companyId, region);
        this.pointGroup.push(sprite);
        this.scene.add(sprite)
      }
    })
  }

  createPoint11() {
    //添加坐标点位，目前性能检测一万个帧率在20左右,建议点数量限制在6000以下
    let objArr = [];
    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.pointTexture,
      sizeAttenuation: false,
    });
    const spriteMaterial2 = new THREE.SpriteMaterial({
      map: this.pointTexture,
      sizeAttenuation: false,
      depthTest: false,
      opacity: 0.2,
    });
    // 创建精灵图模型实例的函数
    function createMarker(m) {
      return new THREE.Sprite(m);
    }
    var that = this;
    // 创建一个标点的函数
    function createMarkerCon(x, y, companyId, adCode) {
      // 第一个精灵图模型
      let sprite1 = createMarker(spriteMaterial);
      // 第二个精灵图模型
      let sprite2 = createMarker(spriteMaterial2);
      // 第一个精灵图模型 把 第二个精灵图模型 添加为子模型
      sprite1.add(sprite2);
      // 设置精灵图模型的尺寸缩放
      sprite1.scale.set(0.03, 0.03, 0);
      // 设置精灵图模型初始位置
      sprite1.position.set(x, y, 1);
      sprite1.name = companyId + "-" + adCode;
      // 因为场景里不可能只有标点，所以要对精灵图模型添加特异性字段进行区分
      sprite1.isMarker = true;
      // 把第一个精灵图模型添加到场景
      that.scene.add(sprite1);
      // 把标点（第一个精灵图模型）添加到objArr
      objArr.push(sprite1);
    }
	this.pointGroup = objArr;
    // const [x, y] = geoProjection([121.15, 30.03])
    // console.log([x, y])
    // createMarkerCon(x, y)
    // // 创建一个标点
    for (let i = 0; i < that.pointData.length; i++) {
      const { lng, lat, companyId, region } = that.pointData[i];
      if (lng && lat) {
        const [x, y] = geoProjection([lng, lat]);
        // createMarkerCon(Math.round(Math.random()*15)/10,Math.round(Math.random()*15)/10)
        createMarkerCon(x, -y, companyId, region);
      }
    }

    // 点击事件处理函数
    const onClick = (event) => {
      // 获取点击位置的屏幕坐标
      const mouse = new THREE.Vector2();
      const appMap = document.getElementById("appMap");

      mouse.x = (event.offsetX / appMap.offsetWidth) * 2 - 1;
      mouse.y = -(event.offsetY / appMap.offsetHeight) * 2 + 1;
      // 通过射线检测点击位置是否与精灵图相交
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, that.camera);
      that.scene.children.forEach((e) => {
        if (e.isSprite) {
          let intersects = raycaster.intersectObject(e);
          if (intersects.length > 0) {
            // const dom = document.getElementById("mapDialog");
            // dom.style.display = "block";
            // dom.id = "1111";
            // dom.style.left = event.offsetX + 'px';
            // dom.style.top = event.offsetY + 'px';
            console.log("点击精灵", e);
          }
        }
      });
    };
    // 监听点击事件
    document.getElementById("appMap").addEventListener("click", onClick, false);
  }
	
  createGui() {}
  // 获取中心点位置
  getCenterPoint() {
    let data = transfromGeoJSON(this.assetsManager.loadedItems.province);
    let cityData = data.features.filter(
      (item) => item.properties.name === config.cityName
    );
    if (cityData.length) {
      // this.mainMap.center =  [121.757654, 29.86747]
      this.mainMap.center = cityData[0].properties.centroid || [0, 0];
      localStorage.setItem("center", JSON.stringify(this.mainMap.center));
    }
  }
  createGrid() {
    // 添加网格
    console.log(center, "center");
    let grid = new Grid(this, {
      position: new THREE.Vector3(...center, 0),
    });
    grid.gridGroup.rotateX(Math.PI / 2);
    grid.join();
  }
  createChinaMap() {
    try {
      let china = new BaseMap(this, {
        data: this.assetsManager.loadedItems.china,
        topFaceMaterial: new THREE.MeshBasicMaterial({
          color: new THREE.Color("#020a1a"),
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
      });
      china.join();
      let chinaLine = new Line(this, {
        data: this.assetsManager.loadedItems.china,
        material: new THREE.LineBasicMaterial({
          // color: new THREE.Color("#343b62"),
          color: new THREE.Color("#DC143C"),
          depthTest: false,
        }),
        renderOrder: 5,
      });
      // chinaLine.join()
      chinaLine.lineGroup.position.z += 0.31;
    } catch (error) {
      console.log(error);
    }
  }
  createProvinceMap() {
    let province = new BaseMap(this, {
      data: this.assetsManager.loadedItems.province,
      topFaceMaterial: new THREE.MeshBasicMaterial({
        color: new THREE.Color("#020a1a"),
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
    });
    province.join();
    let provinceLine = new Line(this, {
      data: this.assetsManager.loadedItems.province,
      material: new THREE.LineBasicMaterial({
        color: new THREE.Color("#20253f"),
      }),
      // material: new LineMaterial({ color: 0x6393bd, linewidth: 0.002 }),
      // type: 'Line2',
      renderOrder: 5,
    });
    // console.log(LineMaterial)

    provinceLine.join();
    provinceLine.lineGroup.position.z += 0.32;
  }
  createCityMap(assetsName=null) {
    try {
      const sideMaterial = new UpShader(this, {
        // start: -0.2, // 开始点
        // end: 0.6, // 结束点
        height: 1, // 光环高度
        // maxTime: 6, // 最大时间
        // speed: 0.2,
        color: new THREE.Color("#1A64E0"), // 颜色
        material: new THREE.MeshLambertMaterial({
          color: 0x011d4d,
          transparent: true,
          opacity: 0.8,
        }),
      });

      let currentAssets = assetsName ? this.assetsManager.loadedItems[assetsName] : this.assetsManager.loadedItems.city;


      // 添加市地图
      this[assetsName ? 'county' : 'city'] = new BaseMap(
        this,
        {
          data: currentAssets,
          topFaceMaterial: new THREE.MeshLambertMaterial({
            color: 0x002959,
            emissive: 0x002959,
            transparent: true,
            opacity: 1,
          }),
          sideMaterial: sideMaterial.getMaterial(),
          renderOrder: 2,
          depth: 0.3,
        },
        this.areaColor
      );
      let currentMap = this[assetsName ? 'county' : 'city'];
      currentMap.mapGroup.position.z += 0.1;
      currentMap.join();

      if(!assetsName){
        this.mainMap.coordinates = this.city.getCoordinates();
        this.mainMap.box = getBoundingBox(this.city.mapGroup);
      }

      this[assetsName ? 'countyLine' : 'cityLine' ] = new Line(this, {
        data: currentAssets,
        material: new THREE.LineBasicMaterial({
          color: new THREE.Color("#359DF8"), // 颜色
        }),
        renderOrder: 2,
      });
      let line = this[assetsName ? 'countyLine' : 'cityLine' ];
      line.join();
      line.lineGroup.position.z += 0.81;
    } catch (error) {
      console.log(error);
    }
  }
  createLight(config) {
    const lights = new Lights(this, config);
    lights.join();
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
    });
    plane01.mesh.renderOrder = 6;
    plane01.join();
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
    });
    plane02.mesh.renderOrder = 6;
    plane02.join();
  }

  // 创建城市标签
  setMainMapData() {
    let valObj = {};
    this.mapData.forEach((item) => {
      valObj[item.adcode] = item.value;
    });
    this.mainMap.coordinates = this.mainMap.coordinates.map((item) => {
      return {
        ...item,
        value: valObj[item.adcode] || 0,
      };
    });
  }
  createLabel() {
    this.label2d = new Label2d(this);
    this.setMainMapData();
    this.mainMap.coordinates.forEach((item) => {
      if (!item.centroid || !item.center) {
        return false;
      }
      let [x, y] = geoProjection(item.centroid || item.center);
      let label = this.createLabelItem(item.name, new THREE.Vector3(x, -y, 0.6), "mapLabel", () => {
        if(this.currentLevel === 1){
          this.currentLevel = 2;
          this.whenClickLabel(item)
        }
      });
      this.labelArray.push(label);
    });
  }
  whenClickLabel(item){
    let assetsName = nameObj[item.name];
    if(assetsName){
      this.removeBar(item)
      this.city.remove();
      this.createCityMap(assetsName);
    }
  }
  createLabelItem(name, position, className = "mapLabel", fn) {
    const label = this.label2d.create(name, className, fn);
    label.show(name, position);
    this.scene.add(label);
    return label;
  }
  // 创建柱状图
  createBar() {
    this.barGroup = new THREE.Group();
    // 最大高度
    const height = 3;
    // 渐变材质
    const material = new GradientShader(this, {
      height: height,
      color1: new THREE.Color("rgb(167,104,81)"),
      color2: new THREE.Color("rgb(164,107,85)"),
      material: new THREE.MeshLambertMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 1,
      }),
    }).getMaterial();

    // 获取z轴的位置
    let { z } = this.mainMap.box.box3.max;


    let cityArea = _.orderBy(this.mainMap.coordinates, ["value"], ["desc"]);
    let max =
      _.maxBy(this.mainMap.coordinates, function (o) {
        return o.value || 0;
      })?.value || 0;


    cityArea.map((item, index) => {
      if (!item.centroid || !item.center) {
        return false;
      }
      // 网格
      let geoHeight = height * (item.value / max);
      geoHeight = geoHeight <= 0.01 ? 0.01 : geoHeight;
      geoHeight = geoHeight || 0;
      const geo = new THREE.BoxGeometry(0.1, 0.1, geoHeight);
      // 上移
      geo.translate(0, 0, geoHeight / 2);
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = true;
      let areaBar = mesh;
      let [x, y] = geoProjection(item.centroid || item.center);

      areaBar.position.set(x, -y, z);
      this.barGroup.add(areaBar);

      let label = this.createLabelItem(
        // `<span class="sort">${index + 1}</span> ${item.name} ${item.value}`,
        `<span class="sort">${item.value}</span>`,
        new THREE.Vector3(x, -y, z + geoHeight + 0.3),
        "barLabel"
      );
      this.labelArray.push(label);

    });
    this.scene.add(this.barGroup);
  }

  removeBar(obj) {
    let label = obj.name;
    this.scene.remove(this.barGroup);
    this.scene.remove(this.cityLine.lineGroup);
    this.city.remove();

    this.pointGroup.forEach(item => {
      this.scene.remove(item);
    })
    this.pointGroup = []; // 清空point数据

    this.labelArray.forEach((item) => {
      item?.hideWithoutName(label);
    });
    this.clickPoint(obj.adcode).then(res => {
      this.createPoint(res.data);
    })
    
  }
  getPointsData() {
    this.createPoint(res)
  }

  //  返回上一级，渲染
  backPre(getData){
    if(this.currentLevel === 2){
      this.county.remove();
      this.scene.remove(this.countyLine.lineGroup);

      this.scene.add(this.barGroup);
      this.city.join();
      this.cityLine.join();
      this.labelArray.forEach((item) => {
        item.showLabel();
      });
      this.pointGroup.forEach(item => {
        this.scene.add(item);
      })
      getData.then(res => {
        this.createPoint(res)
      })

      this.currentLevel = 1;
    }
  }

  //  更新柱子数据
  updateMapData(data) {
		assets = [
			{
				name: "china",
				type: "file",
				path: "./data/中华人民共和国.json",
			},
			{
				name: "province",
				type: "file",
				path: "./data/浙江省.json",
			},
			{
				name: "city",
				type: "file",
				path: "./data/safeArea.json",
			},
		]
    this.assetsManager = new AssetsManager(this, assets, {
      onProgress: (current, total) => {
        // console.log(current, total)
      },
      onComplete: () => {
        // console.log('加载完成', this.assetsManager)

        this.start();
      },
    });
    this.mapData = data.barData;
		this.pointData = data.pointData;
    // this.colorRangeArray = []; //
    // this.areaColor = {};
    // this.setColorRange();
    // this.getColors();
    // this.setMainMapData();
    // this.createBar();
    // this.createCityMap();
  }

  // 导出模型
  exportModel() {
    exportGLTF(this.scene);
  }
  //  设置颜色范围
  setColorRange() {
    let mapData = this.mapData;
    if (mapData.length === 0) {
      return;
    }
    let vals = mapData.map((v) => v.value);
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
        color: this.colorRange[i],
      });
    }
  }

  //  获取地图区域颜色
  getMapAreaColor(val) {
    if (this.colorRangeArray.length === 0) {
      return this.colorRange[0];
    }
    let color = "";
    this.colorRangeArray.forEach((item, i) => {
      if (val >= item.min && val < item.max) {
        color = item.color;
      }
      if (i === 4 && val >= item.max) {
        color = item.color;
      }
    });
    return color;
  }

  getColors() {
    this.mapData.forEach((item) => {
      this.areaColor[item.adcode] = this.getMapAreaColor(item.value);
    });
  }
}
