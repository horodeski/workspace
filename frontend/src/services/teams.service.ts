export interface TeamsStatus {
  isAvailable: boolean;
  message: string;
}

export interface TeamsService {
  sendReport(report: string, channel: string): Promise<void>;
  getStatus(): Promise<TeamsStatus>;
}
