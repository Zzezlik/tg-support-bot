const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

const drafts = new Map();

export function getDraft(userId) {
  const draft = drafts.get(userId);
  if (!draft) {
    return undefined;
  }

  if (Date.now() - draft.updatedAt > DRAFT_TTL_MS) {
    drafts.delete(userId);
    return undefined;
  }

  draft.updatedAt = Date.now();
  return draft;
}

export function setDraft(userId, draft) {
  const next = { ...draft, updatedAt: Date.now() };
  drafts.set(userId, next);
  return next;
}

export function deleteDraft(userId) {
  drafts.delete(userId);
}
