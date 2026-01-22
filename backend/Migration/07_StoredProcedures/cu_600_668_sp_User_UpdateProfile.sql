-- =============================================
-- Stored Procedure: users.sp_UpdateProfile
-- Description: Updates user name and phone
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateProfile]'))
    DROP PROCEDURE [users].[sp_UpdateProfile];
GO

CREATE PROCEDURE [users].[sp_UpdateProfile]
    @UserID INT,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100) = NULL,
    @Phone NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET FirstName = @FirstName, LastName = @LastName, Phone = @Phone, UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
END
GO

