email-builder-core
==================

![travis build](https://travis-ci.org/Email-builder/email-builder-core.svg?branch=develop)

Email builder core for export into other projects

## Calling email builder should be like

```javascript
var emailBuilder = new EmailBuilder(options);

emailBuilder.inlineCss(src)
    .then(function(html){
        console.log(html);
    });
```

It should return the compiled email in the callback
