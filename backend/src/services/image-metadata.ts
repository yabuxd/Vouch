import exifr from 'exifr';

export async function checkCaptureDate(
  file: Buffer,
  assignmentDueDate: string
): Promise<{ flagged: boolean; note: string | null }> {
  try {
    const exif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'] });
    const captureDate = exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate;
    if (!captureDate) {
      return { flagged: false, note: null };
    }

    const captureDay = new Date(captureDate).toISOString().split('T')[0];
    if (captureDay !== assignmentDueDate) {
      return {
        flagged: true,
        note: `Image captured ${captureDay}, assignment due ${assignmentDueDate}`,
      };
    }

    return { flagged: false, note: null };
  } catch {
    return { flagged: false, note: null };
  }
}
