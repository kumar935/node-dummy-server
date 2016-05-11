var http = require('http');
var fs = require('fs');
var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var bodyParser = require('body-parser');
var request = require('request');
var access_token = null;

var server;
var mongoDBInstance;

const PORT = 1234;
var app = express();

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'example.com');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};
// app.use(allowCrossDomain);
app.use(express.static(__dirname + '/resources'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

function getAccessToken(callback) {
  if (access_token === null) {
    request.post(
      "http://10.41.92.108:9005/oauth/token?grant_type=password&client_id=my-trusted-client&username=akshay.agarwal@unicommerce.com&password=uniware",
      {},
      function (error, response, body) {
        access_token = (JSON.parse(body)).access_token;
        if (callback && typeof callback === "function") {
          callback();
        }
      }
    );
  } else {
    if (callback && typeof callback === "function") {
      callback();
    }
  }
}

//functionality endpoints
function getIndex(req, res) {
  res.sendFile(__dirname + '/index.html');
}
function getProjects(req, res) {
  //http://stackoverflow.com/a/30647605/3248247
  mongoDBInstance.listCollections().toArray(function (err, result) {
    if (err) {
      res.send({'error': err});
    } else if (result.length) {
      var projects = result.filter(function (item) {
        return (item.name !== "system.indexes");
      });
      var final = {
        "projects": projects
      };
      res.json(final);
    } else {
      res.send({'error': 'No document(s) found with defined "find" criteria!'});
    }
  });
}
function addProject(req, res) {
  var name = req.params.name;
  mongoDBInstance.createCollection(name, null, function (err) {
    res.send({"success": true, "err": err});
  });

}
function removeProject(req, res) {
  var name = req.params.name;
  mongoDBInstance.collection(name).drop(function (err) {
    res.json({"success": true, "error": err});
  })
}
function getApis(req, res) {
  var project = req.params.project;
  mongoDBInstance.collection(project).find().toArray(function (err, result) {
    if (err) {
      res.json({"error": err});
    } else if (result.length) {
      var final = {
        "apis": result
      };
      res.json(final);
    } else {
      res.json({
        "apis": []
      });
    }
  });
}
function addApi(req, res) {
  var project = req.params.project;
  var row = req.body;
  if (row && row.apiname) {
    mongoDBInstance.collection(project).insertOne(row);
    res.json({'success': true});
  } else {
    res.json({'success': false});
  }
}
function editApi(req, res) {
  var project = req.params.project;
  var rowId = req.params.id;
  var newRow = req.body;
  if (newRow && newRow.apiname) {
    mongoDBInstance.collection(project).update({
      '_id': ObjectId(rowId)
    }, newRow);
    res.json({'success': true});
  } else {
    res.json({'success': false});
  }
}
function deleteApi(req, res) {
  var project = req.params.project;
  var rowId = req.params.id;
  mongoDBInstance.collection(project).remove({
    "_id": ObjectId(rowId)
  });
  res.json({'success': true});
}
function syncApi(req, res) {
  var syncData = req.body;
  switch (syncData.type) {
    case 'GET':
    case 'DELETE':
    case 'COPY':
    case 'LINK':
    case 'UNLINK':
      getAccessToken(function () {
        request(
          {
            url: syncData.uri,
            method: syncData.type,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': access_token
            }
          },
          function (error, response, body) {
            res.json(JSON.parse(body));
          }
        );
      });
      break;
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'HEAD':
    case 'OPTIONS':
    case 'PURGE':
      getAccessToken(function () {
        request(
          {
            url: syncData.uri,
            method: syncData.type,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': access_token
            },
            json: syncData.postData
          },
          function (error, response, body) {
            console.log("GETTING ACCESS TOKEN, error: ", error, "body: ", body);
            res.json(body);
          }
        );
      });
      break;
  }
}
function simpleResponse(req, res) {
  var project = req.params.project;
  console.log(req.originalUrl);
  var queryUrl = "/" + req.originalUrl.split("/").splice(2).join("/");
  var queriedRecord = mongoDBInstance.collection(project).find({'apiname': queryUrl});
  queriedRecord.toArray(function (err, result) {
    if (err) {
      res.send({"error": err});
    } else if (result.length) {
      res.json(result[0].resp);
    } else {
      res.send({"message":"No document(s) found with defined 'find' criteria!" });
    }
  });
}

app.get('/', getIndex);
app.get('/projects', getProjects);
app.post('/project/add/:name', addProject);
app.post('/project/remove/:name', removeProject);
app.get('/:project/apis', getApis);
app.post('/:project/api/add', addApi);
app.post('/:project/api/edit/:id', editApi);
app.post('/:project/api/delete/:id', deleteApi);
app.post('/api/sync', syncApi);

//generated endpoints
app.get('/:project/*', simpleResponse);
app.post('/:project/*', simpleResponse);
app.put('/:project/*', simpleResponse);
app.delete('/:project/*', simpleResponse);
app.patch('/:project/*', simpleResponse);
app.copy('/:project/*', simpleResponse);
app.head('/:project/*', simpleResponse);
app.options('/:project/*', simpleResponse);
app.link('/:project/*', simpleResponse);
app.unlink('/:project/*', simpleResponse);
app.purge('/:project/*', simpleResponse);


app.listen(PORT, function () {
  console.log('Example app listening on port 1234!');
  var url = 'mongodb://127.0.0.1:27017/olpdummy';
  MongoClient.connect(url, function (err, db) {
    console.log("Connected correctly to server.");
    mongoDBInstance = db;
  });
});
