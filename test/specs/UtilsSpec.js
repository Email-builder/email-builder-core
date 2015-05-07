var fs = require('fs');
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var utils = require('../../lib/utils');
var isStream = require('isstream');

describe("Utils", function() {
  
  describe("#removeEmptyAttrValue", function() {
    it('should remove empty attribute value from specified attribute', function(){
      var html = '<link href="" data-embed-ignore="" />';
      var expected = '<link href="" data-embed-ignore />';

      expect(utils.removeEmptyAttrValue(html, 'data-embed-ignore')).to.eql(expected);
    });
  });

  describe("#revertEmbedAttr", function() {
    it('should revert the `data-embed-ignore` attribute to `data-inline-ignore` for the `web-resource-inliner` module', function(){
      var html = '<link href="" data-embed-ignore />';
      var expected = '<link href="" data-inline-ignore />';

      expect(utils.revertEmbedAttr(html)).to.eql(expected);
    });
  });

  describe("#removeHTMLAttr", function() {
    it('should remove the specified attribute from HTML', function(){
      var html = '<style data-embed></style>';
      var expected = '<style></style>';

      expect(utils.removeHTMLAttr(html, 'data-embed')).to.eql(expected);
    });
  });

  describe("#getData", function() {
    it('return object with css and html properties', function(){
      var html = '<style>td { font-size: 12px; }</style><style data-embed> p { color: red; } </style>';
      var data = utils.getData(html);
      expect(data).to.be.an('object');
      expect(data.css).to.be.eql('td { font-size: 12px; }')
      expect(data.html).to.be.eql('<style data-embed="true"> p { color: red; } </style>')
    });
  });

  describe("#encode", function() {
    
    it('should encode special characters in a string', function(){
      var html = '<p>©</p>';
      var encodedHtml = utils.encode(html);

      expect(encodedHtml).to.be.eql('<p>&#169;</p>');
    });

    it('should encode special characters in a buffer', function(){
      var html = new Buffer('<p>©</p>');
      var encodedHtml = utils.encode(html);

      expect(Buffer.isBuffer(encodedHtml)).to.be.true;
      expect(encodedHtml.toString()).to.be.eql('<p>&#169;</p>');
    });

  });

  describe("#createStreamFromSrc", function() {

    var html = '<!doctype html><html><body></body></html>';
    var buffer = new Buffer(html);
    var path = process.cwd() + '/test/fixtures/output/embedded_styles_ignored.html';

    it('should return a stream if the src is an HTML string', function(){
      expect(isStream(utils.createStreamFromSrc(html))).to.be.true;
    });

    it('should return a stream if the src is a Buffer', function(){
      expect(isStream(utils.createStreamFromSrc(buffer))).to.be.true;
    });

    it('should return a stream if the src is a file path', function(){
      expect(isStream(utils.createStreamFromSrc(path))).to.be.true;
    });
  });



});