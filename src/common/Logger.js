import log4js from '../config/Log4j'

const logger = log4js.getLogger('application')

export default async (ctx, next) => {
  const start = Date.now()
  // 洋葱模型
  // next() 是说，让所有的其他中间件都执行完再执行next()下面的
  next()
  // 所以可以获取到时间
  const resTime = Date.now() - start
  // 判断系统的执行效率
  if (resTime / 1000 > 1) {
    logger.warn(`[${ctx.method}] - ${ctx.url} - time: ${resTime / 1000}s`)
  }
}
