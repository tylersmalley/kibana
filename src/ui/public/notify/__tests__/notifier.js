/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import _ from 'lodash';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import sinon from 'sinon';
import { Notifier } from '..';
import { metadata } from 'ui/metadata';

describe('Notifier', function () {
  let $interval;
  let notifier;
  let params;
  const message = 'Oh, the humanity!';

  beforeEach(function () {
    ngMock.module('kibana');

    ngMock.inject(function (_$interval_) {
      $interval = _$interval_;
    });
  });

  beforeEach(function () {
    params = { location: 'foo' };
    notifier = new Notifier(params);
  });

  afterEach(function () {
    Notifier.prototype._notifs.length = 0;
  });

  describe('#constructor()', function () {
    it('sets #from from given location', function () {
      expect(notifier.from).to.equal(params.location);
    });
  });

  describe('#error', function () {
    testVersionInfo('error');

    it('prepends location to message for content', function () {
      expect(notify('error').content).to.equal(params.location + ': ' + message);
    });

    it('sets type to "danger"', function () {
      expect(notify('error').type).to.equal('danger');
    });

    it('sets icon to "warning"', function () {
      expect(notify('error').icon).to.equal('warning');
    });

    it('sets title to "Error"', function () {
      expect(notify('error').title).to.equal('Error');
    });

    it('sets lifetime to 5 minutes', function () {
      expect(notify('error').lifetime).to.equal(300000);
    });

    it('sets timeRemaining and decrements', function () {
      const notif = notify('error');

      expect(notif.timeRemaining).to.equal(300);
      $interval.flush(1000);
      expect(notif.timeRemaining).to.equal(299);
    });

    it('closes notification on lifetime expiry', function () {
      const expectation = sinon.mock();
      const notif = notifier.error(message, expectation);

      expectation.once();
      expectation.withExactArgs('ignore');

      $interval.flush(300000);

      expect(notif.timerId).to.be(undefined);
    });

    it('allows canceling of timer', function () {
      const notif = notify('error');

      expect(notif.timerId).to.not.be(undefined);
      notif.cancelTimer();

      expect(notif.timerId).to.be(undefined);
    });

    it('resets timer on addition to stack', function () {
      const notif = notify('error');

      $interval.flush(100000);
      expect(notif.timeRemaining).to.equal(200);

      notify('error');
      expect(notif.timeRemaining).to.equal(300);
    });

    it('allows reporting', function () {
      const includesReport = _.includes(notify('error').actions, 'report');
      expect(includesReport).to.true;
    });

    it('allows accepting', function () {
      const includesAccept = _.includes(notify('error').actions, 'accept');
      expect(includesAccept).to.true;
    });

    it('includes stack', function () {
      expect(notify('error').stack).to.be.defined;
    });

    it('has css class helper functions', function () {
      expect(notify('error').getIconClass()).to.equal('fa fa-warning');
      expect(notify('error').getButtonClass()).to.equal('kuiButton--danger');
      expect(notify('error').getAlertClassStack()).to.equal('toast-stack alert alert-danger');
      expect(notify('error').getAlertClass()).to.equal('toast alert alert-danger');
      expect(notify('error').getButtonGroupClass()).to.equal('toast-controls');
      expect(notify('error').getToastMessageClass()).to.equal('toast-message');
    });
  });

  function notify(fnName, opts) {
    notifier[fnName](message, opts);
    return latestNotification();
  }

  function latestNotification() {
    return _.last(notifier._notifs);
  }

  function testVersionInfo(fnName) {
    describe('when version is configured', function () {
      it('adds version to notification', function () {
        const notification = notify(fnName);
        expect(notification.info.version).to.equal(metadata.version);
      });
    });
    describe('when build number is configured', function () {
      it('adds buildNum to notification', function () {
        const notification = notify(fnName);
        expect(notification.info.buildNum).to.equal(metadata.buildNum);
      });
    });
  }
});

describe('Directive Notification', function () {
  let notifier;
  let compile;
  let scope;

  const directiveParam = {
    template: '<h1>Hello world {{ unit.message }}</h1>',
    controllerAs: 'unit',
    controller() {
      this.message = '🎉';
    }
  };
  const customParams = {
    title: 'fooTitle',
    actions: [{
      text: 'Cancel',
      callback: sinon.spy()
    }, {
      text: 'OK',
      callback: sinon.spy()
    }]
  };
  let directiveNotification;

  beforeEach(() => {
    ngMock.module('kibana');
    ngMock.inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      compile = $compile;
      compile;
      scope;
    });

    notifier = new Notifier({ location: 'directiveFoo' });
    directiveNotification = notifier.directive(directiveParam, customParams);
  });

  afterEach(() => {
    Notifier.prototype._notifs.length = 0;
    directiveNotification.clear();
    scope.$destroy();
  });

  describe('returns a renderable notification', () => {
    let element;

    beforeEach(() => {
      scope.notif = notifier.directive(directiveParam, customParams);
      const template = `
        <render-directive
          definition="notif.directive"
          notif="notif"
        ></render-directive>`;
      element = compile(template)(scope);
      scope.$apply();
    });

    it('that renders with the provided template', () => {
      expect(element.find('h1').text()).to.contain('Hello world');
    });

    it('that renders with the provided controller', () => {
      expect(element.text()).to.contain('🎉');
    });
  });

  it('throws if first param is not an object', () => {
    // destroy the default custom notification, avoid duplicate handling
    directiveNotification.clear();

    function callDirectiveIncorrectly() {
      const badDirectiveParam = null;
      directiveNotification = notifier.directive(badDirectiveParam, {});
    }
    expect(callDirectiveIncorrectly).to.throwException(function (e) {
      expect(e.message).to.be('Directive param is required, and must be an object');
    });
  });

  it('throws if second param is not an object', () => {
    // destroy the default custom notification, avoid duplicate handling
    directiveNotification.clear();

    function callDirectiveIncorrectly() {
      const badConfigParam = null;
      directiveNotification = notifier.directive(directiveParam, badConfigParam);
    }
    expect(callDirectiveIncorrectly).to.throwException(function (e) {
      expect(e.message).to.be('Config param is required, and must be an object');
    });
  });

  it('throws if directive param has scope definition instead of allow the helper to do its work', () => {
    // destroy the default custom notification, avoid duplicate handling
    directiveNotification.clear();

    function callDirectiveIncorrectly() {
      const badDirectiveParam = {
        scope: {
          garbage: '='
        }
      };
      directiveNotification = notifier.directive(badDirectiveParam, customParams);
    }
    expect(callDirectiveIncorrectly).to.throwException(function (e) {
      expect(e.message).to.be('Directive should not have a scope definition. Notifier has an internal implementation.');
    });
  });

  it('throws if directive param has link function instead of allow the helper to do its work', () => {
    // destroy the default custom notification, avoid duplicate handling
    directiveNotification.clear();

    function callDirectiveIncorrectly() {
      const badDirectiveParam = {
        link: ($scope) => {
          /*eslint-disable no-console*/
          console.log($scope.nothing);
          /*eslint-enable*/
        }
      };
      directiveNotification = notifier.directive(badDirectiveParam, customParams);
    }
    expect(callDirectiveIncorrectly).to.throwException(function (e) {
      expect(e.message).to.be('Directive should not have a link function. Notifier has an internal link function helper.');
    });
  });

  it('has a directive function to make notifications with template and scope', () => {
    expect(notifier.directive).to.be.a('function');
  });

  it('sets the scope property and link function', () => {
    expect(directiveNotification).to.have.property('directive');
    expect(directiveNotification.directive).to.be.an('object');

    expect(directiveNotification.directive).to.have.property('scope');
    expect(directiveNotification.directive.scope).to.be.an('object');

    expect(directiveNotification.directive).to.have.property('link');
    expect(directiveNotification.directive.link).to.be.an('function');
  });

  /* below copied from custom notification tests */
  it('uses custom actions', () => {
    expect(directiveNotification).to.have.property('customActions');
    expect(directiveNotification.customActions).to.have.length(customParams.actions.length);
  });

  it('gives a default action if none are provided', () => {
    // destroy the default custom notification, avoid duplicate handling
    directiveNotification.clear();

    const noActionParams = _.defaults({ actions: [] }, customParams);
    directiveNotification = notifier.directive(directiveParam, noActionParams);
    expect(directiveNotification).to.have.property('actions');
    expect(directiveNotification.actions).to.have.length(1);
  });

  it('defaults type and lifetime for "info" config', () => {
    expect(directiveNotification.type).to.be('info');
    expect(directiveNotification.lifetime).to.be(5000);
  });

  it('should wrap the callback functions in a close function', () => {
    directiveNotification.customActions.forEach((action, idx) => {
      expect(action.callback).not.to.equal(customParams.actions[idx]);
      action.callback();
    });
    customParams.actions.forEach(action => {
      expect(action.callback.called).to.true;
    });
  });
});
