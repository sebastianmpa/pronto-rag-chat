export interface RelatedPart {
  MFRID: string;
  PARTNUMBER: string;
  DESCRIPTION: string;
  QUANTITYLOC: number;
}

export interface GeneralPartInfo {
  MFRID: string;
  PARTNUMBER: string;
  DESCRIPTION: string;
  SUPERCEDETO?: string | null;
  QTY_LOC: number;
}

export interface PartInfo {
  mfrId: string;
  partNumber: string;
  productThumbnailImage?: string;
  productStandarImage?: string;
  location: number;
  superseded?: string | null;
  superseded_list?: string[];
  qty_loc: number;
  general_info: GeneralPartInfo;
  related_parts: RelatedPart[];
  related_count: number;
}

export interface PartInfoResponse {
  partInfo: PartInfo[];
}

