export type ScanErrorKind = 'rate_limit' | 'file_size' | 'auth' | 'format' | 'processing';

export interface ScanErrorPresentation {
  kind: ScanErrorKind;
  title: string;
  description: string;
  helperText: string | null;
  buttonLabel: string;
}

export function getScanErrorPresentation(scanError?: string | null): ScanErrorPresentation {
  const message = (scanError || '').trim();
  const normalized = message.toLowerCase();

  if (normalized.includes('scanner is doing') || normalized.includes('rate') || normalized.includes('breather')) {
    return {
      kind: 'rate_limit',
      title: 'Scanner Needs a Breather',
      description:
        message ||
        'The scanner is cooling down from all the recent scans. Please wait a little before scanning again.',
      helperText: null,
      buttonLabel: 'Sounds Good',
    };
  }

  if (normalized.includes('too large') || normalized.includes('mb') || normalized.includes('byte limit')) {
    return {
      kind: 'file_size',
      title: 'Image Is Too Large',
      description:
        message ||
        'This photo is larger than the scanner can process. Please choose a smaller image or take a new photo.',
      helperText: null,
      buttonLabel: 'Choose Another Image',
    };
  }

  if (normalized.includes('sign in')) {
    return {
      kind: 'auth',
      title: 'Sign In Needed',
      description: message || 'Please sign in again, then try scanning your ticket.',
      helperText: null,
      buttonLabel: 'Sounds Good',
    };
  }

  if (/\bformat\b/.test(normalized) || normalized.includes('unsupported')) {
    return {
      kind: 'format',
      title: 'Image Format Not Supported',
      description:
        message ||
        'That image came through in a format the scanner could not read.',
      helperText: 'Try a screenshot or a fresh photo saved as JPEG or PNG.',
      buttonLabel: 'Try Again',
    };
  }

  return {
    kind: 'processing',
    title: "Couldn't Read This Ticket",
    description:
      message ||
      'We had trouble extracting booking details from your image. This can happen if the image is blurry, too dark, or not a booking confirmation.',
    helperText: 'Try taking a clearer photo or uploading a screenshot instead.',
    buttonLabel: 'Try Again',
  };
}
