-- =============================================
-- Stored Procedure: admin.sp_ToggleUserStatus
-- Description: Toggles user active status
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_ToggleUserStatus]'))
    DROP PROCEDURE [admin].[sp_ToggleUserStatus];
GO

CREATE PROCEDURE [admin].[sp_ToggleUserStatus]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET IsActive = CASE WHEN IsActive = 1 THEN 0 ELSE 1 END
    WHERE UserID = @UserID;
    
    SELECT IsActive FROM users.Users WHERE UserID = @UserID;
END
GO

