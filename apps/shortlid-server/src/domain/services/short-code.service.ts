export interface IShortCodeService {
  createFromId(id: number): string
  getIdFromCode(hash: string): number | bigint
}
