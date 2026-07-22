PRAGMA foreign_keys = ON;

UPDATE notebooks
SET
  name = 'Inbox',
  icon = 'notebook',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'nb_inbox'
   OR slug = 'inbox';
