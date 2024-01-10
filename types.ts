export interface SearchRecord {
  objectID: string;
  url: string;
  jsonUrl: string;

  // uiTestRecord
  // title: string;
  // totalElapsedMs: number;
  // identicalLabelCount: number;
  // lighthouseElapsedMs: number;
  // lighthouseTotalScore: number;
  // lighthouseFailingAudits: LighthouseAudit[];
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
