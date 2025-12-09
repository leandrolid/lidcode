export type Filter<Entity> = Partial<{
  [Column in keyof Entity]?: Entity[Column] extends Array<infer T>
    ? ArrayFilters<T>
    : Entity[Column] extends Date
      ? ColumnFilters<Entity, Column>
      : Entity[Column] extends object
        ? ColumnFilters<Entity, Column>
        : ColumnFilters<Entity, Column>
}> & {
  or?: Filter<Entity>[]
  and?: Filter<Entity>[]
}

type ColumnFilters<Entity, Column extends keyof Entity> =
  | Partial<Entity[Column]>
  | {
      in?: Entity[Column][]
      notIn?: Entity[Column][]
      lt?: Entity[Column]
      lte?: Entity[Column]
      gt?: Entity[Column]
      gte?: Entity[Column]
      like?: string
      ilike?: string
      not?: Entity[Column]
      some?: Filter<Entity[Column]>
      isNull?: boolean
      isNotNull?: boolean
      or?: Filter<Entity[Column]>[]
      and?: Filter<Entity[Column]>[]
    }

type ArrayFilters<RelationEntity> = {
  every?: Filter<RelationEntity>
  some?: Filter<RelationEntity>
  none?: Filter<RelationEntity>
}
