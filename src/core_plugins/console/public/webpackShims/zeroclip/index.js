var ZeroClipboard = require('./zero_clipboard.js');

ZeroClipboard.config({
  swfPath: require('file-loader!./zero_clipboard.swf'),
  debug: false
});

module.exports = ZeroClipboard;
