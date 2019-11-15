let express = require("express");
let exphbs = require("express-handlebars");
let mongoose = require("mongoose");
let logger = require("morgan");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
let axios = require("axios");
let cheerio = require("cheerio");

let PORT = process.env.PORT || 3000;

// Require all models
let db = require("./models");

// Initialize Express
let app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set('index', __dirname + '/views');

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
let MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/NYTarticles";
//mongoose.connect("mongodb://localhost/NYTarticles", { useNewUrlParser: true });


mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

let results = [];

//Routes 

// Start routes here...
app.get("/", (req, res) => {
  db.Article
    .find({})
    .then(articles => res.render("index", { articles }))
    .catch(err => res.json(err));
});

app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.nytimes.com/section/world").then((response) => {

    let $ = cheerio.load(response.data);

    let results = [];

    $("article").each(function (i, element) {

      let title = $(element).find("h2").text();
      let link = `https://www.nytimes.com${$(element).find('a').attr('href')}`;
      let summary = $(element).find("p").text();
      //let img = $(element).find("img").attr("src");

      results.push({
        title: title,
        link: link,
        summary: summary
      });
      db.Article.create(results)
        .then(function (dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });
    });
    console.log(results);
  });

  // Send a message to the client
  res.redirect("/");
});


app.get("/saved", function (req, res) {
  db.Article
    .find({})
    .then(result => res.render("saved", {articles:result}))
    .catch(err => res.json(err));
});

app.post("/save/:id", function (req, res) {
  db.Article
    .update({_id: req.params.id},{saved: true})
    .then(results=> res.redirect('/'))
    .catch(err => res.json(err));
});

// Start the server
app.listen(PORT, () => console.log("App running on port " + PORT + "!"));

