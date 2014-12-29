'use strict';

var fs = require('fs');
var EmailBuilder = require('./index.js');

/*
======== A Handy Little Nodeunit Reference ========
https://github.com/caolan/nodeunit

Test methods:
test.expect(numAssertions)
test.done()
Test assertions:
test.ok(value, [message])
test.equal(actual, expected, [message])
test.notEqual(actual, expected, [message])
test.deepEqual(actual, expected, [message])
test.notDeepEqual(actual, expected, [message])
test.strictEqual(actual, expected, [message])
test.notStrictEqual(actual, expected, [message])
test.throws(block, [error], [message])
test.doesNotThrow(block, [error], [message])
test.ifError(value)
*/

exports.emailBuilderTest = {
  setUp: function(done) {
    // setup here if necessary

    this.emailBuilder = new EmailBuilder();

    done();
  },
  default_options: function(test) {

    var actual;
    var expected;

    test.expect(5);

    actual = grunt.file.read('reports/test-report');
    expected = grunt.file.read('test/expected/test-report');
    test.equal(actual, expected, 'Should produce a default report without DOM element for a test file');

    test.done();
  }
};
