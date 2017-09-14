import expect from 'expect.js';
import { errors as esErrors } from 'elasticsearch';
import { get } from 'lodash';

import { decorateEsError } from '../decorate_es_error';
import {
  isEsUnavailableError,
  isConflictError,
  isNotAuthorizedError,
  isForbiddenError,
  isNotFoundError,
  isBadRequestError,
} from '../errors';

describe('savedObjectsClient/decorateEsError', () => {
  it('always returns the same error it receives', () => {
    const error = new Error();
    expect(decorateEsError(error)).to.be(error);
  });

  it('makes es.ConnectionFault a SavedObjectsClient/EsUnavailable error', () => {
    const error = new esErrors.ConnectionFault();
    expect(isEsUnavailableError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isEsUnavailableError(error)).to.be(true);
  });

  it('makes es.ServiceUnavailable a SavedObjectsClient/EsUnavailable error', () => {
    const error = new esErrors.ServiceUnavailable();
    expect(isEsUnavailableError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isEsUnavailableError(error)).to.be(true);
  });

  it('makes es.NoConnections a SavedObjectsClient/EsUnavailable error', () => {
    const error = new esErrors.NoConnections();
    expect(isEsUnavailableError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isEsUnavailableError(error)).to.be(true);
  });

  it('makes es.RequestTimeout a SavedObjectsClient/EsUnavailable error', () => {
    const error = new esErrors.RequestTimeout();
    expect(isEsUnavailableError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isEsUnavailableError(error)).to.be(true);
  });

  it('makes es.Conflict a SavedObjectsClient/Conflict error', () => {
    const error = new esErrors.Conflict();
    expect(isConflictError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isConflictError(error)).to.be(true);
  });

  it('makes es.AuthenticationException a SavedObjectsClient/NotAuthorized error', () => {
    const error = new esErrors.AuthenticationException();
    expect(isNotAuthorizedError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isNotAuthorizedError(error)).to.be(true);
  });

  it('makes es.Forbidden a SavedObjectsClient/Forbidden error', () => {
    const error = new esErrors.Forbidden();
    expect(isForbiddenError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isForbiddenError(error)).to.be(true);
  });

  it('makes es.NotFound a SavedObjectsClient/NotFound error', () => {
    const error = new esErrors.NotFound();
    expect(isNotFoundError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isNotFoundError(error)).to.be(true);
  });

  it('makes es.BadRequest a SavedObjectsClient/BadRequest error', () => {
    const error = new esErrors.BadRequest();
    expect(isBadRequestError(error)).to.be(false);
    expect(decorateEsError(error)).to.be(error);
    expect(isBadRequestError(error)).to.be(true);
  });

  it('returns other errors as Boom errors', () => {
    const error = new Error();
    expect(error).to.not.have.property('isBoom');
    expect(decorateEsError(error)).to.be(error);
    expect(error).to.have.property('isBoom');
  });


  it('sets type_missing_exception on missing type error', () => {
    const error = new esErrors.BadRequest();
    error.message = 'Rejecting mapping update to [.kibana-6] as the final mapping would have more than 1 type: [visualization, doc]';
    expect(decorateEsError(error)).to.be(error);
    expect(get(error, 'body.error.type')).to.eql('type_missing_exception');
  });
});
