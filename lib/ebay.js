var ebay = require('ebay-api');
var settings = require('../settings');

module.exports = {

  getProduct: function(keyword, callback) {

    var params = settings.ebay.params;

    var filters = {};

    filters.itemFilter = [
      new ebay.ItemFilter("MinPrice", 10)
    ];

    params.keywords = [ keyword ];

    ebay.ebayApiGetRequest(
    {
      serviceName: 'FindingService',
      opType: 'findItemsByKeywords',
      appId: settings.ebay.appId,      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
      params: params,
      filters: filters,
      parser: ebay.parseItemsFromResponse    // (default)
    },

    function (error, items) {
      if (error) {
        callback(true, []);
        return;
      }

      // get random item
      try {
        var item = items[Math.floor(Math.random()*items.length)];
      } catch (err) {
        item = null;
      }

      if(item) {
        callback(false, item);
      } else {
        callback(true, null);
      }

      //console.log('Found', items.length, 'items');

      /*for (var i = 0; i < items.length; i++) {
        console.log(items[i].title + ' - '); //+ items[i].sellingStatus.convertedCurrentPrice.EUR + ' € - '
          //+ items[i].galleryPlusPictureURL + ' - ' + items[i].viewItemURL);
      }*/
    }
  );

  }
}