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

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

let results = [];

//Routes 

// Start routes here...
app.get("/", (req, res) => {
    db.Article.find({ saved: false }, (err, result) => {
        if (err) throw err;
        res.render("index", { result })
    })
});

app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://www.nytimes.com/section/world").then((response) => {
  
      let $ = cheerio.load(response.data);
  
      let results = [];
  
      $("article").each(function (i, element) {
  
        let title = $(element).children().text();
        let link = $(element).find("a").attr("href");
  
        results.push({
          title: title,
          link: link
        });
      });
  
      console.log(results);
    });
  
    // Send a message to the client
    res.send("Scrape Complete");
    res.redirect("/");
  });

// Start the server
app.listen(PORT, () => console.log("App running on port " + PORT + "!"));