// borrows from example at https://github.com/senchalabs/connect

const connect = require('connect');
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

const app = connect();
const session = require('express-session');
const cookies = require('cookie-parser');

app.use(session({ secret: 'cscie31', resave: 'true', cookie: { maxAge: 60000 }}));
app.use(cookies());

// respond to all requests
app.use(function(req, res){
	console.log(req.url);

  // parse the URL into its component parts
	const parsedUrl = url.parse(req.url, true);
  // extract the pathname and query properties
	const { pathname, query } = parsedUrl;
  // Create an absolute path to the requested file.
	// Assume the server was started from the webroot
	const absolute_path_to_file = path.join(process.cwd(), pathname);

	fs.readFile(absolute_path_to_file, (err, data) => {
		  if (err) {
	      console.log(err);
	      if (err.code == 'ENOENT'){
	        // file does not exist - we should return a 404 status code
					console.log('404 error getting ' + pathname);
					res.writeHead(404);
					res.end('404: Page Not Found!');
	      } else if (err.code == 'EISDIR'){
	        // this is actually a directory - we should create a directory listing
					console.log('directory listing ' + pathname);
					fs.readdir(absolute_path_to_file, (err, files)=>{
						if (err) {
							res.writeHead(500);
							res.end('Server Error 500');
						}
						let s = '<b>Directory Listing</b><br>';
						files.forEach((i)=>{
							s += (i + "<br>");
						});
						res.writeHead(200);
						res.end(s, 'utf8');
					});
	      }
	    } else {
        // check for a session 'views' property
        //  increment it if it exists
        //  initialize it to 1 if it does not
        if (req.session.views) {
          req.session.views++
        } else {
          req.session.views = 1;
        }

				let views = req.cookies.views || 0;
				res.setHeader('Set-Cookie', 'views='+ ++views);
				console.log("Session ID is %s, number visits this session: %s, number visits all-time %s", req.session.id, req.session.views, views);

        // If we get to here, 'data' should contain the contents of the file
        res.writeHead(200);
				res.end(data, 'binary', ()=>{
					console.log("file delivered: " + pathname);
				});
		}
	});
});
//create node.js http server and listen on port
http.createServer(app).listen(8080);
console.log("listening on port 8080");
