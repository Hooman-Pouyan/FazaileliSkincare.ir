# Development placeholder imagery

Generated flat-colour placeholders for the fictional catalogue in
`src/lib/db/seeds/dev-data.ts`. They exist so the product hub, list and detail
routes have something to lay out. They are not product photography, they are not
brand assets, and nothing here may be served to a customer.

The seeder writes each file's public path into `product_media.source_path` and
into the three object-key columns. Real media replaces those keys with object
storage keys once the storage bucket exists; see
`docs/14-storyderm-draft-catalog-pipeline.md` for the media rights and
provenance rules that govern real imagery.
