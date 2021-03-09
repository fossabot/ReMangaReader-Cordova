document.addEventListener("deviceready", onDeviceReady, false);
https = null;
var database = window.localStorage;
var currentManga = null;

function onDeviceReady() {
  // Cordova is now initialized. Have fun!

  // Android params
  if (cordova.platformId == "android") {
    StatusBar.hide();
    window.screen.orientation.lock("portrait");
  }

  console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
  document.getElementById("search-button").addEventListener("click", () => {
    search_manga();
  });
  document.getElementById("search-place").addEventListener("change", () => {
    search_manga();
  });
  document.getElementById("back-button").addEventListener("click", () => {
    next_prev_page("prev", "back-button");
  });
  document.getElementById("next-button").addEventListener("click", () => {
    next_prev_page("next", "next-button");
  });
  document.addEventListener("keydown", () => {
    if (event.code == "ArrowLeft") {
      next_prev_page("prev", wait_data);
    } else if (event.code == "ArrowRight") {
      next_prev_page("next", wait_data);
    }
  });
  document.getElementById("lk-button").addEventListener("click", lk_button);
  https = cordova.plugin.http;
  cordova.plugin.http.setFollowRedirect(true);
  cordova.plugin.http.setDataSerializer("json");
  cordova.plugin.http.setRequestTimeout(5.0);
}

function lk_button() {
  var searchResult = document.getElementById("search-result");
}

function search(text) {
  test = https.get(
    "https://thingproxy.freeboard.io/fetch/https://api.remanga.org/api/search/?query=" +
      text +
      "&count=10",
    {},
    {},
    (resp) => {
      wait_data = JSON.parse(resp.data).content;
      add("manga", wait_data);
    },
    function (resp) {
      alert.error(resp.error);
    }
  );
}

function clear_SearchData() {
  var search_result = document.getElementById("search-result");
  search_result.innerHTML = "";
}

function add(type, ins) {
  i = 0;
  var search_result = document.getElementById("search-result");
  clear_SearchData();
  if (ins.length == 0) {
    search_result.innerHTML = "<h1>Error!</h1>";
    return;
  }
  while (i < ins.length) {
    var br = document.createElement("br");
    var child = document.createElement("input");
    child.type = "submit";
    if (type == "manga") {
      child = document.createElement("div");
      child.className = "card";

      var img = document.createElement("img");
      img.className = "card-img-top";
      img.src = "https://api.remanga.org/" + ins[i].img.high;

      child.appendChild(img);
      var cardBody = document.createElement("div");
      cardBody.className = "card-body";

      var cardTitle = document.createElement("h5");
      cardTitle.className = "card-title";
      cardTitle.innerText = ins[i].rus_name;

      var cardText = document.createElement("p");
      cardText.className = "card-text";
      cardText.innerText = "Глав: " + ins[i].count_chapters;

      var a = document.createElement("a");
      a.className = "btn btn-primary";
      a.dataset.id = ins[i].dir;
      a.innerText = "Читать";
      a.addEventListener("click", () => {
        get_tomes(event.target.dataset.id);
        window.location.href = "#search-result";
      });

      cardBody.appendChild(cardTitle);
      cardBody.appendChild(cardText);
      cardBody.appendChild(a);
      child.appendChild(cardBody);

      document.getElementById("next_prev_buttons").hidden = true;
    } else if (type == "tome") {
      if (database.getItem("readedManga") !== null) {
        var data = JSON.parse(database.getItem("readedManga")).readedManga;
      }
      document.getElementById("next_prev_buttons").hidden = true;
      child.value = "Глава " + ins[i].chapter + " " + ins[i].name;
      if (database.getItem("readedManga") !== null) {
        if (data.includes(ins[i].id.toString())) {
          child.value += " ✓";
        }
      }
      child.className = "btn btn-primary";
      child.dataset.id = ins[i].id;
      if (ins[i].paid == true) {
        continue;
      }
      child.addEventListener("click", () => {
        currentManga = event.target.dataset.id;
        get_chapters(event.target.dataset.id);
      });
    } else if (type == "chapters") {
      document.getElementById("next_prev_buttons").hidden = false;
      child = document.createElement("img");
      child.src = wait_data[0].link;
      child.className = "btn btn-primary";
      child.className = "card-img-top";
      child.dataset.page = 0;
      child.dataset.json = JSON.stringify(wait_data);
      child.addEventListener("click", () => {
        next_prev_page("next", wait_data);
      });
      search_result.appendChild(child);
      search_result.appendChild(br);
      break;
    }
    search_result.appendChild(child);
    search_result.appendChild(br);
    i = i + 1;
  }
}

function next_prev_page(type, ins) {
  manga_id = document.getElementById("manga-id").dataset.manga_id;
  if (manga_id == undefined) {
    return;
  }
  img = document.getElementsByClassName("card-img-top")[0];
  if (ins == "back-button" || ins == "next-button") {
    ins = JSON.parse(img.dataset.json);
  }
  try {
    page = parseInt(img.dataset.page);
  } catch (e) {}
  if (type == "next") {
    try {
      img.src = ins[page + 1].link;
      img.dataset.page = page + 1;
    } catch (e) {
      if (database.getItem("readedManga") == null) {
        database.setItem(
          "readedManga",
          JSON.stringify({ readedManga: [currentManga] })
        );
      } else {
        var data = JSON.parse(database.getItem("readedManga")).readedManga;
        if (!data.includes(currentManga)) {
          data.push(currentManga);
          database.setItem(
            "readedManga",
            JSON.stringify({ readedManga: data })
          );
        }
      }
      get_tomes(manga_id);
    }
  } else if (type == "prev") {
    try {
      img.src = ins[page - 1].link;
      img.dataset.page = page - 1;
    } catch (e) {
      get_tomes(manga_id);
    }
  }
  window.location.href = "#search-result";
}

function get_tomes(ins) {
  var branch = 0;
  https.get(
    "https://thingproxy.freeboard.io/fetch/https://api.remanga.org/api/titles/" +
      ins +
      "/",
    {},
    {},
    (resp) => {
      branch = JSON.parse(resp.data).content.branches[0].id;
      test = https.get(
        "https://thingproxy.freeboard.io/fetch/https://api.remanga.org/api/titles/chapters/?branch_id=" +
          branch,
        {},
        {},
        (resp) => {
          wait_data = JSON.parse(resp.data).content;
          clear_SearchData();
          add("tome", wait_data.reverse());
          document.getElementById("manga-id").dataset.manga_id = ins;
        },
        function (resp) {
          alert(resp.error);
        }
      );
    },
    function (resp) {
      alert(resp.error);
    }
  );
}

function get_chapters(ins) {
  test = https.get(
    "https://thingproxy.freeboard.io/fetch/https://api.remanga.org/api/titles/chapters/" +
      ins +
      "/",
    {},
    {},
    (resp) => {
      wait_data = JSON.parse(resp.data).content.pages;
      add("chapters", wait_data);
    },
    function (resp) {
      alert(resp.error);
    }
  );
}

function search_manga() {
  text = document.getElementById("search-place").value;
  search(text);
}
