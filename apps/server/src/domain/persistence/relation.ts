export type Relations<Entity> = {
  [Column in keyof Entity]?: Entity[Column] extends 'toString'
    ? never
    : RelationHelper<NonNullable<Entity[Column]>>
}

type RelationHelper<Property> =
  Property extends Promise<infer I>
    ? RelationHelper<NonNullable<I>> | boolean
    : Property extends Array<infer T>
      ? RelationHelper<NonNullable<T>> | boolean
      : Property extends string | number | boolean | Date | Function | Buffer
        ? never
        : Property extends object
          ? Relations<Property> | boolean
          : boolean
