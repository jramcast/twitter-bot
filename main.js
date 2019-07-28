var
_       = require('underscore'),
Twit    = require('twit'),
request = require('request'),
http    = require('http'),
fs      = require('fs'),
path    = require('path');


var
settings = require('./settings'),
Feeds    = require('./lib/feeds');
// Ebay     = require('./lib/ebay'),
// Amazon   = require('./lib/amazon');



// ----- Set configuration -----

var config = {
  consumer_key: settings.twitterApi.consumer_key,
  consumer_secret: settings.twitterApi.consumer_secret,
  access_token: settings.twitterApi.access_token,
  access_token_secret: settings.twitterApi.access_token_secret
};

var T = new Twit(config);

var WINDOW = settings.frequency.WINDOW;
var MAX_RETWEETS_PER_WINDOW = settings.frequency.MAX_RETWEETS_PER_WINDOW;
var MAX_TWEETS_PER_WINDOW = settings.frequency.MAX_TWEETS_PER_WINDOW;
var MIN_FOLLOWERS_WIHOUT_FAVORITE = settings.frequency.MIN_FOLLOWERS_WIHOUT_FAVORITE;
var MIN_FOLLOWERS_WITH_FAVOURITE = settings.frequency.MIN_FOLLOWERS_WITH_FAVOURITE;
var MIN_FAVOURITES = settings.frequency.MIN_FAVOURITES;


var minutesBetweenPosts = WINDOW / MAX_RETWEETS_PER_WINDOW;
var minutesBetweenFeedItems = WINDOW / MAX_TWEETS_PER_WINDOW;

var lastRetweet = new Date() - 1 * 60 * 60 * 1000;
var lastTweet = new Date() - 1 * 60 * 60 * 1000;

var Bitly = require('bitly');
var bitly = new Bitly(settings.bitlyApi.username, settings.bitlyApi.apiKey);


// ----- Start listening to Twitter stream -----

var stream = T.stream('statuses/filter', settings.stream);

stream.on('tweet', function (tweet) {
  console.log('User id: ' + tweet.user.id);
  console.log('Text: ' + tweet.text);
  console.log('Followers: ' + tweet.user.followers_count);
  const favouriteCount = tweet.favorite_count || (tweet.retweeted_status || {}).favorite_count || 0;
  console.log('Favourites: ' + favouriteCount);

  var elapsedTime = new Date() - lastRetweet;
  var elapsedMinutes = (elapsedTime / 1000 / 60);

  console.log('Minutes since last retweet:' + elapsedMinutes);

  var isRelevantWithFavorite = (favouriteCount >= MIN_FAVOURITES && tweet.user.followers_count >= MIN_FOLLOWERS_WITH_FAVOURITE );
  var isRelevantWithoutFavorite =  tweet.user.followers_count >= MIN_FOLLOWERS_WIHOUT_FAVORITE;
  var isRelevant = (isRelevantWithFavorite || isRelevantWithoutFavorite) && !_.contains(settings.ignoreTweetsFrom, tweet.user.screen_name);

  if ( isRelevant  &&  elapsedMinutes > minutesBetweenPosts ) {

    T.post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
      if(!err) {
        console.log('------ Retweet! -------');
      }
    });

    if (Math.random() > settings.followThreshold) {
      console.log('------ Follow! -------');
      T.post('friendships/create', { id: tweet.user.id }, function(err,data,response) {
        if(!err) {
          console.log('------ Follow! -------');
        }
      });
    }

    lastRetweet = new Date();
  }
  console.log('=====================');

});

// ------ Start feeds watcher to tweet  posts as they are -------

Feeds.init(function(item) {

    var link = getLink(item);
    var image = getImage(item);

    console.log('********* Got new feed item! *********');
    console.log(item.title);
    console.log('Url: ' + link);
    console.log('Image: ' + image);

    var elapsedTime = new Date() - lastTweet;
    var elapsedMinutes = (elapsedTime / 1000 / 60);
    var correctLink = (typeof link === 'string' && link.indexOf('http') === 0);

    console.log('Link: ', link);
    console.log('Minutes since last publication: ', elapsedMinutes);

    if ( elapsedMinutes > minutesBetweenFeedItems && item.title && correctLink) {

      if (image && image.length) {
        tweetWithMedia(item, link, image);
      } else {
        simpleTweet(item, link);
      }

      lastTweet = new Date();
    }

    console.log('============');
});


// ------ Init Amazon and ebay (if enabled) -------

// if (settings.amazon.enabled) {
//   tweetAmazonProduct();
//   setInterval(tweetAmazonProduct, settings.amazon.interval);
// }

// if (settings.ebay.enabled) {
//   setInterval(tweetEbayProduct, settings.ebay.interval);
// }


// ------ Helper functions -------


function cutText(yourString, maxLength) {
  //trim the string to the maximum length
  var trimmedString = yourString.substr(0, maxLength);

  //re-trim if we are in the middle of a word
  return trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
}


function getLink(item) {
  var link = item.link;

  if (link) {
    if ( typeof link === 'string' ) {
      return link;
    } else if ( link.href) {
      return link.href;
    } else {
      for(var i in link) {
        var typeLink = link[i];
        if ( typeof typeLink === 'object' && typeLink.rel == 'alternate') {
          return typeLink.href;
        }
      }
    }
  }

  return null;
}



function getImage(item) {
  var image;

  if(item['media:thumbnail'] && item['media:thumbnail'].url) {
    var url = item['media:thumbnail'].url;
    var pos = url.indexOf('?w=');
    image = url.substr(0,pos);
  }

  else if(item.description) {

    var regex = /img.*?src=['"](.*?)['"]/gim;
    var result = regex.exec(item.description);
    if(result) {
      image = result[1];
    }
  }

  if (typeof image == 'string' || image instanceof String) {
    if (image.indexOf('//') === 0) {
      image = 'http:' + image;
    }
  }

  return image;
}


function simpleTweet(item, link) {
  console.log('------ Tweet feed! -------');

  var maxTextLength = 116 - settings.feeds.tweetTags.length;

  var text = cutText(item.title + " ", maxTextLength) + settings.feeds.tweetTags + link;

  //tweet feed item
  T.post('statuses/update', { status: text }, function(err, data, response) {
    //console.log(data)
  });
}


function tweetWithMedia(item, link, image) {

  var TEMP_IMAGE_NAME = "post_image";

  var file = fs.createWriteStream(TEMP_IMAGE_NAME);

  console.log('------ Getting image-------');

  if (typeof image === 'undefined') {
    return simpleTweet(item,link);
  }

  request.get(image).pipe(file).on('close', function () {

      console.log('------ Tweet feed with image! -------');

      var oauth = {
          consumer_key: config.consumer_key,
          consumer_secret: config.consumer_secret,
          token: config.access_token,
          token_secret: config.access_token_secret
       }

      var maxTextLength = 91 - settings.feeds.tweetTags.length;

      var text = cutText(item.title + " ", maxTextLength) + settings.feeds.tweetTags + link;

      var r = request.post(
      {
        url: "https://api.twitter.com/1.1/statuses/update_with_media.json",
        oauth: oauth
      },
      function(err, response, body) {
         console.log(body);
      });
      var form = r.form();
      form.append('status', text);
      form.append('media[]',  fs.createReadStream(path.normalize(TEMP_IMAGE_NAME)));
  });

}

function shortenUrl(longUrl, callback) {
  bitly.shorten(longUrl, function(err, response) {
    if (err) {
      callback(longUrl);
      return;
    }

    if (response.status_code == 200 && response && response.data && response.data.url) {
      callback(response.data.url);

    } else {
      callback(longUrl);
    }
  });

}



function tweetEbayProduct() {
  //get random keyword
  var keywords = settings.ebay.keywords;
  var keyword = keywords[Math.floor(Math.random()*keywords.length)];

  Ebay.getProduct(keyword,function(err, product) {
    if (err) return false;

    shortenUrl(product.viewItemURL, function(url) {
      tweetWithMedia(product, url, product.galleryPlusPictureURL);
    });

  });

}


function tweetAmazonProduct() {
  //get random keyword
  var keywords = settings.amazon.searches;
  var keyword = keywords[Math.floor(Math.random()*keywords.length)];

console.log(keyword);

  Amazon.getProduct(keyword,function(err, product) {
    if (err) return false;

    shortenUrl(product.url, function(url) {
      tweetWithMedia(product, url, product.image);
    });

  });

}










