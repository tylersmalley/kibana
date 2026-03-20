# Partial Updates, Decrypted Access, and `canEncrypt`

## Partial update safety

Partial updates on ESO types must never modify encrypted attributes or AAD-backed attributes.
Doing so corrupts the object and can make it permanently undecryptable.

Preferred pattern:

```ts
export const myTypeAttributesToEncrypt = ['secrets'] as const;
export const myTypeAttributesIncludedInAAD = ['connectorType', 'createdAt'] as const;

type MyTypeAttributesNotPartiallyUpdatable =
  | (typeof myTypeAttributesToEncrypt)[number]
  | (typeof myTypeAttributesIncludedInAAD)[number];

export type PartiallyUpdateableMyTypeAttributes = Partial<
  Omit<MyTypeSO, MyTypeAttributesNotPartiallyUpdatable>
>;

export async function partiallyUpdateMyType(
  savedObjectsClient: Pick<SavedObjectsClientContract, 'update'>,
  id: string,
  attributes: PartiallyUpdateableMyTypeAttributes,
  options: SavedObjectsUpdateOptions = {}
) {
  const safeAttributes = omit(attributes, [
    ...myTypeAttributesToEncrypt,
    ...myTypeAttributesIncludedInAAD,
  ]);

  await savedObjectsClient.update('my_encrypted_type', id, safeAttributes, options);
}
```

If code calls `savedObjectsClient.update` or `savedObjectsRepository.update` on an ESO type, verify
that encrypted and AAD-backed attributes cannot reach the payload.

## Accessing decrypted data

Use the dedicated ESO client for decrypted reads. These APIs run as the internal Kibana user and
should stay server-side:

```ts
const decrypted = await encryptedSavedObjectsClient.getDecryptedAsInternalUser<MyType>(
  'my_encrypted_type',
  objectId,
  { namespace }
);

const finder = await encryptedSavedObjectsClient
  .createPointInTimeFinderDecryptedAsInternalUser<MyType>({
    type: 'my_encrypted_type',
    perPage: 100,
  });
```

Rules:

- Do not return decrypted secrets in HTTP responses without explicit justification
- `getDecryptedAsInternalUser` throws if the type is not registered as encrypted
- Prefer standard Saved Object APIs when decrypted values are not required

## `canEncrypt`

The ESO encryption key is optional. Plugins must check `canEncrypt` and handle the disabled case:

```ts
const canEncrypt = plugins.encryptedSavedObjects.canEncrypt;

if (!canEncrypt) {
  throw new Error('Encryption key is not configured. Cannot create encrypted objects.');
}
```

Graceful degradation is also valid when the feature can be disabled cleanly:

```ts
if (!canEncrypt) {
  logger.warn('Encryption key not set. Feature X is unavailable.');
  return;
}
```

If a plugin registers encrypted types or uses decrypted ESO APIs without a `canEncrypt` decision,
that is a bug.
