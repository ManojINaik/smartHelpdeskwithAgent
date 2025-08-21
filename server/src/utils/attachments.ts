import axios from 'axios';

export interface ExtractedAttachment {
  url: string;
  contentType: string;
  textSnippet: string;
  bytes: number;
  error?: string;
}

function isTextLikeUrl(url: string): boolean {
  return url.endsWith('.txt') || url.endsWith('.md') || url.startsWith('data:text/');
}

function decodeDataUrl(dataUrl: string): { contentType: string; text: string } | null {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) return null;
    const contentType = match[1] || 'text/plain';
    const base64 = match[2] || '';
    const buffer = Buffer.from(base64 as string, 'base64');
    const text = buffer.toString('utf8');
    return { contentType: contentType as string, text: text as string };
  } catch {
    return null;
  }
}

export async function extractTextFromAttachments(urls: string[], timeoutMs: number = 5000): Promise<ExtractedAttachment[]> {
  if (!Array.isArray(urls) || urls.length === 0) return [];

  const tasks = urls.map(async (url) => {
    if (!isTextLikeUrl(url)) {
      return { url, contentType: 'unsupported', textSnippet: '', bytes: 0, error: 'unsupported_type' } as ExtractedAttachment;
    }

    // Support data URLs directly (useful in tests)
    if (url.startsWith('data:')) {
      const decoded = decodeDataUrl(url);
      if (!decoded) return { url, contentType: 'invalid_data_url', textSnippet: '', bytes: 0, error: 'invalid_data_url' };
      const text = decoded.text;
      return {
        url,
        contentType: decoded.contentType,
        textSnippet: text.slice(0, 500),
        bytes: Buffer.byteLength(text, 'utf8')
      } as ExtractedAttachment;
    }

    try {
      const resp = await axios.get(url, { timeout: timeoutMs, responseType: 'text' });
      const text: string = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      return {
        url,
        contentType: resp.headers['content-type'] || 'text/plain',
        textSnippet: text.slice(0, 500),
        bytes: Buffer.byteLength(text, 'utf8')
      } as ExtractedAttachment;
    } catch (err: any) {
      return { url, contentType: 'unknown', textSnippet: '', bytes: 0, error: err?.message || 'fetch_failed' } as ExtractedAttachment;
    }
  });

  return Promise.all(tasks);
}


