<template>
  <div class="content">
    <div class="back-content" @click="goBack" v-if="state.isBack">
      <img src="./assets/imgs/back.png" alt="">
      <span>返回上级</span>
    </div>
    <div id="appMap" class="map"></div>
  </div>
</template>


<script setup>
import { onMounted, reactive, watch } from 'vue';
import * as THREE from "three";
import { Map3d } from './components/threeJsMap/fz-map/index';
import { areaList, companyList, regionByCompany } from './item';
var FzMap = null;

const state = reactive({
  barData: [],
  pointData: [],
  isBack: false,
})

onMounted(() => {
  initMap3D();
})

// 初始化地图和点
const initMap3D = () => {
  areaList.forEach((item, index) => {
    if (item.value) {
      item.adcode = item.region;
      item.value = index + 1;
    }
  })
  state.barData = areaList;
  state.pointData = companyList;
  FzMap = new Map3d('.map', {barData: areaList, pointData: companyList}, 2, clickPoint)
  // 监听点击事件
  document.getElementById("appMap").addEventListener("click", onClick, false);
}

// 点击label事件,展示单独区县的点，目前数据写死，只有慈溪市有数据
const clickPoint = () => {
  state.isBack = true;
  return new Promise((resolve) => {
    resolve(regionByCompany)
  })
}

const onClick = (event) => {
   // 获取点击位置的屏幕坐标
   const mouse = new THREE.Vector2();
  const appMap = document.getElementById("appMap");
  mouse.x = (event.offsetX / appMap.offsetWidth) * 2 - 1;
  mouse.y = -(event.offsetY / appMap.offsetHeight) * 2 + 1;
  // 通过射线检测点击位置是否与精灵图相交
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, FzMap.camera);
  FzMap.scene.children.forEach((e) => {
    if (e.isSprite) {
      let intersects = raycaster.intersectObject(e);
      if (intersects.length > 0) {
        const code = e.name.split('-')[1];
        const companyId = e.name.split('-')[0];
        alert('成功点到了点，拿到了点的信息：区域code:' + code + ', 企业id:' + companyId);
      }
    }
  });
}

// 返回上一级重新请求点的数据
const goBack = () => {
  state.isBack = false;
  FzMap.backPre(new Promise(resolve => {
    resolve(companyList);
  }))
}
</script>

<style lang="less">
.content {
  position: relative;
  .back-content {
    position: absolute;
    z-index: 1;
    width: 198px;
    height: 74px;
    background: url('./assets/imgs/back-bg.png') no-repeat;
    background-size: 100% 100%;
    margin-left: 60px;
    padding-left: 26px;
    display: flex;
    align-items: center;
    cursor: pointer;
    span {
      margin-left: 14px;
      font-size: 26px;
      font-family: YouSheBiaoTiHei;
      color: #B0E0FF;
      background: linear-gradient(180deg, #FFFFFF 0%, #74838E 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}
.map {
  background: url('./assets/imgs/map-bg2.png') no-repeat;
  background-size: 100% 100%;
}
.mapLabel {
  font-size: 16px;
  color: #fff;
  width: 82px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.25) 20%, rgba(0, 0, 0, 0.7) 100%);
  border-radius: 0px 2px 2px 0px;
  display: inline;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    width: 37px;
    height: 31px;
    left: -18px;
    top: -3px;
    background: url("./assets/imgs/label_icon.png") no-repeat;
  }
}
.barLabel {
    font-size: 12px;
    color: #fff;
    text-shadow: 1px 1px #48c1ff;

    .sort {
      display: inline-block;
      min-width: 28px;
      height: 28px;
      padding: 1px;
      box-sizing: content-box;
      border-radius: 31px;
      background: rgba(117, 73, 0, 0.5);
      border: 2px solid #FFB868;
      text-align: center;
      text-shadow: none;
      font-size: 20px;
      font-family: TeXGyreAdventor-BoldItalic, TeXGyreAdventor;
      font-weight: normal;
      color: #FFF4E0;
      line-height: 26px;
    }
  }
</style>
