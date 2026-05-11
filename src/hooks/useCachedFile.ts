import { useState, useEffect } from 'react';
import { getBlob, ref } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { get, set } from 'idb-keyval';

export function useCachedFile(url: string | undefined): { localUrl: string | undefined; isError: boolean } {
  const [localUrl, setLocalUrl] = useState<string | undefined>(url);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // We disable aggressive IndexedDB caching of raw Firebase URLs
    // since it can cause CORS errors and trigger retry-limit-exceeded logs
    // from the Firebase SDK. We just pass the URL through.
    if (url) {
      setLocalUrl(url);
      setIsError(false);
    } else {
      setLocalUrl(undefined);
    }
  }, [url]);

  return { localUrl, isError };
}
