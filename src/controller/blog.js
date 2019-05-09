const {exec} = require('../db/mysql')
const xss = require('xss')

const getList = (author, keyword) => {
  let sql = `select * from blogs where 1=1 `  // 防止查询条件为空
  if(author){
    sql += `and author='${author}' `
  }  
  if(keyword){
    sql += `and title like '%${keyword}%'`
  }
  sql += `order by createtime desc;`
  return exec(sql)
}

const getDetail = (id) => {
  const sql = `select * from blogs where id='${id}'`
  return exec(sql).then(rows => {
    return rows[0]
  })
}

const newBlog = (blogData={}) => {
  let {title,content,author} = blogData
  title = xss(title)
  const createTime = Date.now()
  const sql = `
  insert into blogs (title,content,createtime,author)
  values ('${title}','${content}',${createTime},'${author}')
  `
  return exec(sql).then(insertData => {
    return {
      id: insertData.insertId
    }
  })
}

const updateBlog = (id, blogData={}) => {
  const {title,content} = blogData
  const sql = `
  update blogs set title='${title}',content='${content}' where id=${id}
  `
  return exec(sql).then(updateData => {
    if(updateData.affectedRows > 0){
      return true
    }
    return false
  })
}

const delBlog = (id,author) => {
  const sql = `delete from blogs where id='${id}' and author='${author}'`
  return exec(sql).then(delData => {
    if (delData.affectedRows > 0) {
      return true
    }
    return false
  })
}

module.exports = {
  getList,
  getDetail,
  newBlog,
  updateBlog,
  delBlog
};