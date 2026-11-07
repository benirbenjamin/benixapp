import fs from 'fs';
import path from 'path';

export class ZipDeployService {
  /**
   * Validate uploaded application archive
   * Checks file extension, size limit in MB, and ensures path traversal cannot happen
   */
  static validateArchive(
    filePath: string,
    fileSizeMb: number,
    maxAllowedStorageGb: number = 1
  ): { valid: boolean; error?: string } {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'Archive file does not exist on server.' };
    }

    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.zip') {
      return { valid: false, error: 'Only .zip application archives are supported.' };
    }

    const maxAllowedMb = maxAllowedStorageGb * 1024;
    if (fileSizeMb > maxAllowedMb) {
      return {
        valid: false,
        error: `Archive size (${fileSizeMb.toFixed(1)} MB) exceeds your plan limit (${maxAllowedMb} MB). Please upgrade your plan.`
      };
    }

    return { valid: true };
  }

  /**
   * Verify zip entry relative path to prevent Zip Slip vulnerability
   */
  static isSafeEntryPath(entryPath: string, destinationDir: string): boolean {
    const resolvedPath = path.resolve(destinationDir, entryPath);
    return resolvedPath.startsWith(path.resolve(destinationDir));
  }
}
