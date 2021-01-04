import path from 'path'
const DB_URL = 'mongodb://root:example@122.51.156.210:27017/admin'
const JWT_SECRET = '1234567890'

const REDIS = {
  host: '122.51.156.210',
  port: 15001
}
// 返回前端的基础地址
const baseUrl =
  process.env.NODE_ENV === 'production'
    ? 'http://122.51.156.210:22500'
    : 'http://localhost:8080'

// 上传图片后的根目录文件路径
const uploadPath =
  process.env.NODE_ENV === 'production'
    ? '/app/public'
    : path.join(path.resolve(__dirname), '../../public')

// 设置超级管理员
const adminEmail = ['646380243@qq.com']

// 返回公共路径
const publicPath = [
  /^\/public/,
  /^\/login/,
  /^\/user/,
  /^\/comments/,
  /^\/content/
]

const isDevMode = process.env.NODE_ENV !== 'production'

const port = isDevMode ? 3000 : 12500

export default {
  DB_URL,
  REDIS,
  JWT_SECRET,
  baseUrl,
  uploadPath,
  adminEmail,
  publicPath,
  isDevMode,
  port
}
