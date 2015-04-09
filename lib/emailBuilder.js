/* jshint -W030,-W117 */

// Required modules
var path    = require('path');
var os      = require('os');
var cheerio = require('cheerio');
var mailer  = require('nodemailer');
var Litmus  = require('./litmus');
var encode  = require('special-html');
var Promise = require('bluebird');
var juice   = Promise.promisifyAll(require('juice'));
var inliner = Promise.promisifyAll(require('web-resource-inliner'));
var fs      = Promise.promisifyAll(require('fs'));
var utils   = require('./utils');
var _       = require('lodash');


function EmailBuilder(opts) {
  this.options  = _.assign(EmailBuilder.Defaults, opts);
  this.basepath = process.cwd();
}

EmailBuilder.taskName         = 'emailBuilder';
EmailBuilder.taskDescription  = 'Compile Files';
EmailBuilder.Defaults         = {
  // removeStyleTags: true,
  // removeLinkTags: true,
  applyWidthAttributes: true,
  extraCss: '',
  // preserveMediaQueries: true
};


/**
* Inlines css using juice2 and adds the ignored styles back in after
* css has been inlined
*
* @param {String} src - src file 
* @param {String} dest - destination file
*
* @returns {Object} a promise which resolves with an object literal containing 
* the src file, destination file, and final html output
* 
*/

EmailBuilder.prototype.inlineCss = function(src) {

  var cssStyles = '';

  function addCSS(data){
    cssStyles += data.css;
    return data;
  }

  function addWebResourcesOpts(data){
    this.options.webResources = {
      fileContent: data.html,
      relativeTo: path.dirname(src)
    };
    return this.options.webResources;
  }

  function embedExternalStyles(opts){
    return inliner.htmlAsync(opts);
  }
  
  return fs.readFileAsync(src, 'utf8')
    .bind(this)
    .then(utils.getData)
    .then(addCSS)
    .then(addWebResourcesOpts)
    .then(embedExternalStyles)
    .then(function(result){
      
      var data = utils.getData(result);
      var html = utils.removeHTMLAttr(data.html, 'data-embed');
      var css = cssStyles += data.css;
      css += this.options.extraCss;

      return encode( juice.inlineContent(html, css, this.options) );

    });

};


/**
* Send tests to Litmus App  
*
* @param {String} html - html to be sent   
*
* @returns {String} html to be passed to next promise 
* 
*/

EmailBuilder.prototype.sendLitmus = function(html) {

  if(this.options.litmus){
    var litmus    = new Litmus(this.options.litmus);
    var date      = this.task.grunt.template.today('yyyy-mm-dd');
    var subject   = this.options.litmus.subject;
    var $         = cheerio.load(html);
    var $title    = $('title').text().trim();
    var files     = this.task.filesSrc;
    var titleDups = {};

    if( (subject === undefined) || (subject.trim().length === 0) ){
      subject = $title;
    }

    // If no subject or title then set to date
    if(subject.trim().length === 0){
      subject = date;
    }

    // Add +1 if duplicate titles exists
    if(files.length > 1){

      if(titleDups[subject] === undefined){
        titleDups[subject] = [];
      }else{
        titleDups[subject].push(html);
      }
      
      if(titleDups[subject].length){
        subject = subject + ' - ' + parseInt(titleDups[subject].length + 1, 10);
      }

    }

    return litmus.run(html, subject.trim());

  } else {
    return html;
  }

};



/**
* Send an email test  
*
* @param {String} html - html to be sent   
*
* @returns {String} html to be passed to next promise 
* 
*/

EmailBuilder.prototype.sendEmailTest = function(html) {

    if(this.options.emailTest){

      var emailTest     = this.options.emailTest;
      var transportType = emailTest.transport ? emailTest.transport.type : false;
      var transportOpts = emailTest.transport ? emailTest.transport.options : false;
      var transport     = mailer.createTransport(transportType, transportOpts);
      var mailOptions = {
        from: emailTest.email,
        to: emailTest.email,
        subject: emailTest.subject,
        text: '',
        html: html
      };

      this.grunt.log.writeln('Sending test email to ' + emailTest.email);
      
      return new Promise(function(resolve, reject){

        transport.sendMail(mailOptions, function(error, response) {
          if(error) { return reject(error); }

          if(response.statusHandler){
            response.statusHandler.once("sent", function(data){
              console.log("Message was accepted by %s", data.domain);
              resolve(html);
            });
          } else {
            console.log(response.message);
            console.log("Message was sent");
            resolve(html);
          }

        });

      }); 

    } else {
      return html;
    }

};



/**
* Run task
*
* @param {Object} grunt - grunt object   
*
* @returns {Object} a promise that resolves with final html
* 
*/

EmailBuilder.prototype.run = function() {

  var files = Promise.resolve(this.task.files);

  return files
    .bind(this)
    .map(function(fileMap){

      var srcFile  = fileMap.src[0];
      var destFile = fileMap.dest;
      
      return this.inlineCss(srcFile, destFile)
        .then(this.writeFile)
        .then(this.sendLitmus)
        .then(this.sendEmailTest);

    })
    .catch(function(err){ this.grunt.log.error(err); });
};

module.exports = EmailBuilder;