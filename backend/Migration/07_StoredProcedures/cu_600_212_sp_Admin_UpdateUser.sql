-- =============================================
-- Stored Procedure: sp_Admin_UpdateUser
-- Description: Updates user details
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UpdateUser]'))
    DROP PROCEDURE [dbo].[sp_Admin_UpdateUser];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UpdateUser]
    @UserID INT,
    @Name NVARCHAR(100),
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users 
    SET Name = @Name, 
        Email = @Email, 
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
