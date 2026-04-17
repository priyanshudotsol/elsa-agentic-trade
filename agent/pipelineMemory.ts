let lastExecutionLog: string | null = null;

export function setLastExecutionLog(line: string): void {
  lastExecutionLog = line;
}

export function getLastExecutionLog(): string | null {
  return lastExecutionLog;
}
