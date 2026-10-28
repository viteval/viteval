/**
 * Merge hits onto the original source instrumentation, not transpiler-generated slots.
 * @param source - Coverage collected directly from every production source file.
 * @param reports - Coverage remapped from executed subprocess bundles.
 * @returns Original source maps with matching execution counts combined.
 * @example projectSourceCoverage(unitCoverage, [workerCoverage]);
 */
export function projectSourceCoverage(source, reports) {
  return Object.fromEntries(
    Object.entries(source).map(([file, original]) => {
      const inputs = [
        original,
        ...reports.map((report) => report[file]).filter(Boolean),
      ];
      const statements = hitIndex(
        inputs,
        's',
        'statementMap',
        (location) => location
      );
      const functions = hitIndex(inputs, 'f', 'fnMap', (fn) => fn.loc);
      const branches = new Map();
      for (const input of inputs) {
        for (const [id, branch] of Object.entries(input.branchMap)) {
          const key = JSON.stringify([branch.type, branch.locations]);
          const previous = branches.get(key) ?? [];
          branches.set(
            key,
            input.b[id].map((count, index) =>
              Math.max(previous[index] ?? 0, count)
            )
          );
        }
      }
      return [
        file,
        {
          ...original,
          s: Object.fromEntries(
            Object.entries(original.statementMap).map(([id, location]) => [
              id,
              statements.get(JSON.stringify(location)),
            ])
          ),
          f: Object.fromEntries(
            Object.entries(original.fnMap).map(([id, fn]) => [
              id,
              functions.get(JSON.stringify(fn.loc)),
            ])
          ),
          b: Object.fromEntries(
            Object.entries(original.branchMap).map(([id, branch]) => [
              id,
              branches.get(JSON.stringify([branch.type, branch.locations])),
            ])
          ),
        },
      ];
    })
  );
}

function hitIndex(inputs, counts, locations, location) {
  const hits = new Map();
  for (const input of inputs) {
    for (const [id, value] of Object.entries(input[locations])) {
      const key = JSON.stringify(location(value));
      hits.set(key, Math.max(hits.get(key) ?? 0, input[counts][id]));
    }
  }
  return hits;
}
