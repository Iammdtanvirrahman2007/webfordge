export function createHistory(initialState, limit = 100) {
  return { past: [], present: structuredClone(initialState), future: [], limit };
}

export function commitHistory(history, nextState) {
  const next = structuredClone(history);
  next.past.push(next.present);
  if (next.past.length > next.limit) next.past.shift();
  next.present = structuredClone(nextState);
  next.future = [];
  return next;
}

export function undo(history) {
  if (!history.past.length) return history;
  const next = structuredClone(history);
  const previous = next.past.pop();
  next.future.unshift(next.present);
  next.present = previous;
  return next;
}

export function redo(history) {
  if (!history.future.length) return history;
  const next = structuredClone(history);
  const following = next.future.shift();
  next.past.push(next.present);
  next.present = following;
  return next;
}

export function canUndo(history) { return history.past.length > 0; }
export function canRedo(history) { return history.future.length > 0; }
