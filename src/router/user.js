const {login} = require('../controller/user')
const {SuccessModel, ErrorModel} = require('../model/resModel')
const { set } = require('../db/redis')

// 获取Cookie过期时间
const getCookieExpires = () => {
  const d = new Date()
  d.setTime(d.getTime() + (1000*60*60*24))
  return d.toGMTString()
}

const handleUserRouter = (req, res) => {
  const method = req.method 

  if (method === 'POST' && req.path === '/api/user/login') {
    const {username,password} = req.body
    // const {username, password} = req.query
    const result = login(username,password)
    return result.then(data => {
      if(data.username) {
        
        // cookie
        // res.setHeader("Set-Cookie", `username='${data.username}'; path=/; httpOnly; expires=${getCookieExpires()}`) // 设置path=/:cookie有效范围
        
        // session
        req.session.username = data.username
        req.session.realname = data.realname 
        console.log('sessionId is ',req.sessionId)
        // 同步redis
        set(req.sessionId,req.session)


        return new SuccessModel()
      }
      return new ErrorModel('登录失败')
    })
  }

  // if(method === 'GET' && req.path === '/api/user/login-test') {
  //   // if(req.cookie.username) {
  //   if(req.session.username) {
  //     return Promise.resolve(
  //       new SuccessModel({
  //         session: req.session
  //       })
  //     )
  //   }
  //   return Promise.resolve(new ErrorModel("尚未登录"));
  // }
}

module.exports = handleUserRouter