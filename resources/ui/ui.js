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
function renderCurrentApis(){
  $("delete-api, edit-api").unbind();
  get("apis").done(function(resp){
    console.log("hi", resp);
    var apisHTML = "";
    resp.apis.map(function(api, index){
      apisHTML = apisHTML + ApiListItemHTML(api);
    });
    $("api-container").html(apisHTML);

    if(resp.apis.length !== 0){
      $("delete-api").on("click", deleteApi);
      $("edit-api").on("click", editApi);
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
      '<textarea name="req">' + JSON.stringify(data.req) + '</textarea>' +
      '<textarea name="resp">' + JSON.stringify(data.resp) + '</textarea>'+
      '<edit-api edit-id="'+ data._id +'">edit</edit-api>'+
      '<cancel-edit-api>cancel</cancel-edit-api>'+
      '<delete-api delete-id="'+ data._id +'">delete</delete-api>'+
    '</form>'+
    '<br/>'
  );
}
function getApiPostData(formData){
  var postData = {};
  formData.map(function(item, index){
    if(item.name === "apiname" || item.name === "type"){
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
  var idToDelete = $(e.target).attr('delete-id');
  post("api/delete/"+ idToDelete).done(function(resp){
    console.log(idToDelete + " deleted! :)");
    renderCurrentApis();
  })
}
function editApi(e,target,data){
  var idToEdit = $(e.target).attr('edit-id');
  var formData = jQuery("form#"+ idToEdit).serializeArray();
  var postData = getApiPostData(formData);
  post("api/edit/"+idToEdit, postData).done(function(resp){
    if(resp && resp.success){
      console.log("api updated! :)");
    }
  });
}

$(
  function(){
    $("#add-api").on("click", addApi);
    renderCurrentApis();
  }
);