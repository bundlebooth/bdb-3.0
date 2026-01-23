/*
    Migration Script: Create Stored Procedure [users].[sp_RestoreUser]
    Description: Restores a soft-deleted user account (admin only)
    
    Execution Order: 725
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_RestoreUser]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_RestoreUser]'))
    DROP PROCEDURE [users].[sp_RestoreUser];
GO

CREATE PROCEDURE [users].[sp_RestoreUser]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Check if user exists
        IF NOT EXISTS (SELECT 1 FROM users.Users WHERE UserID = @UserID)
        BEGIN
            SELECT 0 AS Success, 'User not found' AS Message;
            RETURN;
        END

        -- Check if user is deleted
        IF NOT EXISTS (SELECT 1 FROM users.Users WHERE UserID = @UserID AND IsDeleted = 1)
        BEGIN
            SELECT 0 AS Success, 'Account is not deleted' AS Message;
            RETURN;
        END

        -- Restore the user
        UPDATE users.Users
        SET IsDeleted = 0,
            DeletedAt = NULL,
            DeletedReason = NULL,
            IsActive = 1,
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;

        SELECT 1 AS Success, 'Account restored successfully' AS Message;
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;
GO

PRINT 'Stored procedure [users].[sp_RestoreUser] created successfully.';
GO
