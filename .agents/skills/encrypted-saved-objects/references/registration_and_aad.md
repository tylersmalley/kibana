# Registration and AAD

## When to use ESO

Register a Saved Object type as encrypted only when it stores genuinely sensitive data:

- Credentials: passwords, API keys, access keys, tokens
- PII: SSNs, card numbers, bank routing numbers
- Other secrets: signing keys, certificates, private endpoints

Most Saved Object types do not need encryption. When in doubt, ask `#kibana-security`.

## Registration pattern

Register the Saved Object type with Core first, then register the same `type` with the ESO service:

```ts
savedObjects.registerType({
  name: 'my_encrypted_type',
  hidden: true,
  namespaceType: 'multiple-isolated',
  mappings: { /* ... */ },
  modelVersions: myModelVersions,
});

encryptedSavedObjects.registerType({
  type: 'my_encrypted_type',
  attributesToEncrypt: new Set(['secrets']),
  attributesToIncludeInAAD: new Set(['connectorType', 'createdAt']),
});
```

Key rules:

- `type` must exactly match the Core Saved Object registration name
- `attributesToEncrypt` must not be empty
- Use `{ key: 'fieldName', dangerouslyExposeValue: true }` only when decrypted values must be
  exposed through standard SO client APIs, and document why

## Choosing `attributesToEncrypt`

Encrypt attributes that contain sensitive data. Encrypted attributes are stripped from standard
Saved Object Client responses. If server-side code needs decrypted values, use the dedicated ESO
client APIs instead of standard `get` / `find`.

## Choosing `attributesToIncludeInAAD`

AAD attributes are not encrypted, but they are cryptographically bound to the encrypted data. If an
AAD attribute changes, the encrypted payload must be re-encrypted.

Include in AAD attributes that:

- Describe the encrypted data, like connector type, token type, or URL
- Never change after creation, like `createdAt`, `createdBy`, or stable type identifiers

Exclude from AAD attributes that:

- Are themselves encrypted
- Can change independently of the secret, like display names or UI settings
- Are optional, computed, or volatile, like stats or `updatedAt`
- Are likely to be removed or refactored
- Are large enough to make bulk crypto work more expensive

Be conservative. Adding an existing populated attribute to AAD later is not supported in
Serverless.

## Nested attributes

Including an attribute in AAD includes its full subtree. If only part of a nested object should be
bound, use dotted keys like `rule.apiKeyOwner` instead of the whole `rule` object.
