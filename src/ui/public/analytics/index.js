import uiModules from 'ui/modules';

uiModules.get('kibana', ['ngOpbeat']).config(function ($opbeatProvider) {
  $opbeatProvider.config({
    orgId: '03fa5da6d7be4513b185ec61c2588e22',
    appId: '78f9d70ccb'
  });
});
