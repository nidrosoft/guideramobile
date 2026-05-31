import { getScanErrorPresentation } from '../../../../src/features/trip-import/steps/scan/scanErrorPresentation';

describe('scan error presentation', () => {
  it('shows only rate-limit copy and a non-retry CTA for scanner cooldowns', () => {
    const presentation = getScanErrorPresentation(
      'Our scanner is doing little stretches from all the action. Give it a breather and try again after 10:36 AM.'
    );

    expect(presentation).toMatchObject({
      kind: 'rate_limit',
      title: 'Scanner Needs a Breather',
      buttonLabel: 'Sounds Good',
    });
    expect(presentation.description).toContain('10:36 AM');
    expect(presentation.helperText).toBeNull();
  });

  it('shows clear-photo guidance only for unreadable image failures', () => {
    const presentation = getScanErrorPresentation('Could not extract booking information from this image.');

    expect(presentation).toMatchObject({
      kind: 'processing',
      title: "Couldn't Read This Ticket",
      buttonLabel: 'Try Again',
      helperText: 'Try taking a clearer photo or uploading a screenshot instead.',
    });
  });

  it('shows file-size guidance separately from processing guidance', () => {
    const presentation = getScanErrorPresentation('Ticket image is too large. Please capture or choose a file under 15 MB.');

    expect(presentation).toMatchObject({
      kind: 'file_size',
      title: 'Image Is Too Large',
      buttonLabel: 'Choose Another Image',
    });
    expect(presentation.helperText).toBeNull();
  });
});
