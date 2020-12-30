import ErrorRecord from '../model/ErrorRecord'
import qs from 'qs'

class ContentController {
  async getErrorList(ctx) {
    const params = ctx.query
    console.log(params)
    // const query = {}

    // 获取method(get/post)的数组,[ { _id: 'GET' } ]
    const methodFilter = await ErrorRecord.aggregate([
      { $group: { _id: '$method' } },
      { $sort: { _id: 1 } }
    ])
    // console.log('methodFilter', methodFilter)
    // code(404/500)的数组,[ { _id: '404' }, { _id: '500' } ]
    const codeFilter = await ErrorRecord.aggregate([
      { $group: { _id: '$code' } },
      { $sort: { _id: 1 } }
    ])
    // console.log('codeFilter', codeFilter)

    // 需要筛选的method和code
    const obj = qs.parse(params)
    console.log(obj)
    // console.log('obj', obj)
    const query = obj.filter ? { ...obj.filter } : {}
    // console.log('query', query)
    if (query.method) {
      // 相当于{ method: /get/i }
      query.method = { $regex: query.method, $options: 'i' }
    }
    if (query.code) {
      // 相当于{ method: /get/i }
      query.code = { $regex: query.code, $options: 'i' }
    }
    console.log(query)
    // 分页
    const page = params.page ? parseInt(params.page) : 0
    const limit = params.limit ? parseInt(params.limit) : 10
    // { code: /404/i }
    const result = await ErrorRecord.find(query)
      .skip(page * limit)
      .limit(limit)
      .sort({ created: -1 })

    // query为{ }查询全部
    const total = await ErrorRecord.find(query).countDocuments()

    ctx.body = {
      code: 200,
      msg: '查询成功',
      data: result,
      total: total,
      filter: {
        method: methodFilter.map((o) => {
          return {
            label: o._id,
            value: o._id
          }
        }),
        code: codeFilter.map((o) => {
          return {
            label: o._id,
            value: parseInt(o._id)
          }
        })
      }
    }
  }
  async deleteError(ctx) {
    const { body } = ctx.request
    console.log(body.ids.ids)
    const result = await ErrorRecord.deleteMany({ _id: { $in: body.ids.ids } })
    ctx.body = {
      code: 200,
      msg: '删除成功',
      data: result
    }
  }
  async addError(ctx) {
    const { body } = ctx.request
    const error = new ErrorRecord(body)
    const result = await error.save()
    ctx.body = {
      code: 200,
      data: result,
      msg: '添加成功'
    }
  }
}

export default new ContentController()
