export interface ICounterService {
  getCountFor(id: string): Promise<number>
}
