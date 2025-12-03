import type { Filter } from '@domain/persistence/filter'
import type {
  FindManyOptions,
  FindOneOptions,
  IRepository,
  UpdateManyOptions,
  UpdateOneOptions,
} from '@domain/persistence/repository'
import { PrismaDatabaseConnection } from '@infra/adapters/prisma/connection.imp'
import { type Prisma } from '@prisma/client'
import { crush, isEmpty, isPrimitive } from 'radash'

export class PrismaRepository<T> implements IRepository<T> {
  constructor(
    private readonly connection: PrismaDatabaseConnection,
    private readonly modelName: Prisma.ModelName,
  ) {}

  async createOne(data: Partial<T>): Promise<T> {
    const result = await this.connection.query(this.modelName, 'create', {
      // @ts-expect-error - Prisma create method expects exact types, but we want to allow partials
      data,
    })
    return result as T
  }

  async findById<I>(id: I): Promise<T | null> {
    const result = await this.connection.query(this.modelName, 'findUnique', {
      // @ts-expect-error - Prisma expects the correct type for id, but we only have string here
      where: { id },
    })
    return result as T | null
  }

  async findUnique(filters: FindOneOptions<T>): Promise<T | null> {
    const where = this.prepareWhereClause(filters.where) as any
    const result = await this.connection.query(this.modelName, 'findUnique', {
      where,
      select: filters.select,
    })
    return result as T | null
  }

  async findOne(filters: FindOneOptions<T>): Promise<T | null> {
    const where = this.prepareWhereClause(filters.where)
    const result = await this.connection.query(this.modelName, 'findFirst', {
      where,
      select: filters.select,
    })
    return result as T | null
  }

  async findMany(filters: FindManyOptions<T>): Promise<T[]> {
    const where = this.prepareWhereClause(filters.where)
    const result = await this.connection.query(this.modelName, 'findMany', {
      where,
      take: filters.take,
      skip: filters.skip,
      orderBy: filters.orderBy,
      select: this.combineIntoSelect(filters.select, filters.relations),
    })
    return result as T[]
  }

  async count(filters: FindManyOptions<T>): Promise<number> {
    const where = this.prepareWhereClause(filters.where)
    const result = await this.connection.query(this.modelName, 'count', {
      where,
      take: filters.take,
      skip: filters.skip,
      orderBy: filters.orderBy,
    })
    return result as number
  }

  async updateOne(filters: UpdateOneOptions<T>): Promise<T> {
    const result = await this.connection.query(this.modelName, 'update', {
      // @ts-expect-error - Prisma expects the correct type for id, but we only have partial filter here
      where: { id: filters.id },
      data: filters.data,
    })
    return result as T
  }

  async updateMany(filters: UpdateManyOptions<T>): Promise<T[]> {
    const where = this.prepareWhereClause(filters.where)
    const result = await this.connection.query(this.modelName, 'updateManyAndReturn', {
      where,
      data: filters.data,
    })
    return result as T[]
  }

  async deleteById(id: string): Promise<void> {
    await this.connection.query(this.modelName, 'delete', {
      // @ts-expect-error - Prisma expects the correct type for id, but we only have string here
      where: { id },
    })
  }

  private prepareWhereClause(where: Filter<T>): Record<string, any> {
    const preparedWhere = Object.entries(where).reduce(
      (acc, [key, value]): Record<string, any> => {
        if (value === undefined || value === null) return acc
        if (key === 'or' && Array.isArray(value)) {
          return { ...acc, OR: value.map((item) => this.prepareWhereClause(item)) }
        }
        if (key === 'and' && Array.isArray(value)) {
          return { ...acc, AND: value.map((item) => this.prepareWhereClause(item)) }
        }
        if (isPrimitive(value)) return { ...acc, [key]: value }
        if ('in' in value) return { ...acc, [key]: { in: value.in } }
        if ('notIn' in value) return { ...acc, [key]: { notIn: value.notIn } }
        if ('lt' in value) return { ...acc, [key]: { lt: value.lt } }
        if ('lte' in value) return { ...acc, [key]: { lte: value.lte } }
        if ('gt' in value) return { ...acc, [key]: { gt: value.gt } }
        if ('gte' in value) return { ...acc, [key]: { gte: value.gte } }
        if ('like' in value) return { ...acc, [key]: { contains: value.like } }
        if ('ilike' in value) {
          return { ...acc, [key]: { contains: value.ilike, mode: 'insensitive' } }
        }
        if ('not' in value) return { ...acc, [key]: { not: value.not } }
        if ('some' in value) {
          return { ...acc, [key]: { some: this.prepareWhereClause(value.some as Filter<unknown>) } }
        }
        if ('every' in value) {
          return {
            ...acc,
            // @ts-expect-error - Every is typed as never, but we know it can be Filter<unknown>
            [key]: { every: this.prepareWhereClause(value.every as Filter<unknown>) },
          }
        }
        if ('none' in value) {
          // @ts-expect-error - None is typed as never, but we know it can be Filter<unknown>
          return { ...acc, [key]: { none: this.prepareWhereClause(value.none as Filter<unknown>) } }
        }
        if ('isNull' in value) return { ...acc, [key]: { equals: null } }
        if ('isNotNull' in value) return { ...acc, [key]: { not: null } }
        return { ...acc, [key]: this.prepareWhereClause(value) }
      },
      {} as Record<string, any>,
    )
    const crushedObject = crush(preparedWhere)
    if (isEmpty(crushedObject)) throw new Error('At least one condition is required')
    return preparedWhere
  }

  private combineIntoSelect(
    select?: Record<string, any>,
    include?: Record<string, any>,
  ): Record<string, any> | undefined {
    if (!select) return
    return Object.entries(Object.assign({}, include, select)).reduce((acc, [key, value]) => {
      if (typeof value === 'boolean') {
        return { ...acc, [key]: value }
      }
      if (typeof value === 'object') {
        return { ...acc, [key]: { select: this.combineIntoSelect(value) } }
      }
      return acc
    }, {})
  }
}
