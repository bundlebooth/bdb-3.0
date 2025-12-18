-- =============================================
-- Stored Procedure: sp_Vendor_InsertTeamMember
-- Description: Inserts a team member for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertTeamMember]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertTeamMember];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertTeamMember]
    @VendorProfileID INT,
    @Name NVARCHAR(100),
    @Role NVARCHAR(100) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @ImageURL NVARCHAR(500) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorTeam (VendorProfileID, Name, Role, Bio, ImageURL, DisplayOrder)
    VALUES (@VendorProfileID, @Name, @Role, @Bio, @ImageURL, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS TeamMemberID;
END
GO
