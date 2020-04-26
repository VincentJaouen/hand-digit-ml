const http = require('http');
const _ = require('lodash');

const { readFile } = require('./utils');
const NeuralNetwork = require('./neural-network');
const knex = require('./knex');

const port = 80;

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
  const neuralNetwork = await NeuralNetwork.loadFromMinFile(`./theta/min-5`,50 * 50, 25, 10);
  const server = http.createServer(async (req, res) => {
    const { method, url } = req;
    const body = await getBody(req);

    if (method === 'GET' && url == '/') {
      const data = await knex('digits').select('digit').count().groupBy('digit');
      const samples = await knex('digits').orderByRaw('random()').limit(10);
      const totalSet = data.reduce((count, digit) => count += parseInt(digit.count, 10), 0);
      return renderView('index', {data, totalSet,samples: JSON.stringify(samples)}, res);
    } else if (method === 'POST' && url === '/predict') {
      const { imgData } = body;
      if (!imgData) {
        return renderJson({ status: 'bad request' }, res, 400);
      }
      const prediction = neuralNetwork.predictMatrix(imgData);
      return renderJson({ prediction }, res);
    } else if (method === 'POST' && url === '/feed') {
      const { imgData, digit } = body;
      if (!imgData || !digit || digit > 9) {
        return renderJson({ status: 'bad request' }, res, 400);
      }
      const prediction = neuralNetwork.predictMatrix(imgData);
      const row = await knex('digits')
        .insert({ digit, image: JSON.stringify(imgData) }, ['id', 'digit']);
      return renderJson({ row, prediction }, res);
    } else if (url.startsWith('/digits/')) {
      // const match = url.match('^\/digits\/(\d)$');
      const match = url.match('^\/digits\/([0-9]+)(.*)$');
      if (match) {
        const [,id, format] = match;
        const row = await knex('digits').where({ id }).first();
        if (method === 'PATCH') {
          await knex('digits').update(body).where({ id });
          Object.assign(row, body);
        }
        if (row) {
          if (format === '.html') {
            return renderView('digit', { row }, res);
          }
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
