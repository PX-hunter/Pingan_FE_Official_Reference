const redis = require('redis')
const { REDIS_CONF } = require('../conf/db')

const redisClient = redis.createClient(REDIS_CONF.port, REDIS_CONF.host);
redisClient.on('error', err => {
  console.log(err)
})

function set(key, val) {
  if(typeof val === 'object'){
    console.log('redis val',val)
    console.log("redis key", key);
    val = JSON.stringify(val)
  }
  redisClient.set(key, val, redis.print)
}

function get(key) {
   const promise = new Promise((res,rej) => {
    redisClient.get(key,(err,val) => {
      if(err) {
        rej(err)
        return
      }
      if(val == null) {
        res(null)
        return 
      }
      try{
        res(JSON.parse(val))
      }catch(ex){
        rej(ex)
      }
    })
   })
   return promise
}

module.exports = {
  get,
  set
}

