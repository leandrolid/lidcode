export interface IDatabaseConnection {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query(...args: any[]): Promise<any>
}
