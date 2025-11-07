export interface Manufacturer {
  MFRID: string;
  NAME: string;
}

export interface ManufacturersResponse {
  manufacturers: Manufacturer[];
}

export interface ManufacturerDetailResponse {
  manufacturer: Manufacturer;
}
