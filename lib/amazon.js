var util = require('util'),
settings = require('../settings'),
amazon   = require('amazon-product-api');

var client = amazon.createClient({
    awsId: settings.amazon.keys.awsId,
    awsSecret: settings.amazon.keys.awsSecret,
    awsTag: settings.amazon.keys.assocId
});

function getProduct(keyword, callback) {
  client.itemSearch({
      domain: settings.amazon.domain,
      keywords: keyword,
      searchIndex: settings.amazon.searchIndex,
      responseGroup: 'ItemAttributes,Images'
  }).then(function(results){

    if(results) {
      // get random item
      var item = results[Math.floor(Math.random()*results.length)];

      if(item && item.ItemAttributes) {

        var cleanItem = {
          title : item.ItemAttributes[0].Title[0],
          url : item.DetailPageURL[0],
        }

        if(item.LargeImage && item.LargeImage[0] && item.LargeImage[0].URL && item.LargeImage[0].URL[0]) {
          cleanItem.image = item.LargeImage[0].URL[0];
        }

        callback(false, cleanItem);

      } else {
        console.log('--------------- ERROR READING ITEM ----------------');
        console.log(item);
        callback(true, null);
      }
    } else {
      console.log(results);
      callback(true, null);
    }

  }).catch(function(err){
      console.log(err);
      callback(true, null);
  });
}

module.exports = {
  getProduct: getProduct
}