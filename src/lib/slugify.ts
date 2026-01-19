// A robust function to create a URL-friendly slug from a string.
// It handles Arabic and other languages.
export function titleToSlug(title: string): string {
  if (!title) return '';

  const slug = title
    .toString()
    .toLowerCase()
    .trim()
    // This regex replaces one or more characters that are not a Unicode letter or number with a single hyphen.
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    // This removes any leading or trailing hyphens that might have resulted.
    .replace(/^-+|-+$/g, '');

  return slug;
}
