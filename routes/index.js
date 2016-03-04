var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bobblehead Generator' });
});

var fs = require('fs');
var oxford = require('project-oxford');
var jimp = require('jimp');
var pngFileStream = require('png-file-stream');
var gifEncoder = require('gifencoder');

/* Handle post request */
router.post('/', function (req, res, next) {
  var imgSrc = req.file ? req.file.path : '';
  Promise.resolve(imgSrc)
    .then(function detectFace(image) {
      console.log("TODO: detect face using Oxford API.");
    })
    .then(function generateBobblePermutations(response) {
      console.log("TODO: generate multiple images with head rotated.");
    })
    .then(function generateGif(dimensions){
      console.log("TODO: generate GIF");
      return imgSrc;
    })
    .then(function displayGif(gifLocation) {
      res.render('index', {title: 'Done!', image: gifLocation});
    });
});

module.exports = router;
