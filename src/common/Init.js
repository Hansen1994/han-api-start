import config from '../config/index'
import User from '../model/User'
import { setValue } from '../config/RedisConfig'

export const run = async () => {
  if (config.adminEmail && config.adminEmail.length > 0) {
    const emails = config.adminEmail
    const arr = []
    for (let email of emails) {
      const user = await User.findOne({ username: email })
      arr.push(user._id)
    }
    // 存入超级管理员数组
    setValue('admin', JSON.stringify(arr))
  }
}
