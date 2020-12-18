import Menu from '../model/Menu'
import Roles from '../model/Roles'

class AdminController {
  async getMenu(ctx) {
    // 查询数据
    const result = await Menu.find({})
    ctx.body = {
      code: 200,
      data: result
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
}

export default new AdminController()
