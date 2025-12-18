-- =============================================
-- Stored Procedure: users.sp_UpdateProfile
-- Description: Updates user name and phone
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateProfile]'))
    DROP PROCEDURE [users].[sp_UpdateProfile];
GO

CREATE PROCEDURE [users].[sp_UpdateProfile]
    @UserID INT,
    @Name NVARCHAR(100),
    @Phone NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET Name = @Name, Phone = @Phone, UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
END
GO

