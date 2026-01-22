/*
    Migration Script: Create Stored Procedure [users].[sp_SoftDeleteUser]
    Description: Soft deletes a user account (sets IsDeleted flag)
    
    Execution Order: 724
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_SoftDeleteUser]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_SoftDeleteUser]'))
    DROP PROCEDURE [users].[sp_SoftDeleteUser];
GO

CREATE PROCEDURE [users].[sp_SoftDeleteUser]
    @UserID INT,
    @Reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Check if user exists and is not already deleted
        IF NOT EXISTS (SELECT 1 FROM users.Users WHERE UserID = @UserID)
        BEGIN
            SELECT 0 AS Success, 'User not found' AS Message;
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM users.Users WHERE UserID = @UserID AND IsDeleted = 1)
        BEGIN
            SELECT 0 AS Success, 'Account is already deleted' AS Message;
            RETURN;
        END

        -- Soft delete the user
        UPDATE users.Users
        SET IsDeleted = 1,
            DeletedAt = GETDATE(),
            DeletedReason = @Reason,
            IsActive = 0,
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;

        SELECT 1 AS Success, 'Account deleted successfully' AS Message;
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;
GO

PRINT 'Stored procedure [users].[sp_SoftDeleteUser] created successfully.';
GO
