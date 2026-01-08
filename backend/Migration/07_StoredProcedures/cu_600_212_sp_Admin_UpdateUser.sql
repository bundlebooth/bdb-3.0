-- =============================================
-- Stored Procedure: admin.sp_UpdateUser
-- Description: Updates user details
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpdateUser]'))
    DROP PROCEDURE [admin].[sp_UpdateUser];
GO

CREATE PROCEDURE [admin].[sp_UpdateUser]
    @UserID INT,
    @Name NVARCHAR(100),
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET Name = @Name, 
        Email = @Email, 
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

