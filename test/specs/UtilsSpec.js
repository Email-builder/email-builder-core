var fs = require('fs');
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var utils = require('../../lib/utils');

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



});