import type { IShortCodeService } from '@domain/services/short-code.service'
import { BadRequestError, Injectable } from '@lidcode/framework'
import Hashids from 'hashids'

@Injectable({
  token: 'IShortCodeService',
})
export class ShortCodeService implements IShortCodeService {
  private readonly hashids: Hashids

  constructor() {
    this.hashids = new Hashids(
      'secret-salt-for-url-shortening-service',
      3,
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    )
  }

  createFromId(id: number): string {
    return this.hashids.encode(id)
  }

  getIdFromCode(hash: string): number | bigint {
    const [decoded] = this.hashids.decode(hash)
    if (!decoded) {
      throw new BadRequestError('Invalid short code')
    }
    return decoded
  }
}
