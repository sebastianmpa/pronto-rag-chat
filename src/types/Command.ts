export interface Command {
  command: string;
  type: 'system' | 'term_category';
}

export type CommandsResponse = Command[];
