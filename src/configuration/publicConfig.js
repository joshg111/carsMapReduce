var cheerio = require('cheerio'); // Basically jQuery for node.js

var pConfig = {rp: {}};

// pConfig.rp.USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36';
pConfig.rp.USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36';


pConfig.rp.OPTIONS = {
  transform: function (body) {
      return cheerio.load(body);
  },
  headers: {
    'User-Agent': pConfig.rp.USER_AGENT
  },
  timeout: 6000
};


module.exports = pConfig;
