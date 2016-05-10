const DataServer = "http://localhost:1234/";
function get(url) {
  return $.ajax({
    type: "get",
    url : DataServer + url,
    contentType: "application/json"
  });
}
function post(url, data, config) {
  return $.ajax({
    url: DataServer + url,
    data: JSON.stringify(data),
    contentType: "application/json",
    type: "post"
  }).done(function(resp) {
    console.log("response is", resp);
  }).fail(function(resp) {
    if (resp.status && resp.statusText) {
      console.error(resp.status + " : " + resp.statusText, "error");
    }
  });
}
function ApiListItemHTML(data){
  return (
    '<form class="api" id="'+ data._id +'">' +
      '<select name="type">' +
        (data.type === 'GET' ? '<option selected value="GET">GET</option>': '<option value="GET">GET</option>' ) +
        (data.type === 'POST' ? '<option selected value="POST">POST</option>': '<option value="POST">POST</option>' ) +
      '</select>' +
      '<input type="text" name="apiname" value="'+ data.apiname +'"/>' +
      '<textarea name="req" rows="10">' + JSON.stringify(data.req, undefined, 3) + '</textarea>' +
      '<textarea name="resp" rows="10">' + JSON.stringify(data.resp, undefined, 3) + '</textarea>'+
      '<button class="edit-api" edit-id="'+ data._id +'">edit</button>'+
      '<button class="delete-api" delete-id="'+ data._id +'">delete</button>'+
      '<input type="text" name="syncURI" value="http://10.41.92.108:8080"/>' +
      '<button class="sync-api" sync-id="'+ data._id +'">sync</button>'+
    '</form>'
  );
}
function getApiPostData(formData){
  var postData = {};
  formData.map(function(item, index){
    if(item.name === "apiname" || item.name === "type" || item.name === "syncURI"){
      postData[item.name] = item.value;
    } else {
      postData[item.name] = JSON.parse(item.value);
    }
  });
  return postData;
}
function addApi(e){
  e.preventDefault();
  var formData = jQuery("form#api-input-container").serializeArray();
  var postData = getApiPostData(formData);
  post("api/add", postData).done(function(resp){
    if(resp && resp.success){
      console.log("api added! :)");
      renderCurrentApis();
    }
  })
}
function deleteApi(e,target,data){
  e.preventDefault();
  var idToDelete = $(e.target).attr('delete-id');
  post("api/delete/"+ idToDelete).done(function(resp){
    console.log(idToDelete + " deleted! :)");
    renderCurrentApis();
  })
}
function editApi(e,target,data){
  e.preventDefault();
  var idToEdit = $(e.target).attr('edit-id');
  var formData = jQuery("form#"+ idToEdit).serializeArray();
  var postData = getApiPostData(formData);
  post("api/edit/"+idToEdit, postData).done(function(resp){
    if(resp && resp.success){
      console.log("api updated! :)");
    }
  });
}
function syncApi(e){
  e.preventDefault();
  var idToSync = $(e.target).attr('sync-id');
  var $thisApi = $("form#"+idToSync);
  var apiData = getApiPostData($thisApi.serializeArray());
  var syncServer = apiData.syncURI;
  var apiURI = apiData.apiname;
  var apiType = apiData.type;
  var postData = apiData.req;
  post("api/sync", {
    'uri': syncServer + apiURI,
    'type': apiType,
    'postData': postData
  }).done(function(resp){
    $thisApi.find("[name='resp']").val(JSON.stringify(resp, undefined, 3));
  });
}
function renderCurrentApis(){
  $(".delete-api, .edit-api, .sync-api").unbind();
  get("apis").done(function(resp){
    console.log("hi", resp);
    var apisHTML = "";
    resp.apis.map(function(api, index){
      apisHTML = apisHTML + ApiListItemHTML(api);
    });
    $("api-container").html(apisHTML);

    if(resp.apis.length !== 0){
      $(".delete-api").on("click", deleteApi);
      $(".edit-api").on("click", editApi);
      $(".sync-api").on("click", syncApi);
    }
  });
}

$(
  function(){
    $("#add-api").on("click", addApi);
    renderCurrentApis();
  }
);