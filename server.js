var http = require('http');
var fs = require('fs');
var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var bodyParser = require('body-parser');
var request = require('request');
var access_token = null;
var refresh_token = null;

var server;
var mongoDBInstance;

const PORT = 1234;
var app = express();

// var allowCrossDomain = function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', 'example.com');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// };
//
// app.use(allowCrossDomain);
app.use(express.static(__dirname + '/resources'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

function getAccessToken(callback){
  if(access_token === null){
    request.post(
      "http://10.41.92.108:9005/oauth/token?grant_type=password&client_id=my-trusted-client&username=akshay.agarwal@unicommerce.com&password=uniware",
      {},
      function (error, response, body) {
        // console.log("status: ", response.statusCode, "body", body);
        console.log("type of login response",typeof body);
        access_token = (JSON.parse(body)).access_token;
        if(callback && typeof callback === "function"){
          callback();
        }
      }
    );
  } else {
    if(callback && typeof callback === "function"){
      callback();
    }
  }
}


app.get("/", function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/apis', function (req, res) {
  mongoDBInstance.collection('apis').find().toArray(function (err, result) {
    if (err) {
      console.log(err);
    } else if (result.length) {
      var final = {
        "apis": result
      };
      console.log('Found:', result);
    } else {
      console.log('No document(s) found with defined "find" criteria!');
    }
    res.json(final);
  });
});

app.post('/api/add', function (req, res) {
  var row = req.body;
  if (row && row.apiname) {
    mongoDBInstance.collection('apis').insertOne(row);
    res.json({'success': true});
  } else {
    res.json({'success': false});
  }
});

app.get('/yo', function (req, res) {
  getAccessToken(function(){
    console.log("accesstoken", access_token);
    request(
      {
        url: 'http://10.41.92.108:8080/batch',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': access_token
        }
      },
      function (error, response, body) {
        // console.log("status: ", response.statusCode, "body", body);
        res.json(JSON.parse(body));
      }
    );
  });

});

app.post('/api/sync', function(req, res){
  var syncData = req.body;
  switch(syncData.type){
    case 'GET':
      getAccessToken(function(){
        request(
          {
            url: syncData.uri,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': access_token
            }
          },
          function (error, response, body) {
            // console.log("status: ", response.statusCode, "body", body);
            res.json(JSON.parse(body));
          }
        );
      });
      break;
    case 'POST':
      getAccessToken(function(){
        request.post(
          {
            url: syncData.uri,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': access_token
            }
          },
          syncData.req,
          function (error, response, body) {
            // console.log("status: ", response.statusCode, "body", body);
            res.json(JSON.parse(body));
          }
        );
      });
      break;
  };
});

app.post('/api/edit/:id', function (req, res) {
  var rowId = req.params.id;
  var newRow = req.body;
  if (newRow && newRow.apiname) {
    mongoDBInstance.collection('apis').update({
      '_id': ObjectId(rowId)
    }, newRow);
    res.json({'success': true});
  } else {
    res.json({'success': false});
  }
});

app.post('/api/delete/:id', function (req, res) {
  var rowId = req.params.id;
  mongoDBInstance.collection('apis').remove({
    "_id": ObjectId(rowId)
  });
  res.json({'success': true});
});

app.get('/*', function (req, res) {
  console.log(req.originalUrl);
  // var queryUrl = req.originalUrl.slice(4);
  var queryUrl = req.originalUrl;
  var queriedRecord = mongoDBInstance.collection('apis').find({'apiname': queryUrl});
  queriedRecord.toArray(function (err, result) {
    if (err) {
      console.log(err);
      res.send();
    } else if (result.length) {
      console.log('Found:', result);
      res.json(result[0].resp);
    } else {
      console.log('No document(s) found with defined "find" criteria!');
      res.send();
    }
  });
});

app.post('/*', function (req, res) {
  console.log(req.originalUrl);
  var queryUrl = req.originalUrl;
  var queriedRecord = mongoDBInstance.collection('apis').find({'apiname': queryUrl});
  queriedRecord.toArray(function (err, result) {
    if (err) {
      console.log(err);
      res.send();
    } else if (result.length) {
      console.log('Found:', result);
      res.json(result[0].resp);
    } else {
      console.log('No document(s) found with defined "find" criteria!');
      res.send();
    }
  });
});

app.listen(PORT, function () {
  console.log('Example app listening on port 1234!');
  var url = 'mongodb://10.41.92.110:27017/olpdummy';
  MongoClient.connect(url, function (err, db) {
    console.log("Connected correctly to server.");
    mongoDBInstance = db;
    // db.collection('test1').insertOne({
    //   "name": "hi",
    //   "list": [1,2]
    // }, function(err, result){
    //   console.log("error: ", err);
    //   console.log("Inserted a document into the restaurants collection.");
    // });
    // db.close();
  });
});


//
// function handleRequest(request, response) {
//
//   try {
//     dispatcher.dispatch(request, response);
//
//     dispatcher.setStatic('resources');
//
//     dispatcher.onGet("/", function (req, res) {
//       res.writeHead(200, {'Content-Type': 'text/html'});
//       res.write(indexTemplate);
//       res.end();
//     });
//
//     dispatcher.onGet("/apis", function (req, res) {
//       res.writeHead(200, {'Content-Type': 'application/json'});
//       mongoDBInstance.collection('apis').find().toArray(function(err, result){
//         if (err) {
//           console.log(err);
//         } else if (result.length) {
//           var final = {
//             "apis": result
//           };
//           console.log('Found:', result);
//         } else {
//           console.log('No document(s) found with defined "find" criteria!');
//         }
//         res.write(JSON.stringify(final));
//         res.end();
//       });
//
//     });
//
//     dispatcher.onPost("/post1", function (req, res) {
//       res.writeHead(200, {'Content-Type': 'text/plain'});
//       res.end('Got Post Data');
//     });
//
//   } catch (err) {
//     console.log(err);
//   }
//
// }
//
// fs.readFile('./index.html', function(err, html){
//
//   indexTemplate = html;
//
//   server = http.createServer(handleRequest);
//
//   server.listen(PORT, function () {
//     console.log("Server listening on: http://localhost:%s", PORT);
//
//     var url = 'mongodb://localhost:27017/olpdummy';
//     MongoClient.connect(url, function(err, db) {
//       console.log("Connected correctly to server.");
//       mongoDBInstance = db;
//       // db.collection('test1').insertOne({
//       //   "name": "hi",
//       //   "list": [1,2]
//       // }, function(err, result){
//       //   console.log("error: ", err);
//       //   console.log("Inserted a document into the restaurants collection.");
//       // });
//       // db.close();
//     });
//
//   });
//
// });