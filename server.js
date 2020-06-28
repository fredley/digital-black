// server.js
// where your node app starts

// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// init sqlite db
var fs = require('fs');
var dbFile = './.data/items.sqlite';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);
var bodyParser = require('body-parser');

const AUTH_KEY = 'bevenden'

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(function(){
  if (!exists) {
    db.run('CREATE TABLE items (item TEXT)');
    db.run('CREATE TABLE stats (item TEXT UNIQUE, count INT)');
  }
});

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/get_items/', function(request, response) {
  if(request.query.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  db.all('SELECT rowid as id, item as name FROM items', function(err, rows) {
    db.all('SELECT item as name FROM stats ORDER BY count DESC LIMIT 200', function(err, freq_rows) {
      response.send(JSON.stringify(
        {
          items: rows,
          frequent: freq_rows
        }
      ));
    });
  });
});

app.post('/add_item/', function(request, response) {
  if(request.body.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  db.prepare(`INSERT OR REPLACE INTO stats
  VALUES ($item,
    COALESCE(
      (SELECT count FROM stats
         WHERE item=$item),
      0) + 1);`).run({$item: request.body.name}).finalize()
  db.prepare("INSERT INTO items VALUES (?)").run(request.body.name, function(){
    response.send('' + this.lastID)
  }).finalize()
});

app.post('/clear_items/', function(request, response) {
  if(request.body.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  db.prepare("DELETE FROM items").run(function(){
    response.send('OK')
  }).finalize()
});

app.post('/remove_frequent/', function(request, response) {
  if(request.body.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  db.prepare(`DELETE FROM stats WHERE item=$item`).run(
    {$item: request.body.name}, () => {
      response.send('OK')
    }
  ).finalize()
});

app.post('/clear_item/:id/', function(request, response) {
  if(request.body.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  db.prepare("DELETE FROM items WHERE rowid=(?)").run(parseInt(request.params.id), function(){
    response.send('OK')
  }).finalize()
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
