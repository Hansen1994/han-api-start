// 从redis获取值
import { getValue } from '../config/RedisConfig'
import config from '../config/index'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const getJWTPayload = (token) => {
  // 返回布尔值，判断token是否过期
  return jwt.verify(token.split(' ')[1], config.JWT_SECRET)
}
const checkCode = async (key, value) => {
  const redisData = await getValue(key)
  if (redisData != null) {
    if (redisData.toLowerCase() === value.toLowerCase()) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

const getStats = (path) => {
  return new Promise((resolve) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(false)
      } else {
        resolve(stats)
      }
    })
  })
}

const mkdir = (dir) => {
  return new Promise((resolve) => {
    fs.mkdir(dir, (err) => (err ? resolve(false) : resolve(true)))
  })
}

// 循环遍历，递归判断如果上级目录不存在，则产生上一级目录
const dirExists = async (dir) => {
  const isExists = await getStats(dir)
  // 如果该路径存在且不是文件,而是文件夹目录，返回true
  if (isExists && isExists.isDirectory()) {
    return true
  } else if (isExists) {
    // 如果存在，但是是文件，素以返回true
    return false
  }
  // 如果该路径不存在
  const tempDir = path.parse(dir).dir
  // console.log(tempDir)
  // 循环遍历，递归判断如果上级目录不存在，则产生上级目录(递归操作)
  const status = await dirExists(tempDir)
  if (status) {
    const result = await mkdir(dir)
    return result
  } else {
    return false
  }
}

// 属性排序
const sortObj = (arr, property) => {
  return arr.sort((m, n) => m[property] - n[property])
}

// 获取菜单数据
/**
 *
 * @param {*} tree
 * @param {Array} rights
 * @param {Boolean} flag 用来判断是否为超管 true是
 */

const getMenuData = (tree, rights, flag) => {
  const arr = []
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    // _id 包含在menu中
    // 结构进行改造, 删除opertations(表格)
    if (rights.includes(item._id + '') || flag) {
      if (item.type === 'menu') {
        arr.push({
          _id: item.id,
          path: item.path,
          meta: {
            title: item.title,
            hideInBread: item.hideInBread,
            notCache: item.notCache,
            icon: item.icon
          },
          component: item.component,
          children: getMenuData(item.children, rights)
        })
      } else if (item.type === 'link') {
        arr.push({
          _id: item._id,
          path: item.path,
          meta: {
            title: item.title,
            icon: item.icon,
            href: item.link
          }
        })
      }
    }
  }
  return sortObj(arr, 'sort')
}

// 菜单排序功能
const sortMenus = (tree) => {
  tree = sortObj(tree, 'sort')
  if (tree.children && tree.children.length > 0) {
    tree.children = sortMenus(tree.children, 'sort')
  }
  if (tree.operations && tree.operations.length > 0) {
    tree.operations = sortMenus(tree.operations, 'sort')
  }
  return tree
}

// 数组扁平化
const flatten = (arr) => {
  while (arr.some((item) => Array.isArray(item))) {
    arr = [].concat(...arr)
  }
  return
}

const getRights = (tree, menus) => {
  let arr = []
  for (let item of tree) {
    if (item.operations && item.operations.length > 0) {
      for (let op of item.operations) {
        if (menus.includes(op._id + '')) {
          // 存放路由路径
          arr.push(op.path)
        }
      }
    } else if (item.children && item.children.length > 0) {
      arr.push(getRights(item.children, menus))
    }
  }
  // 返回扁平化路径数组
  return flatten(arr)
}
export { checkCode, getJWTPayload, dirExists, getMenuData, sortMenus, getRights }
