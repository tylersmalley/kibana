import expect from 'expect.js';
import sinon from 'sinon';
import mockFs from 'mock-fs';
import inquirer from 'inquirer';

import { Keystore } from '../../server/keystore';
import { add } from '../add';
import Logger from '../../cli_plugin/lib/logger';

describe('Kibana keystore', () => {
  describe('add', () => {
    const sandbox = sinon.sandbox.create();

    const keystoreData = 'vlXZaImfDAKf2ZvBRCKrr7u6/MYjuREUGho0/usYajyhmbQY63S9'
          + '9pjzJ9eA+IRmE2wj3Prd0LV3Z5ed144LnNIPc0I3RPNDVyxvZdQgkfe8HIFhIu7RA'
          + 'PsAmPzYyHGWdQtcREAlg3bxxjz85QX4p3SnCx8MXETcDQ==:1';

    beforeEach(() => {
      mockFs({
        '/data': {
          'test.keystore': JSON.stringify(keystoreData),
        }
      });

      sandbox.stub(Logger.prototype, 'log');
      sandbox.stub(Logger.prototype, 'error');
    });

    afterEach(() => {
      mockFs.restore();
      sandbox.restore();
    });

    it('returns an error for a nonexistent keystore', async () => {
      const keystore = new Keystore('/data/nonexistent.keystore');
      const message = 'ERROR: Kibana keystore not found. Use \'create\' command to create one.';

      await add(keystore, 'foo');

      sinon.assert.calledOnce(Logger.prototype.error);
      sinon.assert.calledWith(Logger.prototype.error, message);
    });

    it('does not attempt to create a keystore', async () => {
      const keystore = new Keystore('/data/nonexistent.keystore');
      sandbox.stub(keystore, 'save');

      await add(keystore, 'foo');

      sinon.assert.notCalled(keystore.save);
    });

    it('prompts for existing key', async () => {
      sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({
        overwrite: true,
        value: 'bar'
      }));

      const keystore = new Keystore('/data/test.keystore');
      await add(keystore, 'a2');

      sinon.assert.calledTwice(inquirer.prompt);
      const args = inquirer.prompt.getCall(0).args[0][0];

      expect(args.message).to.eql('Setting a2 already exists. Overwrite?');
      expect(args.default).to.be(false);
    });

    it('aborts if overwrite is denied', async () => {
      sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({
        overwrite: false
      }));

      const keystore = new Keystore('/data/test.keystore');
      await add(keystore, 'a2');

      sinon.assert.calledOnce(Logger.prototype.log);
      sinon.assert.calledWith(Logger.prototype.log, 'Exiting without modifying keystore.');
    });

    it('overwrites without prompt if force is supplied', async () => {
      sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({
        value: 'bar'
      }));

      const keystore = new Keystore('/data/test.keystore');
      sandbox.stub(keystore, 'save');

      await add(keystore, 'a2', { force: true });

      sinon.assert.calledOnce(keystore.save);
    });

    it('trims value', async () => {
      sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({
        value: 'bar\n'
      }));

      const keystore = new Keystore('/data/test.keystore');
      sandbox.stub(keystore, 'save');

      await add(keystore, 'foo');

      expect(keystore.data.foo).to.eql('bar');
    });

    it('persists updated keystore', async () => {
      sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({
        value: 'bar\n'
      }));

      const keystore = new Keystore('/data/test.keystore');
      sandbox.stub(keystore, 'save');

      await add(keystore, 'foo');

      sinon.assert.calledOnce(keystore.save);
    });

    it('accepts stdin', async () => {
      const keystore = new Keystore('/data/test.keystore');
      sandbox.stub(keystore, 'save');

      sandbox.stub(process.stdin, 'on');
      process.stdin.on = ((_, fn) => { fn(); });

      sandbox.stub(process.stdin, 'read');
      process.stdin.read.onCall(0).returns('kib');
      process.stdin.read.onCall(1).returns('ana');
      process.stdin.read.onCall(2).returns(null);

      await add(keystore, 'foo', { stdin: true });

      expect(keystore.data.foo).to.eql('kibana');
    });
  });
});
