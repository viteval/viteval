interface SortItemsParams<T> {
  items: T[];
  sort?: string;
  order?: 'asc' | 'desc';
  fields: Record<string, (item: T) => string | number>;
  defaultSort: string;
  defaultOrder?: 'asc' | 'desc';
}

/**
 * Sorts a complete resource collection before pagination.
 * @param params - Collection, supported fields, and requested ordering.
 * @returns A sorted copy of the collection.
 * @example sortItems({ items, fields: { name: item => item.name }, defaultSort: 'name' });
 */
export function sortItems<T>({
  items,
  sort,
  order,
  fields,
  defaultSort,
  defaultOrder = 'asc',
}: SortItemsParams<T>): T[] {
  const requestedField =
    sort && Object.hasOwn(fields, sort) ? fields[sort] : undefined;
  const field = requestedField ?? fields[defaultSort];
  const direction =
    (order ?? (requestedField ? 'asc' : defaultOrder)) === 'desc' ? -1 : 1;
  return items.toSorted((a, b) => {
    const left = field(a);
    const right = field(b);
    return (
      direction *
      (typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right)))
    );
  });
}
