const querystring = require('querystring')
const handleBlogRouter = require('./src/router/blog')
const handleUserRouter = require('./src/router/user')
const { get, set } = require('./src/db/redis')
const { access } = require('./src/utils/log')

/*
session数据
const SESSION_DATA = {}
*/ 


//  用于处理post data
const getPostData = (req) => {
  const promise = new Promise((res, rej) => {
    if(req.method !== 'POST'){
      res({})
      return
    }
    if (req.headers['content-type'] !== "application/json") {
      res({})
      return
    }
    let postData = ''
    req.on('data', chunk => {
      postData += chunk.toString()
    })
    req.on('end', () => {
      if(!postData) {
        res({})
        return
      }
      res(JSON.parse(postData))
    })
  })
  return promise
}

const serverHandle = (req, res) => {
  // 纪录access log
  access(`${req.method}---${req.url}---${req.headers['user-agent']}`)

  //  设置返回格式
  res.setHeader('Content-type', 'application/json')

  //  获取path
  const url = req.url
  req.path = url.split('?')[0]

  //  解析query：全局的处理都放在app.js
  req.query = querystring.parse(url.split('?')[1])

  // 解析cookie
  req.cookie = {}
  const cookieStr = req.headers.cookie || ''
  cookieStr.split(';').forEach(item => {
    if(!item) {
      return 
    }
    const arr = item.split('=')
    const key = arr[0].trim()
    const val = arr[1].trim()
    req.cookie[key] = val 
  })

  /*
  解析session
  let needSetCookie = false     //    如果没有useId，不仅需要设置SESSION_DATA[userId] = userId，还需要同步到cookie中，需要一个变量控制  
  let userId = req.cookie.userid
  if(userId) {
    if(!SESSION_DATA[userId]) {
      SESSION_DATA[userId] = {}
    }
  } else {
    needSetCookie = true
    userId = `${Date.now()}_${Math.random()}`
    SESSION_DATA[userId] = {}
  }
  req.session = SESSION_DATA[userId]
  */ 
  //  解析session（使用redis）
  let needSetCookie = false
  let userId = req.cookie.userid
  if(!userId) {
    needSetCookie = true
    userId = `${Date.now()}_${Math.random()}`
    // 初始化redis中的session值
    console.log('first id', userId)
    set(userId,{})
  }  
  // 获取session
  req.sessionId = userId
  get(req.sessionId).then(sessionData => {
    if(sessionData == null){
      // 初始化redis中的session值
      set(req.sessionId, {})
      req.session = {}
    }else{
      req.session = sessionData
    }
    //  处理post data
    return getPostData(req)
  }).then(postData => {
    req.body = postData

    // 处理路由（先处理post data，因为其异步）
    // const blogData = handleBlogRouter(req, res);
    // if (blogData) {
    //   res.end(JSON.stringify(blogData));
    //   return;
    // }
    // 异步查询数据库
    const blogResult = handleBlogRouter(req, res)
    if(blogResult) {
      if(needSetCookie){
        res.setHeader(
          "Set-Cookie",
          `userid='${
            userId
          }'; path=/; httpOnly;`
        );
      }
      blogResult.then(blogData => {
        res.end(JSON.stringify(blogData))
      })
      return
    }
    
    // const userData = handleUserRouter(req, res)
    // if (userData) {
    //   res.end(
    //     JSON.stringify(userData)
    //   )
    //   return
    // }
    const userResult = handleUserRouter(req, res);
    if(userResult) {
      if (needSetCookie) {
        res.setHeader(
          "Set-Cookie",
          `userid=${userId}; path=/; httpOnly;}`
        );
      }
      userResult.then(userData => {
        res.end(
          JSON.stringify(userData)
        )
      })
      return 
    }

    //  未命中路由，显示404
    res.writeHead(404, { 'Content-type': 'text/plain' })
    res.write('404 not found\n')
    res.end()
  }).catch(e=>{
    console.log('error', e)
  })

}

module.exports = serverHandle 