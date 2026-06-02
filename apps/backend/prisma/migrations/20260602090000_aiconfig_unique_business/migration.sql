-- A business must have at most one AiConfig. Duplicates caused the wrong
-- (inactive / greeting-disabled) row to be read by findFirst, so saved
-- automation settings appeared to do nothing.

-- Deduplicate: keep the most recently updated config per business,
-- breaking ties on the lowest id for determinism.
DELETE FROM "AiConfig" a
USING "AiConfig" b
WHERE a."businessId" = b."businessId"
  AND (
    a."updatedAt" < b."updatedAt"
    OR (a."updatedAt" = b."updatedAt" AND a."id" > b."id")
  );

-- Enforce one-to-one going forward.
CREATE UNIQUE INDEX "AiConfig_businessId_key" ON "AiConfig"("businessId");
