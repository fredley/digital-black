var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
const https = require("https");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  cors({
    origin: "*",
  })
);

var fs = require("fs");
var dbFile = process.env.DB_PATH || "items.sqlite";
var db_exists = fs.existsSync(dbFile);
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(dbFile);
var bodyParser = require("body-parser");

const AUTH_KEY = "bevenden";

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

if (!db_exists) {
  db.serialize(function () {
    db.run("CREATE TABLE items (item TEXT)");
    db.run("CREATE TABLE aisle (item TEXT UNIQUE, aisle TEXT)");
    db.run("CREATE TABLE stats (item TEXT UNIQUE, count INT)");
  });
}

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/get_items/", function (request, response) {
  if (request.query.auth_key != AUTH_KEY) {
    response.send("authfail");
    return;
  }
  db.all(
    "SELECT items.rowid as id, items.item as name, aisle.aisle as aisle FROM items LEFT JOIN aisle ON items.item = aisle.item",
    function (err, rows) {
      db.all(
        "SELECT stats.item as name, aisle.aisle FROM stats LEFT JOIN aisle ON stats.item = aisle.item ORDER BY count DESC LIMIT 500",
        function (err, freq_rows) {
          response.send(
            JSON.stringify({
              items: rows,
              frequent: freq_rows,
            })
          );
        }
      );
    }
  );
});

app.post("/set_aisle/", function (request, response) {
  if (request.body.auth_key != AUTH_KEY) {
    response.send("authfail");
    return;
  }
  const item = request.body.item;
  const new_aisle = request.body.aisle;
  console.log(item, new_aisle);
  db.prepare(`REPLACE INTO aisle VALUES ($item, $aisle)`).run(
    {
      $aisle: new_aisle,
      $item: item,
    },
    () => {
      response.send("{}");
    }
  );
});

app.post("/add_item/", function (request, response) {
  if (request.body.auth_key != AUTH_KEY) {
    response.send(JSON.stringify({ error: "authfail" }));
    return;
  }

  const clean_name = request.body.name.trim().toLowerCase();
  if (!clean_name) {
    response.send(JSON.stringify({ error: "empty" }));
  }

  // Does item exist?
  db.prepare(`SELECT count(*) as count FROM items WHERE item=(?)`)
    .get(clean_name, function (err, result) {
      const count = result["count"];
      if (count > 0) {
        response.send(JSON.stringify({ error: "duplicate" }));
      } else {
        db.prepare(
          `INSERT OR REPLACE INTO stats
        VALUES ($item,
          COALESCE(
            (SELECT count FROM stats
               WHERE item=$item),
            0) + 1);`
        )
          .run({ $item: clean_name })
          .finalize();
        db.prepare("INSERT INTO items VALUES (?)")
          .run(clean_name, function () {
            db.prepare("SELECT aisle FROM aisle WHERE item = (?)").run(
              clean_name,
              function (rows) {
                const aisle = rows?.length ? rows[0].aisle : null;
                response.send(
                  JSON.stringify({ id: this.lastID, name: clean_name, aisle })
                );
              }
            );
          })
          .finalize();
      }
    })
    .finalize();
});

app.post("/clear_items/", function (request, response) {
  if (request.body.auth_key != AUTH_KEY) {
    response.send("authfail");
    return;
  }
  db.prepare("DELETE FROM items")
    .run(function () {
      response.send("OK");
    })
    .finalize();
});

app.post("/remove_frequent/", function (request, response) {
  if (request.body.auth_key != AUTH_KEY) {
    response.send("authfail");
    return;
  }
  db.prepare(`DELETE FROM stats WHERE item=$item`)
    .run({ $item: request.body.name }, () => {
      response.send("OK");
    })
    .finalize();
});

app.post("/clear_item/:id/", function (request, response) {
  if (request.body.auth_key != AUTH_KEY) {
    response.send("authfail");
    return;
  }
  db.prepare("DELETE FROM items WHERE rowid=(?)")
    .run(parseInt(request.params.id), function () {
      response.send("OK");
    })
    .finalize();
});

var listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
