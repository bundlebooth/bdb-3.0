/*
    Migration Script: Create Stored Procedure [sp_UpdateUserPassword]
    Phase: 600 - Stored Procedures
    Script: cu_600_101_dbo.sp_UpdateUserPassword.sql
    Description: Creates the [users].[sp_UpdatePassword] stored procedure
    
    Execution Order: 101
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_UpdatePassword]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdatePassword]'))
    DROP PROCEDURE [users].[sp_UpdatePassword];
GO

CREATE   PROCEDURE [users].[sp_UpdatePassword]
    @UserID INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE users.Users
    SET 
        PasswordHash = @PasswordHash,
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [users].[sp_UpdatePassword] created successfully.';
GO

