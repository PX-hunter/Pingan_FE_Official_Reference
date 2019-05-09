const { exec,escape } = require('../db/mysql')

const login = (username, password) => {
  username = escape(username)
  password = escape(password)
  const sql = `
  select username, realname from users where username=${username} and password=${password}
  `
  console.log(123)
  return exec(sql).then(rows => {
    return rows[0] || {}
  })
}

module.exports = {
  login
}
