var http = require('http')
  , app = http.createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url')
  , clients = {}
  , clientsReverse = {}
  , controls = {}
  , controlsReverse = {}
  , template = require('swig')
  , os = require('os')

var index_page = template.compileFile(__dirname+'/index.html')
var remote_page = template.compileFile(__dirname+'/remote.html')
var port_number = 9999;

var local_address = function(){
    var ifaces=os.networkInterfaces();
    var result = 'http://localhost:'+port_number;
    for (var dev in ifaces) {
      var alias=0;
      ifaces[dev].forEach(function(details){
        if (details.family==='IPv4' && details.address!=='127.0.0.1' && details.address!=='localhost') {
          console.log(details.address);
          result = 'http://'+details.address+':'+port_number;
          return;
        } else  
          ++alias;
      });
    }
    return result;
}();

console.log('target ip address: '+local_address);

  
app.listen(port_number);

function handler (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var pathname = url_parts.pathname;
  
  res.writeHead("Content-Type", "text/html")
  res.writeHead(200);
  if(pathname === '/' || pathname==='index.html') {
    res.end(index_page.render({
        local_address: local_address
    }));
  } else if(pathname == '/remote.html'){
      res.end(remote_page.render({
        local_address: local_address
      }));
  } else {
    res.writeHead(404);
    res.end();
  }
  
}

var randomID= function() {
  var from = 1000;
  var to = 9999;
  return Math.floor(Math.random()*(to-from+1)+from);
}

io.sockets.on("connection", function(socket){
  socket.on("screen_connect", function(data, fn){
    var id = data.screen_id;
    if(id in clients){
      if(! (id in controlsReverse)){
        controlsReverse[id] = socket.id;
        controls[socket.id] = id;
        fn(true);
      } else {
        console.log("#######")
        fn(false);
      }
    } else {
      console.log("*******")
      fn(false);
    }
  });
  
  socket.on("get_id", function(fn){
    var id = randomID();
    while(id in clients) {
      id = randomID();
    }
    clients[id] = true
    socket.join(id);
    fn(id); 
  });
  
  socket.on("msg", function(data){
    var id = controls[socket.id]
    if(clients[id] != null || clients[id] != 'undefined') {
      io.sockets.in(data.screenId).emit("msg", data);
    }
  });
});
