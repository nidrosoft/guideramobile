import {
  AI_AUDIO_PAYLOAD_MAX_BYTES,
  AI_IMAGE_PAYLOAD_MAX_BYTES,
  assertAiBase64WithinLimit,
  estimateBase64Bytes,
} from '../../../src/utils/aiPayloadLimits';

describe('client AI payload limits', () => {
  it('estimates decoded bytes for base64 payloads', () => {
    expect(estimateBase64Bytes('QUJDRA==')).toBe(4);
  });

  it('throws before sending oversized image payloads', () => {
    expect(() =>
      assertAiBase64WithinLimit('QUJDRA==', {
        label: 'Image',
        maxBytes: 3,
      })
    ).toThrow('Image is too large');
  });

  it('exports image and audio limits matching edge guard intent', () => {
    expect(AI_IMAGE_PAYLOAD_MAX_BYTES).toBe(15 * 1024 * 1024);
    expect(AI_AUDIO_PAYLOAD_MAX_BYTES).toBe(12 * 1024 * 1024);
  });
});
