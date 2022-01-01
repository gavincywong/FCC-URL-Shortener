require('dotenv').config();
var express = require('express');
var cors = require('cors');
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var validUrl = require("valid-url")
var app = express();
var port = process.env.PORT || 3000;
var urlCount = 0

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json())
app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

var urlSchema = new mongoose.Schema({
  url: String,
  shortUrl: Number
})

var Url = mongoose.model("Url", urlSchema)

var createAndSaveUrl = (urlObj, done) => {
  var newUrl = new Url({
    url: urlObj.url, 
    shortUrl: urlObj.shortUrl})

  newUrl.save(function(err, data) {
    if (err) return console.error(err)
    console.log("URL saved in database\n")
  })
}

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
})

app.post("/api/shorturl", function(req, res) {
    var longUrl = req.body.url
    var regex = new RegExp('^http(s?):\/\/.+')

    console.log("Entered url: " + longUrl)
    if (regex.test(longUrl) &&validUrl.isUri(longUrl)) {

      Url.countDocuments({}, function( err, count){
          console.log( "Number of URLs in database:", count);
          urlCount = count
      })

      if (urlCount > 0) {
        urlCount += 1
      } else {
        urlCount = 1
      }
      createAndSaveUrl({url: longUrl, shortUrl: urlCount})
      res.json({original_url: longUrl, short_url: urlCount })
    } else {
      res.json({ error: 'invalid url' })
    }
})

app.get("/api/shorturl/:url", function(req, res) {
    var urlNum = req.params.url
    
    Url.findOne({shortUrl: urlNum}, function(err, data) {
      if (err) return console.error(err)

      if (data != null) {
        res.redirect(data.url)
      } else{
        res.json({ error: 'invalid url' })
      }
    })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
})