/** View models the commerce components render. Kept deliberately flat — these
 *  are what a screen passes down, not the database rows. */

export type PriceVisibility = "public" | "on_request";

export interface ProductSummary {
  slug: string;
  name: string;
  /** Aveda's highest-leverage field: one line saying what it does. */
  promise?: string | null;
  brandName: string;
  lineName?: string | null;
  sizeLabel?: string | null;
  imageUrl?: string | null;
  priceRials?: bigint | null;
  compareAtRials?: bigint | null;
  priceVisibility: PriceVisibility;
  inStock: boolean;
  isProfessionalOnly?: boolean;
}

export interface FacetValue {
  value: string;
  label: string;
  /** Live counts prevent dead-end filtering. Their absence is what makes
   *  small-brand filters feel broken. */
  count: number;
  selected?: boolean;
}

export interface FacetGroupModel {
  key: string;
  label: string;
  values: FacetValue[];
  /** A search box inside the facet becomes essential above ~20 values. */
  searchable?: boolean;
  defaultOpen?: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface CartLineModel {
  id: string;
  name: string;
  brandName: string;
  sizeLabel?: string | null;
  imageUrl?: string | null;
  unitPriceRials: bigint;
  quantity: number;
}
