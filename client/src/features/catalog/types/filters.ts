export interface CatalogFilters {
  author: string;
  genre: string;
  min_rating: string;
  pub_date_from: string;
  pub_date_to: string;
  num_pages_min: string;
  num_pages_max: string;
}

export const emptyCatalogFilters: CatalogFilters = {
  author: "",
  genre: "",
  min_rating: "",
  pub_date_from: "",
  pub_date_to: "",
  num_pages_min: "",
  num_pages_max: "",
};
