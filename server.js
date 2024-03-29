var express = require('express');
var bodyParser = require('body-parser');
const https = require('https');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var fs = require('fs');
var dbFile = process.env.DB_PATH || 'items.sqlite';
var db_exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);
var bodyParser = require('body-parser');

const AUTH_KEY = 'bevenden'
const SPOON_KEY = 'SPOON_KEY_PLACEHOLDER'

let RECIPE_URL = null

app.use(bodyParser.urlencoded({
  extended: true
}));

if (!db_exists) {
  db.serialize(function(){
      db.run('CREATE TABLE items (item TEXT)');
      db.run('CREATE TABLE stats (item TEXT UNIQUE, count INT)');
    });
}

if (!fs.existsSync('./cache/')){
  fs.mkdirSync('./cache/');
}
if (!fs.existsSync('./cache/items')){
  fs.mkdirSync('./cache/items');
}

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/get_items/', function(request, response) {
  if(request.query.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  db.all('SELECT rowid as id, item as name FROM items', function(err, rows) {
    db.all('SELECT item as name FROM stats ORDER BY count DESC LIMIT 500', function(err, freq_rows) {
      response.send(JSON.stringify(
        {
          items: rows,
          frequent: freq_rows
        }
      ));
    });
  });
});

const extractAisle = (s) => {
  const doc = JSON.parse(s)
  const results = doc.results
  if (!results || results.length === 0) {
    return 'unknown'
  }
  return results[0].aisle ? results[0].aisle.toLowerCase() : 'unknown'
}

const fetchAisle = (item) => {
  return new Promise((resolve, reject) => {
    const cacheKey = `cache/items/${item}.json`
    fs.readFile(cacheKey, "utf-8", (err, filecontents) => {
      if (err) {
        console.log(`Fetching ingredient ${item} from Spoonacular`)
        const spoonUrl = `https://api.spoonacular.com/food/ingredients/search?apiKey=${SPOON_KEY}&query=${item}&metaInformation=true`
        https.get(spoonUrl, (resp) => {
          let data = ''

          // A chunk of data has been received.
          resp.on('data', (chunk) => {
            data += chunk
          });

          // The whole response has been received. Print out the result.
          resp.on('end', () => {
            response_code = JSON.parse(data).code
            if (response_code && response_code !== 200) {
              reject(`Bad response: ${response_code}`)
            } else {
              fs.writeFile(cacheKey, data, (err) => {
                if (err) reject(err)
              })
              resolve([item, extractAisle(data)])
            }
          });
        });
      } else {
        resolve([item, extractAisle(filecontents)])
      }
    });
  })
}

app.get('/item_data/', async function(request, response) {
  if(request.query.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }

  // Get detailed info for each item
  db.all('SELECT rowid as id, item as name FROM items', async function(err, rows) {
    const results = await Promise.all(rows.map(row => row.name).map(fetchAisle));
    response.send(JSON.stringify(results));
  });
});

app.post('/set_aisle/', function(request, response) {
  if(request.body.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  const item = request.body.item;
  const new_aisle = request.body.aisle;
  const cacheKey = `cache/items/${item}.json`
  const doc = {
    results: [
      {aisle: new_aisle}
    ]
  }
  fs.writeFile(cacheKey, JSON.stringify(doc), (err) => {
    if (err) console.log(err)
    response.send("OK")
  })
});

app.post('/parse_recipe/', function(request, response) {
  if(request.body.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  const recipeUrl = request.body.url.replace(/\\\//g, '/')
  const cacheKey = `cache/${recipeUrl.replace(/\//g, '-')}.json`
  fs.readFile(cacheKey, "utf-8", (err, filecontents) => {
    if (err) {
      console.log(`Fetching ${recipeUrl} from Spoonacular`)
      const spoonUrl = `https://api.spoonacular.com/recipes/extract?url=${recipeUrl}&apiKey=${SPOON_KEY}`
      https.get(spoonUrl, (resp) => {
        let data = ''

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
          data += chunk
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          response_code = JSON.parse(data).code
          if (response_code && response_code !== 200) {
            console.log(`Bad response: ${response_code}`)
          } else {
            fs.writeFile(cacheKey, data, (err) => {
              if (err) console.log(err)
            })
          }
          response.send(data)
        })

      }).on("error", (err) => {
        response.status(500)
        response.send("Error: " + err.message)
      })
    } else {
      response.send(filecontents);
    }
  })
})

app.post('/add_item/', function(request, response) {
  if(request.body.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }

  const clean_name = request.body.name.trim().toLowerCase()

  db.prepare(`INSERT OR REPLACE INTO stats
  VALUES ($item,
    COALESCE(
      (SELECT count FROM stats
         WHERE item=$item),
      0) + 1);`).run({$item: clean_name}).finalize()
  db.prepare("INSERT INTO items VALUES (?)").run(clean_name, function(){
    response.send('' + this.lastID)
  }).finalize()

  fetchAisle(clean_name);
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

app.route('/recipe/').post(function(request, response) {
  if(request.body.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  if (request.body.url === 'unset') {
    RECIPE_URL = null
  } else {
    RECIPE_URL = request.body.url;
  }
  response.send("ok")
}).get(function(request, response) {
  if(request.query.auth_key != AUTH_KEY){
    response.send("authfail")
    return
  }
  response.send(JSON.stringify(
    {
      url: RECIPE_URL || "None"
    }
  ));
});

var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
