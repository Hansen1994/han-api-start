import config from '../config/index'
import { getJWTPayload } from './Utils'
import { getValue } from '../config/RedisConfig'
import adminController from '../api/AdminController'
// 获取用户鉴权中间键
export default async (ctx, next) => {
  const headers = ctx.header.authorization
  // console.log(headers)
  if (typeof headers !== 'undefined') {
    const obj = await getJWTPayload(headers)
    console.log(obj)
    if (obj._id) {
      ctx._id = obj._id
      // setValue在common/Init.js
      const admins = JSON.parse(await getValue('admin'))
      if (admins.includes(obj._id)) {
        // api里面的所有的都能通过ctx获取
        ctx.isAdmin = true
        // 如果是超级管理员则放行
        await next()
        return
      } else {
        ctx.isAdmin = false
      }
    }
  }
  // console.log(ctx, 1)
  // 如果不是超级管理员
  // 1.过滤掉公众路径,就是说这些公用路径不需要鉴权
  const { publicPath } = config
  console.log(ctx.url)
  // ctx.url 为接口路径
  if (publicPath.some((item) => item.test(ctx.url))) {
    await next()
    return
  }
  // 2. 根据用户的roles -> menus -> operations

  const operations = await adminController.getOperation(ctx)
  // console.log(operations)
  // 3. 判断用户的请求路径是否在operations里面，如果在放行，否则禁止访问
  if (operations.includes(ctx.url)) {
    await next()
  } else {
    ctx.throw(401)
  }
}
