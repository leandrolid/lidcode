import type { Filter } from '@domain/persistence/filter'
import type { Relations } from '@domain/persistence/relation'
import type { Select } from '@domain/persistence/select'

export interface IRepository<Entity> {
  createOne(data: Partial<Entity>): Promise<Entity>
  findById(id: string): Promise<Entity | null>
  findOne(filters: FindOneOptions<Entity>): Promise<Entity | null>
  findUnique(filters: FindOneOptions<Entity>): Promise<Entity | null>
  findMany(filters: FindManyOptions<Entity>): Promise<Entity[]>
  count(filters: FindManyOptions<Entity>): Promise<number>
  updateOne(filters: UpdateOneOptions<Entity>): Promise<Entity>
  updateMany(filters: UpdateManyOptions<Entity>): Promise<Entity[]>
  deleteById(id: string): Promise<void>
}

export type FindOneOptions<Entity> = {
  where: Filter<Entity>
  select?: Select<Entity>
}

export type FindManyOptions<Entity> = {
  where: Filter<Entity>
  take?: number
  skip?: number
  orderBy?: Partial<Record<keyof Entity, 'asc' | 'desc'>>
  select?: Select<Entity>
  relations?: Relations<Entity>
}

export type UpdateOneOptions<Entity> = {
  id: string
  data: Partial<Entity>
}

export type UpdateManyOptions<Entity> = {
  where: Filter<Entity>
  data: Partial<Entity>
}
