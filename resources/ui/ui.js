const DataServer = "http://localhost:1234/";
var currentProject = null;
function get(url) {
  return $.ajax({
    type: "get",
    url: DataServer + url,
    contentType: "application/json"
  });
}
function post(url, data, config) {
  return $.ajax({
    url: DataServer + url,
    data: JSON.stringify(data),
    contentType: "application/json",
    type: "post"
  }).done(function (resp) {
    console.log("response is", resp);
  }).fail(function (resp) {
    if (resp.status && resp.statusText) {
      console.error(resp.status + " : " + resp.statusText, "error");
    }
  });
}
function ApiListItemHTML(data) {
  var reqType = data.type;
  return (
    '<form class="api" id="' + data._id + '">' +
    '<select name="type">' +
      '<option value="GET"'+ (reqType === 'GET' ? 'selected' : '') +'> GET</option>' +
      '<option value="POST"'+ (reqType === 'POST' ? 'selected' : '') +'> POST</option>' +
      '<option value="PUT"'+ (reqType === 'PUT' ? 'selected' : '') +'> PUT</option>' +
      '<option value="DELETE"'+ (reqType === 'DELETE' ? 'selected' : '') +'> DELETE</option>' +
      '<option value="PATCH"'+ (reqType === 'PATCH' ? 'selected' : '') +'>PATCH</option>'+
      '<option value="COPY"'+ (reqType === 'COPY' ? 'selected' : '') +'>COPY</option>'+
      '<option value="HEAD"'+ (reqType === 'HEAD' ? 'selected' : '') +'>HEAD</option>'+
      '<option value="OPTIONS"'+ (reqType === 'OPTIONS' ? 'selected' : '') +'>OPTIONS</option>'+
      '<option value="LINK"'+ (reqType === 'LINK' ? 'selected' : '') +'>LINK</option>'+
      '<option value="UNLINK"'+ (reqType === 'UNLINK' ? 'selected' : '') +'>UNLINK</option>'+
      '<option value="PURGE"'+ (reqType === 'PURGE' ? 'selected' : '') +'>PURGE</option>'+
    '</select>' +
    '<input type="text" name="apiname" value="' + data.apiname + '"/>' +
    '<textarea name="req" rows="10">' + JSON.stringify(data.req, undefined, 3) + '</textarea>' +
    '<textarea name="resp" rows="10">' + JSON.stringify(data.resp, undefined, 3) + '</textarea>' +
    '<button class="edit-api" edit-id="' + data._id + '">edit</button>' +
    '<button class="delete-api" delete-id="' + data._id + '">delete</button>' +
    '<input type="text" name="syncURI" value="http://10.41.92.108:8080"/>' +
    '<button class="sync-api" sync-id="' + data._id + '">sync</button>' +
    '</form>'
  );
}
function renderProjectList(force) {
  if (force || document.getElementById("projects").options.length === 0) {
    return get("projects").done(function (resp) {
      var selectProjectOptionsHtml = "";
      resp.projects.map(function (project) {
        selectProjectOptionsHtml = selectProjectOptionsHtml + '<option value="' + project.name + '">' + project.name + '</option>';
      });
      $("select#projects").html(selectProjectOptionsHtml);
    });
  } else {
    return $.when();
  }
}
function addProject(e) {
  e.preventDefault();
  var newProjectName = $("input#new-project-input").val();
  post("project/add/" + newProjectName).done(function (resp) {
    if (resp.success) {
      console.log("project added!");
      $('#projects').append($('<option>', {
        value: newProjectName,
        text: newProjectName
      }));
    }
  });
}
function deleteProject(e) {
  e.preventDefault();
  var $thisButton = $(e.target);
  if ($thisButton.attr("confirmed") === undefined) {
    $thisButton
      .attr("confirmed", "yes")
      .text("sure?");
    window.setTimeout(function () {
      $thisButton
        .removeAttr("confirmed")
        .text("Delete this Project")
        .prop('disabled', false);
    }, 1500)
  } else if ($thisButton.attr("confirmed") === "yes") {
    $thisButton.prop('disabled', true);
    post("project/remove/" + currentProject).done(function (resp) {
      if (resp.success) {
        console.log("project removed!!", resp);
        renderCurrentApis(true);
      }
    })
  }
}
function changeProject() {
  currentProject = this.value;
  renderCurrentApis();
}
function getApiPostData(formData) {
  var postData = {};
  formData.map(function (item, index) {
    if (item.name === "apiname" || item.name === "type" || item.name === "syncURI") {
      postData[item.name] = item.value;
    } else {
      postData[item.name] = JSON.parse(item.value);
    }
  });
  return postData;
}
function addApi(e) {
  e.preventDefault();
  var formData = jQuery("form#api-input-container").serializeArray();
  var postData = getApiPostData(formData);
  post(currentProject + "/api/add", postData).done(function (resp) {
    if (resp && resp.success) {
      console.log("api added! :)");
      renderCurrentApis();
    }
  })
}
function editApi(e, target, data) {
  e.preventDefault();
  var idToEdit = $(e.target).attr('edit-id');
  var formData = jQuery("form#" + idToEdit).serializeArray();
  var postData = getApiPostData(formData);
  post(currentProject + "/api/edit/" + idToEdit, postData).done(function (resp) {
    if (resp && resp.success) {
      console.log("api updated! :)");
    }
  });
}
function deleteApi(e, target, data) {
  e.preventDefault();
  var idToDelete = $(e.target).attr('delete-id');
  post(currentProject + "/api/delete/" + idToDelete).done(function (resp) {
    console.log(idToDelete + " deleted! :)");
    renderCurrentApis();
  })
}
function syncApi(e) {
  e.preventDefault();
  var idToSync = $(e.target).attr('sync-id');
  var $thisApi = $("form#" + idToSync);
  var apiData = getApiPostData($thisApi.serializeArray());
  var syncServer = apiData.syncURI;
  var apiURI = apiData.apiname;
  var apiType = apiData.type;
  var postData = apiData.req;
  post("api/sync", {
    'uri': syncServer + apiURI,
    'type': apiType,
    'postData': postData
  }).done(function (resp) {
    $thisApi.find("[name='resp']").val(JSON.stringify(resp, undefined, 3));
  });
}
function renderCurrentApis(refreshProjectList) {
  $(".delete-api, .edit-api, .sync-api").unbind();

  renderProjectList(refreshProjectList).done(function () {
    currentProject = $("select#projects").val();
    get(currentProject + "/apis").done(function (resp) {
      var apisHTML = "";
      resp.apis.map(function (api, index) {
        apisHTML = apisHTML + ApiListItemHTML(api);
      });
      $("api-container").html(apisHTML);

      if (resp.apis.length !== 0) {
        $(".delete-api").on("click", deleteApi);
        $(".edit-api").on("click", editApi);
        $(".sync-api").on("click", syncApi);
      }
    });
  });
}

$(
  function () {
    $("#add-api").on("click", addApi);
    $("#add-project").on("click", addProject);
    $("#delete-project").on("click", deleteProject);
    $("#projects").on("change", changeProject);
    renderCurrentApis();
  }
);