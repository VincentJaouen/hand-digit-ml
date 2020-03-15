const config = require('config');

const dbConf = config.get('database');
module.exports = {
  client: dbConf.client,
  connection: {
    host : dbConf.host,
    user : dbConf.user,
    password : dbConf.password,
    database : dbConf.database,
  },
};
