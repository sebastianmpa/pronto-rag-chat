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
  SUPERCEDETO: string | null;
  QTY_LOC: number;
}

export interface PartInfo {
  mfrId: string;
  partNumber: string;
  location: '1' | '4';
  superseded: string | null;
  qty_loc: number;
  generalInfo: GeneralPartInfo;
  relatedParts: RelatedPart[];
  related_count: number;
}

export interface PartInfoResponse {
  partInfo: PartInfo;
}
