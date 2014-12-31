var EmailBuilder = require('./');
var fs = require('fs');

var emailBuilder = new EmailBuilder();

fs.readFile('test/example/html/htmlTest.html', 'utf8', function (err, data) {
  if (err) throw err;
  emailBuilder.run(data, './test/example/result/');
});
