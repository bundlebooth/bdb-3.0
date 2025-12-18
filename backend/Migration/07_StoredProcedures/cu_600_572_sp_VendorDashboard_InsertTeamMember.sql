-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_InsertTeamMember
-- Description: Inserts a team member
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_InsertTeamMember]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_InsertTeamMember];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_InsertTeamMember]
    @VendorProfileID INT,
    @Name NVARCHAR(100),
    @Role NVARCHAR(100),
    @Bio NVARCHAR(MAX),
    @ImageURL NVARCHAR(500),
    @DisplayOrder INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorTeam (VendorProfileID, Name, Role, Bio, ImageURL, DisplayOrder)
    VALUES (@VendorProfileID, @Name, @Role, @Bio, @ImageURL, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS TeamID;
END
GO
