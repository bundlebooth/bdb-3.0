/*
    Migration Script: Stored Procedure - Get Users By Role
    Phase: 700 - Stored Procedures
    Script: pb_700_374_sp_User_GetByRole.sql
    Description: Gets all active users with a specific role.
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_User_GetByRole]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_User_GetByRole];
GO

CREATE PROCEDURE [users].[sp_User_GetByRole]
    @IsVendor BIT = NULL,
    @IsAdmin BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID 
    FROM [users].[Users] 
    WHERE IsActive = 1
      AND (@IsVendor IS NULL OR IsVendor = @IsVendor)
      AND (@IsAdmin IS NULL OR IsAdmin = @IsAdmin);
END
GO

PRINT 'Created stored procedure: [users].[sp_User_GetByRole]';
GO
