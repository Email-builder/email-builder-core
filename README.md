email-builder-core
==================

Email builder core for export into other projects

## Calling email builder should be like

```javascript
var emailBuilder = new EmailBuilder(options);

emailBuilder.run(html, callback);
```

It should return the compiled email in the callback
