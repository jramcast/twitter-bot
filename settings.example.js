module.exports = {

  twitterApi : {
      consumer_key: //consumer_key
    , consumer_secret: //consumer_secret
    , access_token: //access_token
    , access_token_secret: //access_token_secret
  },

  /*
    Get from: http://bitly.com/a/your_api_key
  */
  bitlyApi : {
    username: // username
    apiKey : // key
  },

  frequency : {
    WINDOW : 15, //15 min
    MAX_RETWEETS_PER_WINDOW : 5,
    MAX_TWEETS_PER_WINDOW : 8,
    // Decides when to retweet based on the popularity of the user (followers count)
    // and the tweet's popularity (has favourites)
    MIN_FOLLOWERS_WIHOUT_FAVORITE : 1000,
    MIN_FOLLOWERS_WITH_FAVOURITE : 150,
    MIN_FAVOURITES: 5
  },

  //Twitter Streaming API (https://dev.twitter.com/streaming/overview/request-parameters)
  stream : {
     track: 'twitter, another ',
     language: 'es,en'
  },

  ignoreTweetsFrom : [],

  /**
   * Follows a user only if a random number between 0-1 is greater than this number
   * @type {Number}
   */
  followThreshold: 0.95,

  /** Rss feeds to tweet **/
  rss : [
    'http://www.spark-stack.org/rss/',
    'http://www.reddit.com/r/MachineLearning/',
    // ...
  ],

  /**
   * Feeds creation and checking intervals
   * @type {Object}
   */
  feeds : {
    checkInterval : 60 + (Math.random()*30), // check feed every 60-90 minutes
    creationDelay : 0,
    creationStep : 10 * 1000,

    /**
     * Tags to use when publishing the tweet of an rss, USE SPACE BEFORE AND AFTER
     * @type {String}
     */
    tweetTags: ' #IT '
  },


  ebay : {
    enabled : false,
    params : {
      'outputSelector': [ ],
      'paginationInput.entriesPerPage' : 20,
      'affiliate.trackingId' : // affiliate tracking Id,
      'affiliate.networkId'  : // affiliate network Id,
      'affiliate.customId'   : // affiliate custom Id,
      'GLOBAL-ID' : 'EBAY-US'
    },

    appId : // Ebay API app Id,

    interval : 1000 * 60 * 60 * 15.7, //publish each 15.7 hours

    keywords: [
      'it'
    ]
  },


  amazon : {
    enabled : false,
    domain : 'webservices.amazon.com',
    searchIndex : 'Grocery',
    keys: {
      awsId:     // your aws key
      awsSecret: // your aws secret
      assocId:   // your associate id
      // xml2jsOptions: an extra, optional, parameter for if you want to pass additional options for the xml2js module. (see https://github.com/Leonidas-from-XIV/node-xml2js#options)
    },

    interval: 1000 * 60 * 60 * 9.5, //publish each 10.5 hours

    searches: [
      'wine',
      'spanish wine',
      'french wine',
      'italian wine',
      // ...
    ]
  }

}