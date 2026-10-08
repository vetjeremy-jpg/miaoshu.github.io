// Offline-only schema validation. This module intentionally has no network, storage or DOM APIs.
export const EVENT_FIELDS = Object.freeze({
  reader_start: ['work_id', 'chapter_index', 'event_version'],
  reader_next_chapter: ['work_id', 'chapter_index', 'event_version'],
  reader_complete: ['work_id', 'chapter_index', 'event_version'],
  explore_open: ['entry_id', 'destination_id', 'event_version'],
  explore_arrive: ['entry_id', 'destination_id', 'event_version'],
  subscribe_submit: ['form_id', 'event_version'],
  subscribe_success: ['form_id', 'event_version'],
  subscribe_failure: ['form_id', 'event_version']
});
const ids = /^[a-z][a-z0-9_-]{0,63}$/;
export function validateEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return false;
  const allowed = Object.prototype.hasOwnProperty.call(EVENT_FIELDS, event.name) ? EVENT_FIELDS[event.name] : null;
  if (!allowed || !event.properties || typeof event.properties !== 'object' || Array.isArray(event.properties)) return false;
  const keys = Object.keys(event.properties);
  if (keys.length !== allowed.length || !keys.every(key => allowed.includes(key))) return false;
  return allowed.every(key => {
    const value = event.properties[key];
    if (key === 'event_version') return value === 1;
    if (key === 'chapter_index') return Number.isSafeInteger(value) && value >= 0;
    return typeof value === 'string' && ids.test(value);
  });
}
export function mayRecordEvent({ consent, providerReviewed } = {}) {
  return consent === true && providerReviewed === true;
}
