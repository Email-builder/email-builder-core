'use strict';

var fs = require('fs');
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var EmailBuilder = require('../../lib/emailBuilder.js');

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

  beforeEach(function(){
    emailBuilder = new EmailBuilder({});
  });

  // emailBuilder.inlineCss
  describe("#inlineCss", function() {
    
    describe("conditional styles", function() {
      
      it('should be embedded', function(done){

        emailBuilder.inlineCss(getSrc('input/conditional_styles.html'))
          .then(function(bufferHtml){
            expect(bufferHtml.toString()).to.eql(read('output/conditional_styles.html'));
            done();
          }).catch(function(err){ done(err); });

      });
    });

    describe("embedded styles", function() {
      
      it("should be inlined", function(done) {
        emailBuilder.inlineCss(getSrc('input/embedded_styles_inlined.html'))
          .then(function(bufferHtml){
            expect(bufferHtml.toString()).to.eql(read('output/embedded_styles_inlined.html'));
            done();
          }).catch(function(err){ done(err); });
      });

      it("should NOT be inlined if `data-embed` attribute set", function(done) {
        emailBuilder.inlineCss(getSrc('input/embedded_styles_ignored.html'))
          .then(function(bufferHtml){
            expect(bufferHtml.toString()).to.eql(read('output/embedded_styles_ignored.html'));
            done();
          }).catch(function(err){ done(err); });
      });

    });

    describe("external styles", function() {
      
      it('should be inlined', function(done){
        emailBuilder.inlineCss(getSrc('input/external_styles_inlined.html'))
          .then(function(bufferHtml){
            expect(bufferHtml.toString()).to.eql(read('output/external_styles_inlined.html'));
            done();
          }).catch(function(err){ done(err); });
      });

      it("should be embedded if `data-embed` attribute set", function(done) {
        emailBuilder.inlineCss(getSrc('input/embedded_styles_ignored.html'))
          .then(function(bufferHtml){
            expect(bufferHtml.toString()).to.eql(read('output/embedded_styles_ignored.html'));
            done();
          }).catch(function(err){ done(err); });
      });

      it("should NOT be inlined or embedded if `data-embed-ignore` attribute set", function(done) {
        emailBuilder.inlineCss(getSrc('input/embedded_styles_ignored.html'))
          .then(function(bufferHtml){
            expect(bufferHtml.toString()).to.eql(read('output/embedded_styles_ignored.html'));
            done();
          }).catch(function(err){ done(err); });
      });

    });
    
    describe("special characters", function() {
      it("should be encoded if `options.encodeSpecialChars` is true", function(done) {
        emailBuilder.options.encodeSpecialChars = true;
        emailBuilder.inlineCss(getSrc('input/encoded_special_characters.html'))
          .then(function(bufferHtml){
            expect(bufferHtml.toString()).to.eql(read('output/encoded_special_characters.html'));
            done();
          }).catch(function(err){ done(err); })
      });
    });

  });

});