-- =============================================
-- Stored Procedure: sp_User_UpdateProfile
-- Description: Updates user name and phone
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_UpdateProfile]'))
    DROP PROCEDURE [dbo].[sp_User_UpdateProfile];
GO

CREATE PROCEDURE [dbo].[sp_User_UpdateProfile]
    @UserID INT,
    @Name NVARCHAR(100),
    @Phone NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users 
    SET Name = @Name, Phone = @Phone, UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
END
GO
