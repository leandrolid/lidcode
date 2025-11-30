import type { IHashService } from '@domain/services/hash.service'
import { Injectable } from '@lidcode/framework'
import Hashids from 'hashids'

@Injectable({
  token: 'IHashService',
})
export class HashService implements IHashService {
  private readonly hashids: Hashids

  constructor() {
    this.hashids = new Hashids(
      'secret-salt-for-url-shortening-service',
      3,
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    )
  }

  createHashFromId(id: number): string {
    return this.hashids.encode(id)
  }
}
