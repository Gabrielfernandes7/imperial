import { StateSnapshot } from './StateSnapshot';

export interface StateDiff {
  fromRevision: number;
  toRevision: number;
  changed: Partial<StateSnapshot>;
}

export function createStateDiff(
  previous: StateSnapshot,
  next: StateSnapshot,
): StateDiff {
  const changed: Partial<StateSnapshot> = {};

  (Object.keys(next) as Array<keyof StateSnapshot>).forEach((key) => {
    if (JSON.stringify(previous[key]) !== JSON.stringify(next[key])) {
      Object.assign(changed, { [key]: next[key] });
    }
  });

  return {
    fromRevision: previous.revision,
    toRevision: next.revision,
    changed,
  };
}
