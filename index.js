const http = require('http');
const fs = require('fs');
const util = require('util');

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

(async () => {
  const server = http.createServer(async (req, res) => {
    const { method, url } = req;
    const body = await getBody(req);

    if (url == '/') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      const homeContent = await readFile(`${__dirname}/index.html`);
      res.end(homeContent);
    } else if (url === '/feed') {
      res.setHeader('Content-Type', 'application/json');

      const { imgData, digit } = body;
      if (!imgData || !digit) {
        res.statusCode = 400;
        res.end(JSON.stringify({ status: 'bad request' }));
        return;
      }
      res.statusCode = 200;
      const row = await knex('digits')
        .insert({ digit, image: JSON.stringify(imgData) }, ['id', 'digit']);
      res.end(JSON.stringify(row));
    } else if (url === '/digits/') {

    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end('<html><body>Not found</body></html>');
    }
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
