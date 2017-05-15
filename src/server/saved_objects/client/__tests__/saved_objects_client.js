import expect from 'expect.js';
import sinon from 'sinon';
import { SavedObjectsClient } from '../saved_objects_client';

describe('SavedObjectsClient', () => {
  let callWithRequest;
  let savedObjectsClient;
  const docs = {
    hits: {
      total: 3,
      hits: [{
        _index: '.kibana',
        _type: 'index-pattern',
        _id: 'logstash-*',
        _score: 1,
        _source: {
          title: 'logstash-*',
          timeFieldName: '@timestamp',
          notExpandable: true
        }
      }, {
        _index: '.kibana',
        _type: 'config',
        _id: '6.0.0-alpha1',
        _score: 1,
        _source: {
          buildNum: 8467,
          defaultIndex: 'logstash-*'
        }
      }, {
        _index: '.kibana',
        _type: 'index-pattern',
        _id: 'stocks-*',
        _score: 1,
        _source: {
          title: 'stocks-*',
          timeFieldName: '@timestamp',
          notExpandable: true
        }
      }]
    }
  };

  beforeEach(() => {
    callWithRequest = sinon.mock();
    savedObjectsClient = new SavedObjectsClient('.kibana-test', {}, callWithRequest);
  });

  afterEach(() => {
    callWithRequest.reset();
  });


  describe('#create', () => {
    it('formats Elasticsearch response', async () => {
      callWithRequest.returns({ _type: 'index-pattern', _id: 'logstash-*' });

      const response = await savedObjectsClient.create('index-pattern', {
        id: 'logstash-*',
        title: 'Logstash'
      });

      expect(response).to.eql({
        type: 'index-pattern',
        id: 'logstash-*',
        title: 'Logstash'
      });
    });

    it('should use ES create action with specifying an id', async () => {
      callWithRequest.returns({ _type: 'index-pattern', _id: 'logstash-*' });

      await savedObjectsClient.create('index-pattern', {
        id: 'logstash-*',
        title: 'Logstash'
      });

      expect(callWithRequest.calledOnce).to.be(true);

      const args = callWithRequest.getCall(0).args;
      expect(args[1]).to.be('create');
    });

    it('should use ES index action with specifying an id', async () => {
      callWithRequest.returns({ _type: 'index-pattern', _id: 'abc123' });

      await savedObjectsClient.create('index-pattern', { title: 'Logstash' });
      expect(callWithRequest.calledOnce).to.be(true);

      const args = callWithRequest.getCall(0).args;
      expect(args[1]).to.be('index');
    });
  });

  describe('#delete', () => {
    it('returns based on ES success', async () => {
      callWithRequest.returns(Promise.resolve({ deleted: 'testing' }));
      const response = await savedObjectsClient.delete('index-pattern', 'logstash-*');

      expect(response).to.be('testing');
    });

    it('throws notFound when ES is unable to find the document', (done) => {
      callWithRequest.returns(Promise.resolve({ found: false }));

      savedObjectsClient.delete('index-pattern', 'logstash-*').then(() => {
        done('failed');
      }).catch(e => {
        expect(e.output.statusCode).to.be(404);
        done();
      });
    });

    it('passes the parameters to callWithRequest', async () => {
      await savedObjectsClient.delete('index-pattern', 'logstash-*');

      expect(callWithRequest.calledOnce).to.be(true);

      const args = callWithRequest.getCall(0).args;
      expect(args[1]).to.be('delete');
      expect(args[2]).to.eql({
        type: 'index-pattern',
        id: 'logstash-*',
        refresh: 'wait_for',
        index: '.kibana-test'
      });
    });
  });

  describe('#find', () => {
    it('formats Elasticsearch response', async () => {
      const count = docs.hits.hits.length;

      callWithRequest.returns(Promise.resolve(docs));
      const response = await savedObjectsClient.find();

      expect(response.total).to.be(count);
      expect(response.data).to.have.length(count);
      docs.hits.hits.forEach((doc, i) => {
        expect(response.data[i]).to.eql(Object.assign(
          { id: doc._id, type: doc._type },
          doc._source)
        );
      });
    });

    it('accepts from/size', async () => {
      await savedObjectsClient.find({ from: 50, size: 10 });

      expect(callWithRequest.calledOnce).to.be(true);

      const options = callWithRequest.getCall(0).args[2];
      expect(options).to.eql({
        index: '.kibana-test',
        body: { query: { match_all: {} } },
        from: 50,
        size: 10
      });
    });

    it('accepts type', async () => {
      await savedObjectsClient.find({ type: 'index-pattern' });

      expect(callWithRequest.calledOnce).to.be(true);

      const options = callWithRequest.getCall(0).args[2];
      expect(options).to.eql({
        index: '.kibana-test',
        body: { query: { bool: { must: { term: { _type: 'index-pattern' } } } } },
        type: 'index-pattern',
      });
    });

    it('accepts fields as a string', async () => {
      await savedObjectsClient.find({ fields: 'title' });

      expect(callWithRequest.calledOnce).to.be(true);

      const options = callWithRequest.getCall(0).args[2];
      expect(options.filterPath).to.eql([
        'hits.total',
        'hits.hits._id',
        'hits.hits._type',
        'hits.hits._source.title'
      ]);
    });

    it('accepts fields as an array', async () => {
      await savedObjectsClient.find({ fields: ['title', 'description'] });

      expect(callWithRequest.calledOnce).to.be(true);

      const options = callWithRequest.getCall(0).args[2];
      expect(options.filterPath).to.eql([
        'hits.hits._source.title',
        'hits.hits._source.description',
        'hits.total',
        'hits.hits._id',
        'hits.hits._type'
      ]);
    });

    it('handles error status of 400', async () => {
      const error = new Error('Testing');
      error.status = 400;

      callWithRequest.throws(error);

      const response = await savedObjectsClient.find();

      expect(response.total).to.be(0);
      expect(response.data).to.eql([]);
    });
  });

  describe('#get', () => {
    it('formats Elasticsearch response', async () => {
      callWithRequest.returns(Promise.resolve({
        _id: 'logstash-*',
        _type: 'index-pattern',
        _source: {
          title: 'Testing'
        }
      }));

      const response = await savedObjectsClient.get('index-pattern', 'logstash-*');
      expect(response).to.eql({
        id: 'logstash-*',
        type: 'index-pattern',
        title: 'Testing'
      });
    });
  });

  describe('#update', () => {
    it('returns based on ES success', async () => {
      callWithRequest.returns(Promise.resolve({
        _id: 'logstash-*',
        _type: 'index-pattern',
        result: 'updated'
      }));

      const response = await savedObjectsClient.update('index-pattern', 'logstash-*', { title: 'Testing' });
      expect(response).to.be(true);
    });

    it('passes the parameters to callWithRequest', async () => {
      await savedObjectsClient.update('index-pattern', 'logstash-*', { title: 'Testing' });

      expect(callWithRequest.calledOnce).to.be(true);

      const args = callWithRequest.getCall(0).args;
      expect(args[1]).to.be('update');
      expect(args[2]).to.eql({
        type: 'index-pattern',
        id: 'logstash-*',
        body: { title: 'Testing' },
        refresh: true,
        index: '.kibana-test'
      });
    });
  });
});
