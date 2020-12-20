import { getMenuData, sortMenus, getRights } from '../common/Utils'
import User from '../model/User'
import Menu from '../model/Menu'
import Roles from '../model/Roles'

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
}

export default new AdminController()
