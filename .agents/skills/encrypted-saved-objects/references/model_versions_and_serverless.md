# Model Versions and Serverless

## When `createModelVersion` is required

Use `plugins.encryptedSavedObjects.createModelVersion(...)` when encrypted attributes or
AAD-backed attributes change. Purely unencrypted, non-AAD changes can use standard model versions.

```ts
import type { EncryptedSavedObjectTypeRegistration } from '@kbn/encrypted-saved-objects-plugin/server';

const inputType: EncryptedSavedObjectTypeRegistration = {
  type: 'my_encrypted_type',
  attributesToEncrypt: new Set(['secrets']),
  attributesToIncludeInAAD: new Set(['connectorType']),
};

const outputType: EncryptedSavedObjectTypeRegistration = {
  type: 'my_encrypted_type',
  attributesToEncrypt: new Set(['secrets']),
  attributesToIncludeInAAD: new Set(['connectorType', 'createdAt']),
};

modelVersions: {
  2: plugins.encryptedSavedObjects.createModelVersion({
    modelVersion: {
      changes: [
        {
          type: 'data_backfill',
          backfillFn: (doc) => ({
            attributes: { createdAt: doc.attributes.createdAt ?? new Date().toISOString() },
          }),
        },
      ],
      schemas: {
        forwardCompatibility: mySchemaV2.extends({}, { unknowns: 'ignore' }),
        create: mySchemaV2,
      },
    },
    inputType,
    outputType,
  }),
},
```

Key rules:

- `createModelVersion` needs at least one entry in `changes`
- `inputType` must match the previous ESO registration
- `outputType` must match the new ESO registration
- Transform functions are merged into one decrypt-transform-encrypt pass

## Serverless constraints

Serverless runs mixed versions during zero-downtime upgrades. The previous version still needs to
decrypt objects written or migrated by the newer version.

Unsupported transitions:

- Adding an existing populated attribute to AAD
- Removing an attribute from AAD
- Changing an attribute from unencrypted to encrypted
- Changing an attribute from encrypted to unencrypted

## Multi-stage rollout patterns

Some supported changes still need two releases.

Adding a new AAD attribute:

1. Release 1: add the attribute to `attributesToIncludeInAAD`, but do not populate or use it yet
2. Release 2: backfill and begin using it via `createModelVersion`

Removing an attribute that older business logic still expects:

1. Release 1: make business logic tolerate the attribute being absent
2. Release 2: remove it with a model version

## `forwardCompatibility`

Set `unknowns: 'ignore'` in `forwardCompatibility` when the previous version should drop unknown
fields. Decryption happens before that schema runs, which is important for hierarchical AAD changes.

## Quick change matrix

| Change | Needs `createModelVersion`? | Serverless notes |
| --- | --- | --- |
| Add new unencrypted, non-AAD attribute | No | Usually one release |
| Add new encrypted attribute | Yes | Usually one release |
| Add new AAD attribute | Yes | Often two releases |
| Remove unencrypted, non-AAD attribute | No | May need staged business-logic rollout |
| Remove encrypted attribute | No | May still need staged rollout |
| Remove AAD attribute | Not supported | Do not do this |
| Add existing populated attribute to AAD | Not supported | Do not do this |
| Change unencrypted to encrypted | Not supported | Do not do this |
| Change encrypted to unencrypted | Not supported | Do not do this |
