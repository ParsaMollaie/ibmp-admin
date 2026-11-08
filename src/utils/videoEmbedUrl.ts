/**
 * Converts a video page URL a user would actually paste (a YouTube watch/share link, an Aparat
 * share link) into the `<iframe>` embed URL each platform requires. Anything else is passed
 * through unchanged — the product requirement is explicitly "aparat or youtube or anywhere", so
 * a URL that's already an embed link (or from some other host entirely) is used as-is and is the
 * uploader's responsibility to get right.
 */
export function toVideoEmbedUrl(rawUrl: string): string {
  let url = rawUrl.trim();

  // Pasted <iframe> embed code: use its src.
  const iframeSrc = url.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeSrc) {
    url = iframeSrc[1];
  }

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  const aparatMatch = url.match(
    /aparat\.com\/(?:v|video\/video\/embed\/videohash)\/([a-zA-Z0-9]+)/,
  );
  if (aparatMatch) {
    return `https://www.aparat.com/video/video/embed/videohash/${aparatMatch[1]}/vt/frame`;
  }

  return url;
}
