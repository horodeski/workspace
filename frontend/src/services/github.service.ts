export interface GitHubCommit {
  sha: string;
  message: string;
  date: string;
}

export interface GitHubPR {
  id: number;
  title: string;
  state: string;
  url: string;
}

export interface GitHubService {
  getCommits(since: Date): Promise<GitHubCommit[]>;
  getPullRequests(state: 'open' | 'closed' | 'all'): Promise<GitHubPR[]>;
}
