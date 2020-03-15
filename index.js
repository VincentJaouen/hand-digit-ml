const http = require('http');
const fs = require('fs');
const util = require('util');
const _ = require('lodash');

const knex = require('./knex');

const port = 3000;

const readFile = util.promisify(fs.readFile);

const getBody = (req) => {
  return new Promise(resolve => {
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        console.error(`Could not parse body ${body}`);
        parsed = body;
      }
      resolve(parsed);
    });
  });
};

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
const renderView = async (view, ctx = {}, res, statusCode = 200) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/html');
  const viewContent = await readFile(`./views/${view}.html`);
  const content = _.template(viewContent)(ctx);
  res.end(content);
};

const renderJson = (data = {}, res, statusCode = 200) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

(async () => {
  const server = http.createServer(async (req, res) => {
    const { method, url } = req;
    const body = await getBody(req);

    if (url == '/') {
      const data = await knex('digits').select('digit').count().groupBy('digit');
      const ones = await knex('digits').where({ digit: 1 });
      return renderView('index', { data, ones: JSON.stringify(ones) }, res);
    } else if (url === '/feed') {
      const { imgData, digit } = body;
      if (!imgData || !digit || digit > 9) {
        return renderJson({ status: 'bad request' }, res, 400);
      }
      const row = await knex('digits')
        .insert({ digit, image: JSON.stringify(imgData) }, ['id', 'digit']);
      return renderJson(row, res);
    } else if (url.startsWith('/digits/')) {
      // const match = url.match('^\/digits\/(\d)$');
      const match = url.match('^\/digits\/([0-9]+)$');
      if (match) {
        const [id] = match;
        const row = await knex('digits').where({ id }).first();
        if (row) {
          return renderJson(row, res);
        }
        return renderJson({}, res, 404);
      }
    }

    return renderView('404', {}, res, 404);
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
