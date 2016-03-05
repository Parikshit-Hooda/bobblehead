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
      var client = new oxford.Client(process.env.OXFORD_API);
      return client.face.detect({path: image, analyzesAge: true, analyzesGender: true});
    })
    .then(function generateBobblePermutations(response) {
      var promises = [];
      var degrees = [10, 0, -10];
      
      for (var i = 0; i < degrees.length; i++) {
        var outputName = req.file.path + '-' + i + '.png';
        promises.push(cropHeadAndPasteRotated(req.file.path,
          response[0].faceRectangle, degrees[i], outputName))
      }
      return Promise.all(promises);
    })
    .then(function generateGif(dimensions){
      return new Promise(function (resolve, reject) {
        var encoder = new gifEncoder(dimensions[0][0], dimensions[0][1]);
        pngFileStream(req.file.path + '-?.png')
          .pipe(encoder.createWriteStream({repeat: 0, delay: 400}))
          .pipe(fs.createWriteStream(req.file.path+'.gif'))
          .on('finish', function() {
            resolve(req.file.path + '.gif');
          });
      })
    })
    .then(function displayGif(gifLocation) {
      res.render('index', {title: 'Done!', image: gifLocation});
    });
});

function cropHeadAndPasteRotated(inputFile, faceRectangle, degrees, outputName) {
  return new Promise(function(resolve, reject) {
    jimp.read(inputFile).then(function(image) {
      // face detection only captures a small portion of the face,
      // so compensate for this by expanding the area
      var height = faceRectangle.height;
      var top = faceRectangle.top - (height * 0.5);
      height *= 1.6;
      var width = faceRectangle.width;
      var left = faceRectangle.left - (width * 0.25);
      width *= 1.6;      
      
      // crop head, scale up slightly, rotate, and paste on original image
      image.crop(left, top, width, height)
      .scale(1.05)
      .rotate(degrees, function (err, rotated) {
        jimp.read(inputFile).then(function(original) {
          original.composite(rotated, left -0.1* width, top-0.05 * height)
          .write(outputName, function() {
            resolve([original.bitmap.width, original.bitmap.height]);
          });
        });
      });
    });
  });
}

module.exports = router;
