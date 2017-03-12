require('jquery');
require('angular/angular');
module.exports = window.angular;

require('angular-elastic/elastic');

require('ui/modules').get('kibana', ['monospaced.elastic']);
