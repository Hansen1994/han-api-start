import mongoose from '../config/DBHelper'
import moment from 'dayjs'
// import CommentsHands from './CommentsHands'

const Schema = mongoose.Schema

const CommentsSchema = new Schema(
  {
    tid: { type: String, ref: 'posts' }, // 帖子id
    uid: { type: String, ref: 'users' }, // 文章作者ID
    cuid: { type: String, ref: 'users' }, // 评论用户的ID
    content: { type: String },
    hands: { type: Number, default: 0 },
    status: { type: String, default: '1' },
    isRead: { type: String, default: '0' },
    isBest: { type: String, default: '0' }
  },
  { toJSON: { virtuals: true }, timestamps: { createdAt: 'created', updatedAt: 'updated' } }
)

CommentsSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

CommentsSchema.statics = {
  findByTid: function (id) {
    return this.find({ tid: id })
  },
  findByCid: function (id) {
    return this.findOne({ _id: id })
  },
  getCommentsList: function (id, page, limit) {
    return this.find({ tid: id })
      .populate({
        path: 'cuid', // 评论的用户id
        select: '_id name pic isVip',
        match: { status: { $eq: '0' } }
      })
      .populate({
        path: 'tid',
        select: '_id title status'
      })
      .skip(page * limit)
      .limit(limit) //skip()方法作用:跳过前面几条数据，limit()方法作用:限制只取几条数据
  },
  queryCount: function (id) {
    // 获取总数
    return this.find({ tid: id }).countDocuments()
  },
  // 获取评论
  getCommetsPublic: function (id, page, limit) {
    return this.find({ cuid: id })
      .populate({
        path: 'tid',
        select: '_id title content'
      })
      .skip(page * limit)
      .limit(limit)
      .sort({ created: -1 })
  },
  // 获取消息列表(重要接口)
  getMsgList: function (id, page, limit) {
    return this.find({
      // uid为本用户
      uid: id,
      // $ne为不等于,就是说cuid的值不等于id才显示，cuid为其他用户
      cuid: { $ne: id },
      // 未读状态
      isRead: { $eq: '0' },
      // 是否显示这条记录(只显示status=1的)
      status: { $eq: '1' }
    })
      .populate({
        path: 'tid',
        select: '_id title content'
      })
      .populate({
        // 被传递消息者(帖子主人)
        path: 'uid',
        select: '_id name'
      })
      .populate({
        // 评论者
        path: 'cuid',
        select: '_id name'
      })
      .skip(limit * page)
      .limit(limit)
      .sort({ created: -1 })
  },
  // 获取未阅读总数
  getTotal: function (id) {
    return this.find({ uid: id, isRead: '0', status: '1' }).countDocuments()
  },
  // 获取热门评论
  getHotComments: function (page, limit, index) {
    if (index === '0') {
      // 总评论记数 -> aggregate聚合查询
      return this.aggregate([
        // 匹配30天内的评论数据
        { $match: { created: { $gte: new Date(moment().subtract(30, 'day')) } } },
        { $group: { _id: '$cuid', count: { $sum: 1 } } },
        // 字面意思是添加字段，就是在查询的结果再添加一些字段信息(添加userID字段)，$toObjectId将$_id转换
        { $addFields: { userId: { $toObjectId: '$_id' } } },
        // 聚合几个字段组合
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'cuid' } },
        { $unwind: '$cuid' },
        { $project: { cuid: { name: 1, _id: 1, pic: 1 }, count: 1 } },
        { $skip: page * limit },
        { $limit: limit },
        // 倒序
        { $sort: { count: -1 } }
      ])
    } else if (index === '1') {
      // 最新评论
      return this.find({})
        .populate({
          path: 'cuid',
          select: 'name pic _id'
        })
        .skip(page * limit)
        .limit(limit)
        .sort({ created: -1 })
    }
  },
  // 获取总数
  getHotCommentsCount: async function (index) {
    if (index === '0') {
      // 总评论记数 -> aggregate聚合查询
      const result = await this.aggregate([
        // 匹配30天内的评论数据
        { $match: { created: { $gte: new Date(moment().subtract(30, 'day')) } } },
        { $group: { _id: '$cuid', count: { $sum: 1 } } },
        { $group: { _id: 'null', total: { $sum: 1 } } }
      ])
      return result[0].total
    } else if (index === '1') {
      // 最新评论,获取总数
      return this.find({}).countDocuments()
    }
  }
}

const Comments = mongoose.model('comments', CommentsSchema)

export default Comments
