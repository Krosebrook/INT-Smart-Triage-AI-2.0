import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseScimFilter, applyPatchOperations, scimCreateUserSchema } from '../src/utils/scim.js';

describe('SCIM utils', () => {
  it('parses userName filter', () => {
    const result = parseScimFilter('userName eq "alice"');
    assert.deepEqual(result, { attribute: 'userName', value: 'alice' });
  });

  it('parses active filter', () => {
    const result = parseScimFilter('active eq true');
    assert.deepEqual(result, { attribute: 'active', value: true });
  });

  it('rejects unsupported filters', () => {
    assert.throws(() => parseScimFilter('department eq "ops"'), /Unsupported SCIM filter attribute/);
  });

  it('validates SCIM user payload', () => {
    const payload = scimCreateUserSchema.parse({
      userName: 'alice',
      name: { givenName: 'Alice', familyName: 'Smith' },
      emails: [{ value: 'alice@example.com', primary: true }],
    });

    assert.equal(payload.userName, 'alice');
    assert.equal(payload.active, true);
    assert.equal(payload.emails.length, 1);
  });

  it('applies patch operations safely', () => {
    const original = {
      externalId: 'ext-1',
      userName: 'alice',
      name: { givenName: 'Alice', familyName: 'Smith' },
      emails: [{ value: 'alice@example.com', primary: true }],
      active: true,
      preferredLanguage: 'en-US',
      dataResidencyRegion: 'us-east-1',
    };

    const patched = applyPatchOperations(original, [
      { op: 'replace', path: 'name.givenName', value: 'Alicia' },
      { op: 'replace', path: 'active', value: false },
      { op: 'replace', path: 'dataResidencyRegion', value: 'eu-central-1' },
    ]);

    assert.equal(patched.name.givenName, 'Alicia');
    assert.equal(patched.active, false);
    assert.equal(patched.dataResidencyRegion, 'eu-central-1');
  });

  it('rejects unsupported patch operations', () => {
    const original = {
      externalId: 'ext-1',
      userName: 'alice',
      name: { givenName: 'Alice', familyName: 'Smith' },
      emails: [{ value: 'alice@example.com', primary: true }],
      active: true,
    };

    assert.throws(
      () => applyPatchOperations(original, [{ op: 'remove', path: 'emails.primary' }]),
      /Unsupported remove path/
    );
  });
});

