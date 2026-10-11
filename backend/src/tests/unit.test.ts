import { describe, it, expect } from 'vitest';
import { assertTransition, assertEditable, TRANSITIONS } from '../modules/vouchers/stateMachine.js';
import { detectImageType } from '../utils/fileType.js';

describe('state machine', () => {
  it('allows DRAFT -> SUBMITTED', () => {
    expect(() => assertTransition('DRAFT', 'SUBMITTED')).not.toThrow();
  });
  it('rejects DRAFT -> APPROVED', () => {
    expect(() => assertTransition('DRAFT', 'APPROVED')).toThrow();
  });
  it('allows PENDING_APPROVAL -> APPROVED/REJECTED', () => {
    expect(() => assertTransition('PENDING_APPROVAL', 'APPROVED')).not.toThrow();
    expect(() => assertTransition('PENDING_APPROVAL', 'REJECTED')).not.toThrow();
  });
  it('terminal states have no outgoing transitions', () => {
    expect(TRANSITIONS.APPROVED).toEqual([]);
    expect(TRANSITIONS.REJECTED).toEqual([]);
  });
  it('only DRAFT is editable', () => {
    expect(() => assertEditable('DRAFT')).not.toThrow();
    for (const s of ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']) {
      expect(() => assertEditable(s)).toThrow();
    }
  });
});

describe('file type detection', () => {
  it('detects PNG magic bytes', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectImageType(buf)?.ext).toBe('png');
  });
  it('detects JPEG magic bytes', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectImageType(buf)?.ext).toBe('jpg');
  });
  it('detects WEBP magic bytes', () => {
    const buf = Buffer.concat([Buffer.from('RIFF....WEBP', 'ascii')]);
    expect(detectImageType(buf)?.ext).toBe('webp');
  });
  it('rejects unknown bytes', () => {
    expect(detectImageType(Buffer.from('GIF89a'))).toBeNull();
  });
});
