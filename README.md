email-builder-core
==================

[![Join the chat at https://gitter.im/Email-builder/email-builder-core](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Email-builder/email-builder-core?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Email builder core for export into other projects

## Calling email builder should be like

```javascript
var emailBuilder = new EmailBuilder(options);

emailBuilder.run(html, callback);
```

It should return the compiled email in the callback
