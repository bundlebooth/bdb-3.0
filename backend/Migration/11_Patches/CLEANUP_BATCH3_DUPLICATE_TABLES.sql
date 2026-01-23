-- ============================================================================
-- DATABASE CLEANUP - BATCH 3: Remove Duplicate Table Definition Files
-- ============================================================================
-- Date: January 22, 2026
-- Risk Level: LOW (only affects migration folder, not live database)
-- Description: Removes older duplicate table definition files from the 
--              migration folder. The live database tables are NOT affected.
-- ============================================================================

-- NOTE: This script does NOT drop any tables from the database.
-- It only documents which migration files should be deleted from the repository
-- to avoid confusion about which table definition is authoritative.

-- The duplicate table definitions exist because tables were redefined with
-- additional columns or modifications. The newer files contain the complete
-- and current table structure.

PRINT 'Batch 3 - Table definition cleanup is a FILE-ONLY operation';
PRINT 'No database changes are made by this script';
GO

-- ============================================================================
-- FILES TO DELETE FROM MIGRATION FOLDER (02_Tables):
-- ============================================================================
-- Keep the NEWER file (higher number), delete the OLDER file:
--
-- 1. DELETE: cu_100_04_EmailTemplates.sql
--    KEEP:   cu_100_60_EmailTemplates.sql
--
-- 2. DELETE: cu_100_19_EmailLogs.sql
--    KEEP:   cu_100_61_EmailLogs.sql
--
-- 3. DELETE: cu_100_50_EmailQueue.sql
--    KEEP:   cu_200_95_EmailQueue.sql
--
-- 4. DELETE: cu_100_64_FAQFeedback.sql
--    KEEP:   cu_200_95_FAQFeedback.sql
--
-- 5. DELETE: cu_100_16_SecurityLogs.sql
--    KEEP:   cu_200_91_SecurityLogs.sql
--
-- 6. DELETE: cu_100_06_SecuritySettings.sql
--    KEEP:   cu_200_92_SecuritySettings.sql
--
-- 7. DELETE: cu_100_15_UserTwoFactorCodes.sql
--    KEEP:   cu_200_90_UserTwoFactorCodes.sql
--
-- ============================================================================
-- TOTAL FILES TO DELETE: 7
-- ============================================================================
