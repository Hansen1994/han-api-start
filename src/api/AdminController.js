import { getMenuData, sortMenus, getRights } from '../common/Utils'
import User from '../model/User'
import Menu from '../model/Menu'
import Roles from '../model/Roles'
import Post from '../model/Post'
import Comments from '../model/Comments'
import SignRecord from '../model/SignRecord'
import moment from 'dayjs'

const weekday = require('dayjs/plugin/weekday')
// dayjs使用weekday扩展
moment.extend(weekday)
class AdminController {
  async getMenu(ctx) {
    // 查询数据
    const result = await Menu.find({})
    ctx.body = {
      code: 200,
      // 菜单排序
      data: sortMenus(result)
    }
  }
  async addMenu(ctx) {
    const { body } = ctx.request
    const menu = new Menu(body)
    const result = await menu.save()

    ctx.body = {
      data: result,
      code: 200
    }
  }
  async updateMenu(ctx) {
    const { body } = ctx.request
    const data = { ...body }
    delete data._id
    const result = await Menu.updateOne({ _id: body._id }, { ...data })
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async deleteMenu(ctx) {
    const { body } = ctx.request
    const result = await Menu.deleteOne({ _id: body._id })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getRoles(ctx) {
    const result = await Roles.find({})
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async addRole(ctx) {
    const { body } = ctx.request
    const role = new Roles(body)
    const result = await role.save()
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async updateRole(ctx) {
    const { body } = ctx.request
    const data = { ...body }
    delete data._id
    const result = await Roles.updateOne({ _id: body._id }, { ...data })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async deleteRole(ctx) {
    const { body } = ctx.request
    const result = await Roles.deleteOne({ _id: body._id })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  // 获取角色名字
  async getRoleNames(ctx) {
    const result = await Roles.find({}, { menu: 0, desc: 0 })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  // 获取用户菜单权限，菜单的数据
  async getRoutes(ctx) {
    // 1.obj -> _id -> roles
    // roles: 1说明过滤掉其他，之展示roles的数据，下面同理
    const user = await User.findOne({ _id: ctx._id }, { roles: 1 })
    const { roles } = user
    // 2. 通过角色 -> menus -> 可以访问的菜单数据
    // 用户的角色可能有多个menus -> 去重
    let menus = []
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i]
      // 只会去获取当前这个角色menu的信息
      const rights = await Roles.findOne({ role }, { menu: 1 })
      menus = menus.concat(rights.menu)
    }
    menus = Array.from(new Set(menus))
    // 3.menus -> 可以访问的菜单数据
    const treeData = await Menu.find({})
    // 递归查询type = 'menu' && _id包含在menus中
    // 结构进行改造
    const routes = getMenuData(treeData, menus, ctx.isAdmin)
    ctx.body = {
      code: 200,
      data: routes
    }
  }

  // 获取操作表，此返回给Auth.js的
  async getOperation(ctx) {
    const user = await User.findOne({ _id: ctx._id }, { roles: 1 })
    const { roles } = user
    let menus = []
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i]
      const rights = await Roles.findOne({ role }, { menu: 1 })
      menus = menus.concat(rights.menu)
    }
    menus = Array.from(new Set(menus))
    const treeData = await Menu.find({})
    // menus已经选择的_id数组
    const operations = getRights(treeData, menus)
    return operations
  }

  // 获取首页统计
  async getStats(ctx) {
    let result = {}
    // 设置当前日0时
    const nowZero = new Date().setHours(0, 0, 0, 0)
    // 1.首页顶部的card
    const inforCardData = []
    const time = moment().format('YYYY-MM-DD 00:00:00')
    // const ss = await User.find({})

    // 今日新添用户数据,就是获取今日大于0时的用户,gte为大于等于
    const userNewCount = await User.find({
      created: { $gte: time }
    }).countDocuments()
    // 获取帖子的总数量
    const postsCount = await Post.find({}).countDocuments()
    // 获取评论数量(今日新加)
    const commentsNewCount = await Comments.find({
      created: { $gte: time }
    }).countDocuments()
    // 获取周一0时
    const starttime = moment(nowZero).weekday(1).format()
    // console.log(starttime)
    // 获取周八0时(这样子刚好有一周)
    const endtime = moment(nowZero).weekday(8).format()
    // console.log(endtime)
    // 本周结束时候的评论数量
    const weekEndCount = await Comments.find({
      created: { $gte: starttime, $lte: endtime },
      isBest: '1'
    }).countDocuments()
    // 签到周的数量
    const signWeekCount = await SignRecord.find({
      created: { $gte: starttime, $lte: endtime }
    }).countDocuments()
    // 发帖周的数量
    const postWeekCount = await Post.find({
      created: { $gte: starttime, $lte: endtime }
    }).countDocuments()
    inforCardData.push(userNewCount)
    inforCardData.push(postsCount)
    inforCardData.push(commentsNewCount)
    inforCardData.push(weekEndCount)
    inforCardData.push(signWeekCount)
    inforCardData.push(postWeekCount)
    // 2.左侧的饼图数据
    // $sum 和
    const postsCatalogCount = await Post.aggregate([
      { $group: { _id: '$catalog', count: { $sum: 1 } } }
    ])
    const pieData = {}
    postsCatalogCount.forEach((item) => {
      pieData[item._id] = item.count
    })
    // 3.月统计数据
    // 3.1 计算6个月前的时间: 1号 00：00：00
    // 3.2 查询数据库中对应时间内的数据$gte
    // 3.3 group组合 -> sum -> sort排序
    // date(1)代表第1天
    const startMonth = moment(nowZero).subtract(5, 'M').date(1).format()
    const endMonth = moment(nowZero).add(1, 'M').date(1).format()
    // console.log(startMonth, endMonth)
    let monthData = await Post.aggregate([
      {
        $match: {
          created: { $gte: new Date(startMonth), $lt: new Date(endMonth) }
        }
      },
      {
        // 对created进行格式化，只要年月部分,然后赋值给自定义month
        $project: {
          month: { $dateToString: { format: '%Y-%m', date: '$created' } }
        }
      },
      // 总和($month为上面定义的month)
      { $group: { _id: '$month', count: { $sum: 1 } } },
      // 排序以id
      { $sort: { _id: 1 } }
    ])
    // 这个挺好的，值得学习
    monthData = monthData.reduce((obj, item) => {
      return {
        ...obj,
        [item._id]: item.count
      }
    }, {})
    // 4.底部的数据
    const startDay = moment().subtract(7, 'day').format()
    const _aggregate = async (model) => {
      let result = await model.aggregate([
        {
          $match: {
            created: { $gte: new Date(startDay) }
          }
        },
        {
          $project: {
            // 这里与上面不同，这里精确到天
            day: { $dateToString: { format: '%Y-%m-%d', date: '$created' } }
          }
        },
        // 总和($month为上面定义的month)
        { $group: { _id: '$day', count: { $sum: 1 } } },
        // 排序以id
        { $sort: { _id: 1 } }
      ])
      result = result.reduce((obj, item) => {
        console.log(obj)
        console.log(item)
        return {
          ...obj,
          [item._id]: item.count
        }
      }, {})
      return result
    }
    // 前7周数据
    // 2020-12-20: 1
    // 2020-12-22: 1
    // 2020-12-24: 1
    const userWeekData = await _aggregate(User)
    const signWeekData = await _aggregate(SignRecord)
    const postWeekData = await _aggregate(Post)
    const commentsWeekData = await _aggregate(Comments)
    // 返回前端前六周文字
    const dataArr = []
    for (let i = 0; i <= 6; i++) {
      dataArr.push(
        moment()
          .subtract(6 - i, 'day')
          .format('YYYY-MM-DD')
      )
    }
    // console.log(dataArr)
    // 为了避免有些周没有数据以0占位
    const addData = (obj) => {
      const arr = []
      dataArr.forEach((item) => {
        if (obj[item]) {
          arr.push(obj[item])
        } else {
          arr.push(0)
        }
      })
      return arr
    }
    const weekData = {
      user: addData(userWeekData),
      sign: addData(signWeekData),
      post: addData(postWeekData),
      comments: addData(commentsWeekData)
    }

    result = {
      inforCardData,
      pieData,
      monthData,
      weekData
    }
    ctx.body = {
      code: 200,
      data: result
    }
  }
}

export default new AdminController()
