-- Rename default notebooks from Chinese to English for existing deployments.
UPDATE notebooks
SET name = CASE id
  WHEN 'nb_inbox' THEN 'Inbox'
  WHEN 'nb_projects' THEN 'Work Projects'
  WHEN 'nb_learning' THEN 'Learning Resources'
  WHEN 'nb_creative' THEN 'Creative Ideas'
  WHEN 'nb_personal' THEN 'Personal Life'
  ELSE name
END
WHERE id IN ('nb_inbox', 'nb_projects', 'nb_learning', 'nb_creative', 'nb_personal');
