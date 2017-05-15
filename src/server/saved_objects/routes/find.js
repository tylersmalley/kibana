import Joi from 'joi';

export const createFindRoute = (prereqs) => ({
  path: '/api/kibana/saved_objects/{type?}',
  method: 'GET',
  config: {
    pre: [prereqs.getSavedObjectsClient],
    validate: {
      params: Joi.object().keys({
        type: Joi.string()
      }),
      query: Joi.object().keys({
        size: Joi.number().default(20),
        from: Joi.number().default(0),
        type: Joi.string(),
        filter: Joi.string().allow('').optional(),
        fields: [Joi.string(), Joi.array().items(Joi.string())],
        download: Joi.boolean()
      })
    },
    handler(request, reply) {
      const type = request.params.type || request.query.type;
      const { size, from, filter, download } = request.query;
      const options = { size, from, filter };

      if (type) {
        options.type = type;
      }

      if (request.query.fields) {
        options.fields = request.query.fields;
      }

      if (download) {
        const stream = request.pre.savedObjectsClient.findAll(options);
        stream.on('data', data => {
          console.log(data);
        });

      } else {
        reply(request.pre.savedObjectsClient.find(options));
      }
    }
  }
});
