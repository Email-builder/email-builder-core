'use strict';

var fs           = require('fs');
var path         = require('path');
var expect       = require('chai').expect;
var sinon        = require('sinon');
var Promise      = require('bluebird');
var EmailBuilder = require('../../lib/emailBuilder.js');
var Litmus       = require('../../lib/litmus');


function getSrc(file){
  file = file || '';
  return path.join(process.cwd(), 'test', 'fixtures', file);
}

function read(file){
  return fs.readFileSync(getSrc(file), 'utf8');
}

describe("EmailBuilder", function() {
  
  var emailBuilder;
  var src;
  var obj;

  beforeEach(function(){
    emailBuilder = new EmailBuilder({});
  });

  // emailBuilder.inlineCss
  describe("#inlineCss", function() {

    it('should inline css from file', function(done){

      var file = getSrc('input/embedded_styles_inlined.html');

      emailBuilder.inlineCss(file)
        .then(function(html){
          expect(html.toString()).to.eql(read('output/embedded_styles_inlined.html'));
          done();
        }).catch(function(err){ done(err); });
    });

    it('should inline css from a buffer', function(done){

      var buffer = new Buffer(read('input/embedded_styles_inlined.html'));
      emailBuilder.options.relativePath = path.dirname(getSrc('input/embedded_styles_inlined.html'));

      emailBuilder.inlineCss(buffer)
        .then(function(html){
          expect(html.toString()).to.eql(read('output/embedded_styles_inlined.html'));
          done();
        }).catch(function(err){ done(err); });
    });

    it('should inline css from a string of HTML', function(done){

      var html = read('input/embedded_styles_inlined.html');
      emailBuilder.options.relativePath = path.dirname(getSrc('input/embedded_styles_inlined.html'));

      emailBuilder.inlineCss(html)
        .then(function(html){
          expect(html.toString()).to.eql(read('output/embedded_styles_inlined.html'));
          done();
        }).catch(function(err){ done(err); });
    });

    it('should throw error if `options.relativePath` property not set when passing a string', function(){

      var html = read('input/embedded_styles_inlined.html');
      emailBuilder.options.relativePath = null;

      expect(function(){ emailBuilder.inlineCss(html) }).to.throw(Error);
    });

    it('should throw error if `options.relativePath` property not set when passing a buffer', function(){

      var html = new Buffer(read('input/embedded_styles_inlined.html'));
      emailBuilder.options.relativePath = null;

      expect(function(){ emailBuilder.inlineCss(html) }).to.throw(Error);
    });
    
    describe("conditional styles", function() {
      
      it('should be embedded', function(done){

        emailBuilder.inlineCss(getSrc('input/conditional_styles.html'))
          .then(function(html){
            expect(html.toString()).to.eql(read('output/conditional_styles.html'));
            done();
          }).catch(function(err){ done(err); });

      });
    });

    describe("embedded styles", function() {
      
      it("should be inlined", function(done) {
        emailBuilder.inlineCss(getSrc('input/embedded_styles_inlined.html'))
          .then(function(html){
            expect(html.toString()).to.eql(read('output/embedded_styles_inlined.html'));
            done();
          }).catch(function(err){ done(err); });
      });

      it("should NOT be inlined if `data-embed` attribute set", function(done) {
        emailBuilder.inlineCss(getSrc('input/embedded_styles_ignored.html'))
          .then(function(html){
            expect(html.toString()).to.eql(read('output/embedded_styles_ignored.html'));
            done();
          }).catch(function(err){ done(err); });
      });

    });

    describe("external styles", function() {
      
      it('should be inlined', function(done){
        emailBuilder.inlineCss(getSrc('input/external_styles_inlined.html'))
          .then(function(html){
            expect(html.toString()).to.eql(read('output/external_styles_inlined.html'));
            done();
          }).catch(function(err){ done(err); });
      });

      it("should be embedded if `data-embed` attribute set", function(done) {
        emailBuilder.inlineCss(getSrc('input/embedded_styles_ignored.html'))
          .then(function(html){
            expect(html.toString()).to.eql(read('output/embedded_styles_ignored.html'));
            done();
          }).catch(function(err){ done(err); });
      });

      it("should NOT be inlined or embedded if `data-embed-ignore` attribute set", function(done) {
        emailBuilder.inlineCss(getSrc('input/embedded_styles_ignored.html'))
          .then(function(html){
            expect(html.toString()).to.eql(read('output/embedded_styles_ignored.html'));
            done();
          }).catch(function(err){ done(err); });
      });

    });
    
    describe("special characters", function() {
      it("should be encoded if `options.encodeSpecialChars` is true", function(done) {
        emailBuilder.options.encodeSpecialChars = true;
        emailBuilder.inlineCss(getSrc('input/encoded_special_characters.html'))
          .then(function(html){
            expect(html.toString()).to.eql(read('output/encoded_special_characters.html'));
            done();
          }).catch(function(err){ done(err); })
      });
    });

  });

  // emailbuilder.sendLitmusTest
  describe("#sendLitmusTest", function() {

    var stub;
    var options;
    var html;

    beforeEach(function(){

      html = '<title>Test Title</title>';

      options = emailBuilder.options.litmus = {
        username: 'user',
        password: 'pass',
        url: 'http://testcompany.litmus.com'
      };

      stub = sinon.stub(Litmus.prototype, 'run', function(html, subject){
        return Promise.resolve({ 
          html: html, 
          subject: subject
        });
      });

    });

    afterEach(function(){
      Litmus.prototype.run.restore();
    });
    

    describe("subject", function() {
      it("should use optional `options.subject` as the subject if defined", function(done) {
        
        options.subject = 'Subject Title';

        emailBuilder.sendLitmusTest(html)
          .then(function(obj){
            expect(stub.called).to.be.true;
            expect(stub.calledWith(html, 'Subject Title')).to.be.true;
            expect(obj.subject).to.equal(options.subject);
            done();
          });
        
      });

      it("should use <title> as the subject if `options.subject` not defined", function(done) {

        emailBuilder.sendLitmusTest(html)
          .then(function(obj){
            expect(stub.called).to.be.true;
            expect(stub.calledWith(html, 'Test Title')).to.be.true;
            expect(obj.subject).to.equal('Test Title');
            done();
          });
        
      });


      it("should use date as the subject if no title or subject is defined", function(done) {
        
        html = '<title></title>';
        var dateReg = /\d{4}-\d{2}-\d{2}/;

        emailBuilder.sendLitmusTest(html)
          .then(function(obj){
            expect(stub.called).to.be.true;
            expect(stub.calledWithMatch(sinon.match(html), sinon.match(dateReg))).to.be.true;
            expect(dateReg.test(obj.subject)).to.be.true;
            done();
          });
        
      });
    });

    describe("html", function() {
      it("should return html if `options.litmus` defined", function(done) {  

        emailBuilder.sendLitmusTest(html)
          .then(function(data){
            expect(stub.called).to.be.true;
            expect(data.html).to.equal(html);
            done();
          });
      });

      it("should return html if `options.litmus` undefined", function(done) {  
        
        delete emailBuilder.options.litmus;

        emailBuilder.sendLitmusTest(html)
          .then(function(data){
            expect(stub.called).to.be.false;
            expect(data).to.equal(html);
            done();
          });
      });
    });

    describe("special characters", function() {
      it("should encode html if `options.encodeSpecialChars` defined", function(done) {  
         
        delete emailBuilder.options.litmus;      
        emailBuilder.options.encodeSpecialChars = true;

        html = '<p>©</p>';

        emailBuilder.sendLitmusTest(html)
          .then(function(data){
            expect(data).to.equal('<p>&#169;</p>');
            done();
          });
      });
    });

  });

  // emailBuilder.sendEmailTest
  describe("#sendEmailTest", function() {
    
    describe("special characters", function() {
      it("should encode html if `options.encodeSpecialChars` defined", function(done) {  
               
        emailBuilder.options.encodeSpecialChars = true;

        var html = '<p>©</p>';

        emailBuilder.sendEmailTest(html)
          .then(function(data){
            expect(data).to.equal('<p>&#169;</p>');
            done();
          });
      });
    });

  });

});
