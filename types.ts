export interface SearchRecord {
  objectID: string;
  testUrl: string;
  score: number;
  jsonUrl: string;
}

export interface LighthouseResult {
  title: string;
  totalScore: number;
  audits: LighthouseAudit[];
}

export interface LighthouseAudit {
  id: string;
  title: string;
  score: number;
}
