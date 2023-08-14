import { Vector3, Box3 } from 'three'

/**
 * 计算包围盒
 * @param {*} group
 * @returns
 */
export const getBoundingBox = group => {
  var box3 = new Box3()
  box3.expandByObject(group)
  var size = new Vector3()
  box3.getSize(size)
  var center = new Vector3()
  box3.getCenter(center)
  return {
    box3,
    center,
    size,
  }
}

// 随机数
export const random = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
