// Converts a name like "Maruti Suzuki" -> "maruti-suzuki" so brand/model
// names (which have no dedicated slug column) can be matched from a URL.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
