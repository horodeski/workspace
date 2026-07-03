export interface GitLabMR {
  id: number;
  title: string;
  state: string;
  webUrl: string;
}

export interface GitLabCommit {
  id: string;
  message: string;
  createdAt: string;
}

export interface GitLabService {
  getMergeRequests(since: Date): Promise<GitLabMR[]>;
  getCommits(since: Date): Promise<GitLabCommit[]>;
}
