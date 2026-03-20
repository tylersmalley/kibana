---
name: encrypted-saved-objects
description: Encrypted Saved Objects (ESO) in Kibana — registration, AAD attribute choices, partial update safety, model version migrations with createModelVersion, canEncrypt checks, and Serverless constraints. Use when creating, modifying, or working with ESO types.
---

# Encrypted Saved Objects (ESO)

Use this skill when a change touches ESO registration, `attributesToEncrypt`, AAD,
partial updates, `canEncrypt`, decrypted reads, or model-version migration logic.

## Core rules

- Use ESO only for genuinely sensitive data.
- Never partially update encrypted or AAD-backed attributes via raw `savedObjectsClient.update` /
  `savedObjectsRepository.update`.
- Check `canEncrypt` before relying on ESO-dependent behavior.
- Use `createModelVersion` when encrypted or AAD-backed attributes change.
- Treat AAD or encrypted-ness changes as Serverless compatibility risks by default.

## Workflow

1. Confirm the type should be encrypted.
   - Read `references/registration_and_aad.md` when registering a new type or changing
     `attributesToEncrypt` / `attributesToIncludeInAAD`.
2. Audit write paths and decrypted reads.
   - Read `references/partial_updates_and_access.md` when the change touches `update`,
     `getDecryptedAsInternalUser`, or HTTP responses.
3. Plan migration semantics.
   - Read `references/model_versions_and_serverless.md` when model versions, AAD, encrypted
     attributes, or zero-downtime compatibility are involved.
4. Re-check the invariants before finishing.
   - `type` matches the Core registration.
   - Partial updates exclude encrypted and AAD-backed fields.
   - `canEncrypt` handling exists.
   - Decrypted values stay internal unless explicitly justified.

## Fast triage

- New sensitive field on an existing ESO type:
  - Read `references/registration_and_aad.md` and `references/model_versions_and_serverless.md`.
- New `savedObjectsClient.update` on an ESO type:
  - Read `references/partial_updates_and_access.md` before writing code.
- New decrypted read path:
  - Read `references/partial_updates_and_access.md` and verify secrets are not exposed to end users.
- Serverless rollout or AAD change:
  - Always read `references/model_versions_and_serverless.md`; some transitions are unsupported.

## References

- Registration, `attributesToEncrypt`, and AAD selection:
  `references/registration_and_aad.md`
- Partial update safety, decrypted access, and `canEncrypt`:
  `references/partial_updates_and_access.md`
- `createModelVersion`, unsupported transitions, and Serverless rollout patterns:
  `references/model_versions_and_serverless.md`
- Definitive docs: `dev_docs/key_concepts/encrypted_saved_objects.mdx`
