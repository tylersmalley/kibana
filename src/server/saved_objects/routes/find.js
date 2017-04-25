import Joi from 'joi';

export const createFindRoute = (prereqs) => ({
  path: '/api/saved_objects',
  method: 'GET',
  config: {
    pre: [prereqs.getSavedObjectsClient],
    validate: {
      params: Joi.object().keys({
        type: Joi.string(),
      }).required()
    },
    async handler(request, reply) {
      const { savedObjectsClient } = request.pre;
      const { type } = request.params;
      const data = await savedObjectsClient.find(type, {});

      reply({ data });
    }
  }
});
