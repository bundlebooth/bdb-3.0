-- =============================================
-- Stored Procedure: sp_Vendor_CheckProfileExists
-- Description: Checks if vendor profile exists for a user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_CheckProfileExists]'))
    DROP PROCEDURE [dbo].[sp_Vendor_CheckProfileExists];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_CheckProfileExists]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID;
END
GO
