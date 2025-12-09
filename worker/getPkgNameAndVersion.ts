import { BeforeDownloadRequest } from './types';

export function getPkgNameAndVersion(
  data: BeforeDownloadRequest
): { name: string; version: string } | undefined {
  const name: string | undefined = undefined;
  const version: string | undefined = undefined;

  // [extraction code to do]

  if (!name || !version) {
    return undefined;
  }

  return { name, version };
}
