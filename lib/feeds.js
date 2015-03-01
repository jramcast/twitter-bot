var FeedSub = require('feedsub');
var settings = require('../settings');

var rss = settings.rss;


function createReader(rss, callback) {
  var reader = new FeedSub(rss, {
    interval: settings.feeds.checkInterval
  });

  reader.on('item', callback);
  reader.on('error', function(err) {
    console.log('!!!!!!!!!! Error reading ' + rss);
  });
  reader.start();
  //reader.read();

  console.log('Created feed reader: ' + rss);
  console.log('=====================');
}

var Feeds = module.exports =  {};

Feeds.init = function(onItem) {

  var creationDelay = settings.feeds.creationDelay;
  var step = settings.feeds.creationStep;

  for (var i = rss.length - 1; i >= 0; i--) {
    var url = rss[i];

    (function(url, delay) {
      setTimeout(function() {
        createReader(url, onItem);
      }, delay);
    })(url, creationDelay);

    creationDelay += step;
  }
}






