var path = require('path');
var http = require('http');
var fs = require('fs')

const dir = path.join(__dirname, 'public/assets/');

var server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  switch (req.method) {
    case 'GET':
      return handleGetRequest(req, res);
    case 'POST':
      return handlePostRequest(req, res);
    case 'OPTIONS':
      return handleOptionsRequest(res);
    default:
      //Request method not supported
      res.statusCode = 501;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Method not implemented');
  }
});

server.listen(3001, function () {
  console.log('Listening on http://localhost:3001/');
});

/**
 * Handles an HTTP GET request and returns a response.
 * 
 * @param {http.ClientRequest} req HTTP request object
 * @param {http.ServerResponse} res HTTP response object 
 * @returns {http.ServerResponse} The result of calling res.end(...)
 */
function handleGetRequest(req, res) {
  const reqpath = req.url.toString().split('?')[0];
  
  if (reqpath.length === 0 || reqpath === '/' || reqpath === '\\') {
    return constructForbiddenResponse(res);
  }

  //Only support PNG images
  const type = 'image/png';

  const file = path.join(dir, reqpath);
  //Try to open the file and serve it
  const s = fs.createReadStream(file);
  s.on('open', function () {
      res.setHeader('Content-Type', type);
      s.pipe(res);
  });

  //Return an error if we couldn't find the files
  s.on('error', function () {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 404;
      res.end('Not found');
  });
}

/**
 * Handles an HTTP POST request and returns a response.
 * 
 * @param {http.ClientRequest} req HTTP request object
 * @param {http.ServerResponse} res HTTP response object 
 * @returns {http.ServerResponse} The result of calling res.end(...)
 */
function handlePostRequest(req, res) {
  const reqPath = req.url.toString().split('?')[0];
  const requestEndpoint = reqPath.substring(1);
  if (requestEndpoint === 'GetArtGalleryInfo') {
    handleGetArtGalleryInfo(res)
  } else {
    return constructForbiddenResponse(res);
  }
}

/**
 * Handles an HTTP OPTIONS request and returns a response.
 * An OPTIONS request may come in as a pre-flight CORS request, for example.
 * 
 * @param {http.ClientRequest} req HTTP request object
 * @param {http.ServerResponse} res HTTP response object 
 * @returns {http.ServerResponse} The result of calling res.end(...)
 */
function handleOptionsRequest(res) {
  res.statusCode = 200;
  return res.end();
}

/**
 * Handles a 'GetArtGalleryInfo' POST request from the client.
 * Gets a list of asset filenames (images) and returns them
 * alongside a displayname for them.
 * 
 * @param {http.ClientRequest} res HTTP request object
 * @returns {http.ServerResponse} The result of res.end(...)
 */
function handleGetArtGalleryInfo(res) {
  const files = fs.readdirSync(dir);
  const imageDisplayData = [];
  files.forEach((file) => {
    imageDisplayData.push({
      imageSource: file,
      artTitle: filenameToArtTitle(file)
    });
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(imageDisplayData));
}

/**
 * Constructs an HTTP forbidden response for requests we don't allow.
 * 
 * @param {http.ClientRequest} res HTTP request object
 * @returns {http.ServerResponse} The result of res.end(...)
 */
function constructForbiddenResponse(res) {
  res.statusCode = 403;
  res.setHeader('Content-Type', 'text/plain');
  return res.end('Forbidden');
}

/**
 * Given a filename, converts it to an art title for user display.
 * 
 * @param {string} filename the name of an image (artwork)
 * @returns {string} A title based on the filename
 */
function filenameToArtTitle(filename) {
  return filename.substring(0, filename.length-4).replace(/_/g, " ");
}