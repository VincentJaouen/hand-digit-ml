const http = require('http');
const fs = require('fs');
const util = require('util');

const port = 3000;

const readFile = util.promisify(fs.readFile);

const getBody = (req) => {
  return new Promise(resolve => {
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      resolve(body);
    });
  });
};

(async () => {
  const server = http.createServer(async (req, res) => {
    const { method, url } = req;

    let body;
    if (method === 'POST') {
      body = await getBody(req);
    }

    if (url == '/') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      const homeContent = await readFile(`${__dirname}/index.html`);
      res.end(homeContent);
    } else if (url === '/feed') {
      console.log('FEED', method, url, body);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end('{}');
    } else {
      console.log(method, url, body);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end('<html><body>Not found</body></html>');
    }
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
