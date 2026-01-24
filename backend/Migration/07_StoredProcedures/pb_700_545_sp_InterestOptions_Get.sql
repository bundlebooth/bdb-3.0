/*
    Migration Script: Create Stored Procedure [sp_GetInterestOptions]
    Phase: 700 - Stored Procedures
    Script: pb_700_545_sp_InterestOptions_Get.sql
    Description: Gets predefined interest options
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_GetInterestOptions]') AND type in (N'P'))
    DROP PROCEDURE [users].[sp_GetInterestOptions];
GO

CREATE PROCEDURE [users].[sp_GetInterestOptions]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT InterestOptionID, Interest, Category, Icon
    FROM users.InterestOptions
    WHERE IsActive = 1
    ORDER BY Category, Interest;
END
GO

PRINT 'Created stored procedure [users].[sp_GetInterestOptions]';
GO
