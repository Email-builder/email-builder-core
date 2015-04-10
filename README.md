email-builder-core
==================

[![Build Status](https://travis-ci.org/Email-builder/email-builder-core.svg)](https://travis-ci.org/Email-builder/email-builder-core) [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Email-builder/email-builder-core?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Email builder core for export into other projects

## Constructor  
#### `new EmailBuilder(options)`

Example:
```javascript
var EmailBuilder = require('email-builder-core');
var emailBuilder = new EmailBuilder({ encodeSpecialChars: true });
```

## Options

**options.emailSpecialChars**  
Type: `Boolean`  
Default: `false`  

Encodes special characters to their HTML numerical form e.g. © --> &amp;#169;

**options.litmus**  
Type: `Object`  
Default: `{}`  

Set in conjunction with `emailBuilder.sendLitmusTest` method to send tests to [Litmus](https://litmus.com/). This takes a few properties: `options.litmus.username`, `options.litmus.password`, `options.litmus.url`, `options.litmus.applications`

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

Set in conjunction with `emailBuilder.sendEmailTest` method to send yourself an email test. Requires two properties `options.emailTest.email` and `options.emailTest.subject` with an optional `options.emailTest.transport` property. View [nodmailer transport methods](https://github.com/andris9/Nodemailer/blob/0.7/README.md#setting-up-a-transport-method) if using `emailTest.transport` option

Example:

```javascript
  emailTest : {

    // Your Email
    email : 'yourEmail@email.com',

    // Your email Subject
    subject : 'Email Subject',

    // Optional
    transport: {
      type: 'SMTP',
      service: 'gmail',
      auth: {
        user: 'gmail.user@gmail.com',
        pass: 'gmailpass'
      }
    }
  }
```

**options.juice**  
Type: `Object`  
Default: `{}`  

The `emailBuilder.inlineCss` method uses Juice to inline. The following [Juice](https://github.com/Automattic/juice#options) options are supported:  

- `extraCss`
- `applyWidthAttributes`

## Methods

All methods return a promise, the underlying promise library we use is [Bluebird](https://github.com/petkaantonov/bluebird/blob/master/API.md). Methods can be used seperately, or chained together using the `.then` method. If you're not familiar with promises, instead of using a callback, you use a `.then` method to get the results. 

#### emailBuilder.inlineCss(file)  

**Arguments**  

`file` - String containing path to file  

Example:
```javascript
emailBuilder.inlineCss('path/to/file.html')
    .then(function(html){
        console.log(html);
    });
```

#### emailBuilder.sendLitmusTest(html)  

**Arguments**  

`html` - String/Buffer of HTML  

Example:  
```javascript
var fs = require('fs');
var file = fs.readFileSync('path/to/file.html');
emailBuilder.sendLitmusTest(file);
```

#### emailBuilder.sendEmailTest(html)  

**Arguments**  

`html` - String/Buffer of HTML  

Example:
```javascript
var fs = require('fs');
var file = fs.readFileSync('path/to/file.html');
emailBuilder.sendEmailTest(file);
```

## Complete Example

```javascript
var EmailBuilder = require('email-builder-core');
var emailBuilder = new EmailBuilder(options);

emailBuilder.inlineCss(src)
    .then(emailBuilder.sendLitmusTest)
    .then(emailBuilder.sendEmailTest)
    .then(function(html){
        // can write files here
        console.log(html);
    })
    catch(function(err){
        console.log(err);
    });
```

It should return the compiled email in the callback

## Testing

`gulp test` - Runs **jshint** and **mocha** tests  
`gulp inline` - Inlines css from the files in the `test/fixtures/input` directory and creates the `test/fixtures/output` directory. Run if you add/update any tests in the `test/fixtures/input`  


## Troubleshooting

If you're having issues with Litmus taking forever to load a test or the title of the test is showing up as "No Subject", it is most likely an issue with the Litmus API. You can check the [Litmus status](http://status.litmus.com) page to find out if their having any issues. If that's not the case, submit an issue and we'll look into further. 

## Thanks to
[Juice](https://github.com/Automattic/juice) for compiling.
