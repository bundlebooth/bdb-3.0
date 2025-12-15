/*
    Migration Script: Create Stored Procedure [sp_UpdateUserPassword]
    Phase: 600 - Stored Procedures
    Script: cu_600_101_dbo.sp_UpdateUserPassword.sql
    Description: Creates the [dbo].[sp_UpdateUserPassword] stored procedure
    
    Execution Order: 101
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateUserPassword]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateUserPassword]'))
    DROP PROCEDURE [dbo].[sp_UpdateUserPassword];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateUserPassword]
    @UserID INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET 
        PasswordHash = @PasswordHash,
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateUserPassword] created successfully.';
GO
