var mailer    = require('nodemailer');
var fs        = require('fs');
var cheerio   = require('cheerio');
var builder   = require('xmlbuilder');
var Table     = require('cli-table');
var LitmusAPI = require('litmus-api');
var _         = require('lodash');
var logger    = require('./logger');
var Promise   = require('bluebird');

function Litmus(options) {
  this.options = options;
  this.initVars();
}

// Initialize variables
Litmus.prototype.initVars = function() {
  this.api = new LitmusAPI({
    username: this.options.username,
    password: this.options.password,
    url: this.options.url
  });
};

/**
* Calculate and get the average time for test to complete
*
* @param {String} body - xml body returned from response
*
* @returns {String} average time in seconds/minutes
*
*/

Litmus.prototype.getAvgTime = function(body) {
  var $ = cheerio.load(body, {xmlMode: true});
  var avgTimes = $('average_time_to_process');
  var count = 0;

  avgTimes.each(function(i, el) {
    count += +$(this).text();
  });

  return (count < 60) ? (count + ' secs') : (Math.round((count / avgTimes.length) / 60) + ' mins');

};

/**
* Get the status of each result in a test
*
* @param {String} body - xml body returned from response
*
* @returns {Object} map of delayed and unavailable clients based on status
*
*/

Litmus.prototype.getStatus = function(body) {
  var $ = cheerio.load(body, {xmlMode: true});
  var statuses = $('status');
  var delayed = [];
  var unavailable = [];
  var statusCode;
  var application;

  statuses.each(function(i, el) {
    var $this = $(this);
    statusCode = +$this.text();
    application = $this.parent().children('application_long_name').text();

    if (statusCode === 1) { delayed.push(application); }

    if (statusCode === 2) { unavailable.push(application); }
  });

  return {
    delayed: delayed.join('\n'),
    unavailable: unavailable.join('\n')
  };

};

/**
* Creates a nice looking table on the command line that logs the
* average time it takes for a test to complete and delayed and unavailable clients
*
* @param {String} body - xml body returned from response
*
*/

Litmus.prototype.logStatusTable = function(body) {
  var table = new Table();
  var delayed = this.getStatus(body).delayed;
  var unavailable = this.getStatus(body).unavailable;
  var avgTime = this.getAvgTime(body);
  var values = [];

  table.options.head = ['Avg. Time to Complete'];
  values.push(avgTime);

  if (delayed.length > 0) {
    table.options.head.push('Delayed');
    values.push(delayed);
  }

  if (unavailable.length > 0) {
    table.options.head.push('Unavailable');
    values.push(unavailable);
  }

  table.push(values);

  console.log(table.toString());
};

/**
* Logs headers of response once email is sent
*
* @param {Array} data - array of data returned from promise
*
*/

Litmus.prototype.logHeaders = function(data) {

  var res = data[0];
  var body = data[1];
  var headers = res.headers;
  var status = parseFloat(headers.status, 10);

  Object.keys(headers).forEach(function(key) {
    console.log(key.toUpperCase() + ': ' + headers[key]);
  });

  console.log('---------------------\n' + body);

  if (status > 199 && status < 300) {
    logger.info('Test sent!');
    this.logStatusTable(body);
  } else {
    throw new Error(headers.status);
  }

};

/**
* Mail a new test using the test email Litmus provides in the <url_or_guid> tag
*
* @param {Array} data - array of data returned from promise
*
*/

Litmus.prototype.mailNewVersion = function(data) {

  var body = data[1];
  var self = this;
  var $ = cheerio.load(body);
  var guid = $('url_or_guid').text();
  var transport = mailer.createTransport();
  var mailOptions = {
    from: 'no-reply@test.com',
    to: guid,
    subject: this.title,
    text: '',
    html: this.html
  };

  return new Promise(function(resolve, reject) {

    transport.sendMail(mailOptions, function(error, response) {
      if (error) { return reject(error); }

      if (response.statusHandler) {
        response.statusHandler.once('sent', function(data) {
          logger.info('Message was accepted by %s', data.domain);
          resolve(self.html);
        });
      } else {
        logger.info(response.message);
        logger.info('Message was sent');
        resolve(self.html);
      }

    });

  }).then(function() {
    logger.info('New version sent!');
    self.logStatusTable(body);
  });

};

/**
* Builds xml body
*
* @param {String} html - final html output
* @param {String} title - title that will be used to name the Litmus test
*
* @returns {Object} xml body for the request
*
*/

Litmus.prototype.getBuiltXml = function(html, title) {
  var xmlApplications = builder.create('applications').att('type', 'array');

  _.each(this.options.applications, function(app) {
    var item = xmlApplications.ele('application');

    item.ele('code', app);
  });

  //Build Xml to send off, Join with Application XMl
  var xml = builder.create('test_set')
    .importXMLBuilder(xmlApplications)
    .ele('save_defaults', 'false').up()
    .ele('use_defaults', 'false').up()
    .ele('email_source')
      .ele('body').dat(html).up()
      .ele('subject', title)
    .end({pretty: true});

  return xml;
};

/**
* Grab the name of email and set id if it matches title/subject line
*
* @param {String} body - xml body of all tests
*
* @returns {Object} a map with the id
*
*/

Litmus.prototype.getId = function(body) {
  var xml = body[1];

  var $ = cheerio.load(xml, {xmlMode: true});
  var $allNameTags = $('name');
  var subjLine = this.title;
  var id;
  var $matchedName = $allNameTags.filter(function() {
        return $(this).text() === subjLine;
      });

  if ($matchedName.length) {
    id = $matchedName.eq(0).parent().children('id').text();
  }

  return {
    id: id
  };
};

/**
* Send a new test
*
* @param {Object} data - object map that contains the id passed
*
* @returns {Object} a promise
*
*/

Litmus.prototype.sendTest = function(data) {

  var body = this.getBuiltXml(this.html, this.title);

  logger.info('Sending new test: ' + this.title);
  return this.api.createEmailTest(body)
    .bind(this)
    .then(this.logHeaders);
};

/**
* Starts the initialization
*
* @param {String} html - final html output
* @param {String} title - title that will be used to name the Litmus test
*
* @returns {Object} a promise
*
*/

Litmus.prototype.run = function(html, title) {
  this.title = this.options.subject;
  this.delay = this.options.delay || 3500;

  if ((this.title === undefined) || (this.title.trim().length === 0)) {
    this.title = title;
  }

  this.html = html;

  return this.api.getTests()
    .bind(this)
    .then(this.getId)
    .then(this.sendTest)
    .return(html);

};

module.exports = Litmus;
