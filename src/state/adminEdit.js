const EDIT_TTL_MS = 15 * 60 * 1000;

const edits = new Map();

export function getAdminEdit(userId) {
  const edit = edits.get(userId);
  if (!edit) {
    return undefined;
  }

  if (Date.now() - edit.updatedAt > EDIT_TTL_MS) {
    edits.delete(userId);
    return undefined;
  }

  edit.updatedAt = Date.now();
  return edit;
}

export function setAdminEdit(userId, edit) {
  const next = { ...edit, updatedAt: Date.now() };
  edits.set(userId, next);
  return next;
}

export function clearAdminEdit(userId) {
  edits.delete(userId);
}
