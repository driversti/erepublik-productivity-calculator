// JS port of src/services/regions.ts parseRegionList — region links on the
// Country Society page. Kept in sync with the TS original.
export function parseRegionList(html) {
  const regex = /href="\/\/www\.erepublik\.com\/en\/main\/region\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const out = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(html)) !== null) {
    const permalink = match[1];
    const name = match[2].replace(/<[^>]*>/g, '').trim();
    if (name.toLowerCase() === 'details') continue;
    if (seen.has(permalink)) continue;
    seen.add(permalink);
    out.push({ name, permalink });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
