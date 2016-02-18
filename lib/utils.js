var cheerio = require('cheerio');
var encode  = require('special-html');
var isHtml  = require('is-html');
var Stream  = require('stream');
var fs      = require('fs');

var utils = {

  /**
   * Removes the empty value from an attribute. `cheerio` adds an empty value
   * to attributes that have no values so we need to remove them in order
   * for `data-inline-ignore` attribute to work for `web-resource-inliner`
   *
   * @example
   * <link data-inline-ignore="" /> ==> <link data-inline-ignore />
   *
   * @param  {String} html
   * @returns {String} html
   */
  removeEmptyAttrValue : function(html, attr) {
    var reAttr = new RegExp('(\\b' + attr + '\\b)(?:=["\'](?:\\s+)?[\'"])?', 'g');
    return html.replace(reAttr, '$1');
  },

  /**
   * Reverts the `data-embed-ignore` attribute to the default
   * `inlineAttribute used by `web-resource-inliner`. This way
   * we can keep the attributes consistent on <style> and <link> tags
   *
   * @param  {String} html
   * @returns {String} new html
   */
  revertEmbedAttr : function(html) {
    return html.replace(/\bdata-embed-ignore\b/g, 'data-inline-ignore');
  },

  /**
   * Removes HTML attribute from all elements
   *
   * @param  {String} html
   * @param  {String} attr - attribute name
   * @returns {String} new html that has attribute removed
   */
  removeHTMLAttr : function(html, attr) {
    var reAttr = new RegExp('\\s+?\\b' + attr + '\\b(?:=["\'].*[\'"](?:\\s+)?)?', 'g');
    return html.replace(reAttr, '');
  },

  /**
   * Searches through each <style> tag, if it doesn't have a
   * data attribute, those styles are saved into a string that will
   * be passed to `juice.inlineContent`.
   *
   * @param  {String} html
   * @param  {Object} cheerio options object
   * @returns {Object} with css and html
   */
  getData : function(html, options) {

    options = options || {};
    options.decodeEntities = options.decodeEntities || false;

    var $ = cheerio.load(utils.revertEmbedAttr(html), options);
    var styles = $('style');
    var css = '';
    var attr, $this;

    styles.each(function() {
      $this = $(this);
      attr = $this.attr('data-embed' || 'data-inline-ignore');

      if (attr === undefined) {
        css += $this.text();
        $this.remove();
      } else {
        $this.attr('data-embed', 'true');
      }
    });

    return {
      css: css,
      html: utils.removeEmptyAttrValue($.html(), 'data-inline-ignore')
    };
  },

  encode : function(html) {
    var isBuffer = Buffer.isBuffer(html);
    return (isBuffer) ? new Buffer(encode(html.toString())) : encode(html);
  },

  createStreamFromSrc : function(src) {
    var stream;
    var buffer;

    if (isHtml(src)) {
      buffer = new Buffer(src);
    }

    if (Buffer.isBuffer(src)) {
      buffer = src;
    }

    if (isHtml(src) || Buffer.isBuffer(src)) {
      stream = Stream.PassThrough();
      stream.end(buffer);
    } else {
      stream = fs.createReadStream(src);
    }

    return stream;

  }

};

module.exports = utils;
