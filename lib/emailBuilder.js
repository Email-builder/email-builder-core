var path        = require('path');
var os          = require('os');
var cheerio     = require('cheerio');
var mailer      = require('nodemailer');
var Litmus      = require('./litmus');
var Promise     = require('bluebird');
var juice       = Promise.promisifyAll(require('juice'));
var inliner     = Promise.promisifyAll(require('web-resource-inliner'));
var fs          = Promise.promisifyAll(require('fs'));
var utils       = require('./utils');
var _           = require('lodash');
var dateFormat  = require('dateformat');
var logger      = require('./logger');
var es          = require('event-stream');
var isHtml      = require('is-html');

function EmailBuilder(opts) {
  this.options  = _.assign(EmailBuilder.Defaults, opts);
}

EmailBuilder.Defaults = {
  encodeSpecialChars: false,
  relativePath: '',
  cheerio: {}
};

/**
* Inlines css using `juice.inlineContent` and keeps
* embedded styles using `web-resource-inliner`
*
* @param {String} src - src file
*
* @returns {Object} a promise which resolves with a new buffer
* of HTML that has css inlined on the elements
*
*/

EmailBuilder.prototype.inlineCss = function(src) {

  var cssStyles = '';
  var self = this;

  if ((Buffer.isBuffer(src) || isHtml(src)) && !this.options.relativePath) {
    throw new Error('Set the `options.relativePath` when passing a string or buffer');
  }

  function addCSS(data, cb) {
    data = utils.getData(data.toString(), self.options.cheerio);
    cssStyles += data.css;
    return cb(null, data);
  }

  function embedExternalStyles(data, cb) {

    // web-resource-inliner options
    var options = {
      fileContent: data.html,
      relativeTo: self.options.relativePath || path.dirname(src),
      images: false
    };

    inliner.htmlAsync(options)
      .then(function(results) {
        return cb(null, results);
      })
      .catch(function(err) { cb(err); });
  }

  return new Promise(function(resolve, reject) {

    utils.createStreamFromSrc(src)
      .pipe(es.wait())
      .pipe(es.map(addCSS))
      .pipe(es.map(embedExternalStyles))
      .pipe(es.map(function(result, cb) {

        var data = utils.getData(result, self.options.cheerio);
        var html = utils.removeHTMLAttr(data.html, 'data-embed');
        var css = cssStyles += data.css;

        css += self.options.extraCss;

        // Override juice cheerio xmlMode option if cheerio option specified
        self.options.juice = self.options.juice || {xmlMode: false};
        self.options.juice.xmlMode = self.options.cheerio.xmlMode || self.options.juice.xmlMode;

        juicedData = juice.inlineContent(html, css, self.options.juice);
        html = (self.options.encodeSpecialChars) ? utils.encode(juicedData) : juicedData;

        cb();
        return resolve(new Buffer(html));
      }));

  });

};

/**
* Send tests to Litmus App
*
* @param {String/Buffer} html

* @returns {String/Buffer} html to be passed to next promise
*
*/

EmailBuilder.prototype.sendLitmusTest = function(html) {

  html = (this.options.encodeSpecialChars) ? utils.encode(html) : html;

  if (this.options.litmus) {

    var litmus  = new Litmus(this.options.litmus);
    var now     = new Date();
    var date    = dateFormat(now, 'yyyy-mm-dd');
    var subject = this.options.litmus.subject || '';
    var $       = cheerio.load(html, this.options.cheerio);
    var $title  = $('title').text().trim();

    if (!subject) {
      subject = $title || date;
    }

    return litmus.run(html, subject.trim());

  } else {
    return Promise.resolve(html);
  }

};

/**
* Send an email test
*
* @param {String/Buffer} html
*
* @returns {String/Buffer} html to be passed to next promise
*
*/

EmailBuilder.prototype.sendEmailTest = function(html, text) {
  
  // Need to turn HTML to a string because some transport plugins 
  // do not support buffers
  html = Buffer.isBuffer(html) ? html.toString() : html;

  html = (this.options.encodeSpecialChars) ? utils.encode(html) : html;
  text = text || '';

  if (this.options.emailTest) {

    var emailTest           = this.options.emailTest;
    var transporter         = emailTest.nodemailer ? emailTest.nodemailer.transporter : false;
    var transporterDefaults = emailTest.nodemailer ? emailTest.nodemailer.defaults : false;
    var transport           = mailer.createTransport(transporter, transporterDefaults);

    if(emailTest.email){
      logger.warn('The `emailTest.email` property will be deprecated in the future. Please use `emailTest.from` and `emailTest.to` properties');
    }

    var mailOptions = {
      from: emailTest.from || emailTest.email,
      to: emailTest.to || emailTest.email,
      subject: emailTest.subject,
      text: text,
      html: html
    };

    logger.info('Sending test email to ' + emailTest.to || emailTest.email);

    return new Promise(function(resolve, reject) {

      transport.sendMail(mailOptions, function(error, response) {
        if (error) {
          return reject(error);
        }

        if (response.statusHandler) {
          // response.statusHandler only applies to 'direct' transport
          response.statusHandler.once('failed', function(data) {
            logger.error(
                'Permanently failed delivering message to %s with the following response: %s',
                data.domain, data.response);
            resolve(html);
          });

          response.statusHandler.once('requeue', function(data) {
            logger.warn('Temporarily failed delivering message to %s', data.domain);
            resolve(html);
          });

          response.statusHandler.once('sent', function(data) {
            logger.info('Message was accepted by %s', data.domain);
            resolve(html);
          });

        } else {
          logger.info(JSON.stringify(response, null, 2));
          logger.info('Message was sent');
          resolve(html);
        }

      });

    });

  } else {
    return Promise.resolve(html);
  }

};

module.exports = EmailBuilder;
