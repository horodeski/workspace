export interface OpenAIService {
  formatText(input: string): Promise<string>;
  summarize(entries: string[]): Promise<string>;
}
