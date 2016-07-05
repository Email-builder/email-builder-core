email-builder-core
==================

[![Build Status](https://travis-ci.org/Email-builder/email-builder-core.svg)](https://travis-ci.org/Email-builder/email-builder-core) [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Email-builder/email-builder-core?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Email builder core for export into other projects

# Constructor  
### `new EmailBuilder(options)`  

Example:
```javascript
var EmailBuilder = require('email-builder-core');
var emailBuilder = new EmailBuilder({ encodeSpecialChars: true });
```

# Options

The following options may support all available methods of EmailBuilder.  However there some that are only needed for a particular method.

**options.encodeSpecialChars**  
Type: `Boolean`  
Default: `false`  
Supported Method(s): `All`  

Encodes special characters to their HTML numerical form e.g. © --> &amp;#169;

**options.relativePath**  
Type: `String`  
Default: `''`  
Supported Method(s): `emailBuilder.inlineCss`  

This option must be set when passing a Buffer or a String to the `inlineCss` method. That way it has a relative path to any css files. The path should be whatever directory your src file is in. 

**options.litmus**  
Type: `Object`  
Default: `{}`  
Properties: `username`, `password`, `url`, `applications`  
Supported Method(s): `emailBuilder.sendLitmusTest`  

Example:
```javascript
litmus : {

  // Optional, defaults to title of email or yyyy-mm-dd if <title> and options.subject not set
  subject : 'Custom subject line',

  // Litmus username
  username : 'username',

  // Litmus password
  password : 'password',

  // Url to your Litmus account
  url : 'https://yoursite.litmus.com',

  // Email clients to test for. Find them at http://yoursite.litmus.com/emails/clients.xml
  // The <application_code> tags contain the name e.g. Gmail Chrome: <application_code> chromegmailnew </application_code>
  applications : ['gmailnew', 'hotmail', 'outlookcom', 'ol2000', 'ol2002', 'ol2003', 'ol2007', 'ol2010','ol2011', 'ol2013', 'appmail8', 'iphone5', 'ipad3']
}
```

**options.emailTest**  
Type: `Object`  
Default: `{}`  
Properties: `to`, `from`, `subject`, `nodemailer`  
Supported Method(s): `emailBuilder.sendEmailTest`  


The optional `nodemailer` property is an object that has `transporter` and `defaults` properties. These get passed to the [nodemailer.createTransport()](https://github.com/nodemailer/nodemailer#setting-up) method. You can use [transport plugins](https://github.com/nodemailer/nodemailer#send-using-a-transport-plugin) or play with the default [SMTP](https://github.com/nodemailer/nodemailer#set-up-smtp) options for the `nodemailer.transporter` property

Example:

```javascript

  emailTest : {

  // Email to send to
  to : 'toEmail@email.com',

  // Email sent from
  from: 'fromEmail@email.com'

  // Your email Subject
  subject : 'Email Subject',

  // Optional
  nodemailer: {
    transporter: {
      service: 'gmail',
      auth: {
        user: 'gmailuser',
        pass: 'gmailpass'
      }
    }, 
    defaults: {} 
  }
}
```

**options.juice**  
Type: `Object`  
Default: `{}`  
Supported Properties: `extraCss`, `applyWidthAttributes`, `applyAttributesTableElements`  
Supported Method(s): `emailBuilder.inlineCss`  

View [Juice](https://github.com/Automattic/juice#options) options

**options.cheerio**  
Type: `Object`  
Default: `{}`  

View [Cheerio](https://github.com/cheeriojs/cheerio) options.



# Methods

All methods return a promise, the underlying promise library we use is [Bluebird](https://github.com/petkaantonov/bluebird/blob/master/API.md). Methods can be used seperately, or chained together using the `.then` method. If you're not familiar with promises, instead of using a callback, you chain a `.then` method to get the results.

### `emailBuilder.inlineCss(file/html/buffer)`  

Inlines css from embedded or external styles. It'll automatically remove any link or style tags unless one of the data attributes below are used. View [test fixtures](https://github.com/Email-builder/email-builder-core/tree/master/test/fixtures) to see examples.

**Arguments**  

`file` - String containing path to file  
`string` - String of HTML  
`buffer` - Buffer of HTML  

**HTML data attributes**  
There are two supported data attributes that you can apply to \<style\> or \<link\> tags that have special meaning:

`data-embed`
  - use on \<style\> or \<link\> tags if you want styles to be embedded in the \<head\> of the final output. Does not inline css  

`data-embed-ignore`
  - use on \<link\> tags to preserve them in the \<head\>. Does not inline or embed css  

Example:  
```javascript
emailBuilder.inlineCss('path/to/file.html')
    .then(function(html){
        console.log(html);
    });
```

### `emailBuilder.sendLitmusTest(html)`  

Send tests to [Litmus](https://litmus.com/).

**Arguments**  

`html` - String/Buffer of HTML  

Example:  
```javascript
var fs = require('fs');
var file = fs.readFileSync('path/to/file.html');
emailBuilder.sendLitmusTest(file)
  .then(function(html){
    console.log(html);
  });
```

### `emailBuilder.sendEmailTest(html)`  

Send email tests to yourself

**Arguments**  

`html` - String/Buffer of HTML  

Example:
```javascript
var fs = require('fs');
var file = fs.readFileSync('path/to/file.html');
emailBuilder.sendEmailTest(file)
  .then(function(html){
    console.log(html);
  });
```

# Complete Example

**input.html**
```html
<!DOCTYPE html>
<html>
<head>
  <!-- styles will be inlined -->
  <link rel="stylesheet" type="text/css" href="../css/styles.css">

  <!-- styles will be embedded -->
  <link rel="stylesheet" type="text/css" href="../css/otherStyles.css" data-embed>

  <!-- link tag will be preserved and styles will not be inlined or embedded -->
  <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css' data-embed-ignore>

  <!-- styles will be inlined -->
  <style>
    p { color: red; }
  </style>

  <!-- styles will be embedded -->
  <style data-embed>
    h1 { color: black; }
  </style>
</head>
<body>
  <h1>Heading</h1>
  <p>Body</p>
</body>
</html>
```

**main.js**
```javascript
var fs = require('fs');
var EmailBuilder = require('email-builder-core');
var options = {
  encodeSpecialChars: true,
  litmus: {...},
  emailTest: {...}
};
var emailBuilder = new EmailBuilder(options);
var src = process.cwd() + '/input.html';

emailBuilder.inlineCss(src)
    .then(emailBuilder.sendLitmusTest)
    .then(emailBuilder.sendEmailTest)
    .then(function(html){
        // can write files here
        fs.writeFileSync(process.cwd() + '/out.html', html);
    })
    catch(function(err){
        console.log(err);
    });
```

**out.html**
```html
<!DOCTYPE html>
<html>
<head>
  <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>
  <style>
    h1 { color: black; }
  </style>
</head>
<body>
  <h1>Heading</h1>
  <p style="color: red">Body</p>
</body>
</html>
```

# Testing

`gulp test` - Runs **jshint** and **mocha** tests  
`gulp inline` - Inlines css from **test/fixtures/input** directory and creates the **test/fixtures/output** directory. Run if you add/update any fixtures in the **test/fixtures/input** directory.  


# Troubleshooting

If you're having issues with Litmus taking forever to load a test or the title of the test is showing up as "No Subject", it is most likely an issue with the Litmus API. You can check the [Litmus status](http://status.litmus.com) page to find out if their having any issues. If that's not the case, submit an issue and we'll look into further.

# Thanks to
[Juice](https://github.com/Automattic/juice) for compiling.
