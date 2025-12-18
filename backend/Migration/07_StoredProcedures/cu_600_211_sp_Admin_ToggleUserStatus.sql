-- =============================================
-- Stored Procedure: sp_Admin_ToggleUserStatus
-- Description: Toggles user active status
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_ToggleUserStatus]'))
    DROP PROCEDURE [dbo].[sp_Admin_ToggleUserStatus];
GO

CREATE PROCEDURE [dbo].[sp_Admin_ToggleUserStatus]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users 
    SET IsActive = CASE WHEN IsActive = 1 THEN 0 ELSE 1 END
    WHERE UserID = @UserID;
    
    SELECT IsActive FROM Users WHERE UserID = @UserID;
END
GO
