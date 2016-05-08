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
    '<api>' +
      '<api-name>' +
        data.apiname +
      '</api-name>' +
      '<req>' +
        JSON.stringify(data.req) +
      '</req>' +
      '<resp>' +
        JSON.stringify(data.resp) +
      '</resp>'+
    '</api>'+
    '<edit-api>edit</edit-api>'+
    '<cancel-edit-api id="' + data._id + '">cancel</cancel-edit-api>'+
    '<delete-api id="'+ data._id +'">delete</delete-api>'+
    '<br/>'
  );
}
function addApi(){
  var formData = jQuery("form#api-input-container").serializeArray();
  var postData = {};
  formData.map(function(item, index){
    if(item.name === "apiname"){
      postData[item.name] = item.value;
    } else {
      postData[item.name] = JSON.parse(item.value);
    }

  });
  post("api/add", postData).done(function(resp){
    if(resp && resp.success){
      console.log("api added! :)");
    }
  })
}
function deleteApi(e,target,data){
  post("api/delete/"+ e.target.id).done(function(resp){
    console.log(e.target.id + " deleted! :)");
  })
}

$(
  function(){
    $("#add-api").on("click", addApi);

    get("apis").done(function(resp){
      console.log("hi", resp);
      var apisHTML = "";
      resp.apis.map(function(api, index){
        apisHTML = apisHTML + ApiListItemHTML(api);
      });
      $("api-container").html(apisHTML);

      if(resp.apis.length !== 0){
        $("delete-api").on("click", deleteApi);
      }
    });
  }
);