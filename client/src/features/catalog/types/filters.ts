export interface CatalogFilters {
  author: string;
  genre: string;
  min_rating: string;
  publication_year_from: string;
  publication_year_to: string;
  num_pages_min: string;
  num_pages_max: string;
}

export const emptyCatalogFilters: CatalogFilters = {
  author: "",
  genre: "",
  min_rating: "",
  publication_year_from: "",
  publication_year_to: "",
  num_pages_min: "",
  num_pages_max: "",
};
