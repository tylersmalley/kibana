import Joi from 'joi';

export const createUpdateRoute = (prereqs) => {
  return {
    path: '/api/kibana/saved_objects/{type}/{id}',
    method: 'PUT',
    config: {
      pre: [prereqs.getSavedObjectsClient],
      validate: {
        params: Joi.object().keys({
          type: Joi.string().required(),
          id: Joi.string().required(),
        }).required(),
        payload: Joi.object().required()
      },
      handler(request, reply) {
        const { savedObjectsClient } = request.pre;
        const { type, id } = request.params;

        reply(savedObjectsClient.update(type, id, request.payload));
      }
    }
  };
};
