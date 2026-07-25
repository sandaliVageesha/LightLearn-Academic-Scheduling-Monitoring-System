export const ACTION_BADGE = {
  CREATE: { tone: 'success', label: 'Created' },
  UPDATE: { tone: 'accent',  label: 'Updated' },
  DELETE: { tone: 'danger',  label: 'Deleted' },
  LOGIN:  { tone: 'success', label: 'Login' },
  LOGOUT: { tone: 'neutral', label: 'Logout' },
};

export const MODULE_LABEL = {
  INSTITUTION: 'Institution',
  COURSE:      'Course',
  EDUCATOR:    'Educator',
  BATCH:       'Batch',
  STUDENT:     'Student',
};

export function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
