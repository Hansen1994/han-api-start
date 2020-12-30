import log4js from '../config/Log4j'
import ErrorRecord from '../model/ErrorRecord'
import User from '../model/User'
import config from '../config/index'

const logger = log4js.getLogger('error')

export default async (ctx, next) => {
  try {
    await next()
    // 主动判断，并收集特定的接口请求 -> regex -> path, status, params
    if (ctx.status !== 200 && config.isDevMode) {
      // 符合条件后，且在开发模式
      // ctx.throw()
      const codeMessage = {
        // 200: '服务器成功返回请求的数据。',
        201: '新建或修改数据成功。',
        202: '一个请求已经进入后台排队（异步任务）。',
        204: '删除数据成功。',
        400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
        401: '用户没有权限（令牌、用户名、密码错误）。',
        403: '用户得到授权，但是访问是被禁止的。',
        404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
        405: '请求方法不存在，请检查路由！',
        406: '请求的格式不可得。',
        410: '请求的资源被永久删除，且不会再得到的。',
        422: '当创建一个对象时，发生一个验证错误。',
        500: '服务器发生错误，请检查服务器。',
        502: '网关错误。',
        503: '服务不可用，服务器暂时过载或维护。',
        504: '网关超时。'
      }
      // 符合错误条件跳到catch
      ctx.throw({
        code: ctx.status,
        message: codeMessage[ctx.response.status]
      })
    }
  } catch (err) {
    // 只要有错误就会到这里，然后就是记录日志
    logger.error(`${ctx.url} ${ctx.method} ${err.status}: ${err.message} `)
    let user = ''
    if (ctx._id) {
      user = await User.findOne({ _id: ctx._id })
    }
    // 保存错误日志到数据库
    await ErrorRecord.create({
      message: err.message,
      code: err.status,
      method: ctx.method,
      path: ctx.path,
      param: ctx.method === 'GET' ? ctx.query : ctx.request.body,
      username: user.username,
      stack: err.stack
    })

    if (401 === err.status) {
      ctx.status = 401
      ctx.body = {
        code: 401,
        msg: 'Protexted resource, use Authorization header get access\n'
      }
    } else {
      ctx.status = err.status || 500
      ctx.body = Object.assign(
        {
          code: 500,
          msg: err.message
          // 错误端口调试方法
        },
        process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}
      )
    }
  }
}
