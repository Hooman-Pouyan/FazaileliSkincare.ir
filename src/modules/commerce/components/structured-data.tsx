import type { JsonLd } from "../utils/structured-data";

/**
 * Emits JSON-LD as a script tag.
 *
 * `JSON.stringify` output is escaped for `<` so a name containing `</script>`
 * cannot close the tag early. Catalogue copy is staff-entered rather than
 * public, but the escape costs nothing and the failure it prevents is script
 * injection into every page that renders a product name.
 */
export function StructuredData({ data }: { data: readonly (JsonLd | null)[] }) {
  const nodes = data.filter((node): node is JsonLd => node !== null);
  if (nodes.length === 0) return null;

  return (
    <>
      {nodes.map((node, index) => (
        <script
          key={index}
          type="application/ld+json"
          // JSON-LD has no other insertion point in React. The value is
          // serialised JSON with the tag-closing character escaped, so a name
          // containing `</script>` cannot break out.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(node).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
