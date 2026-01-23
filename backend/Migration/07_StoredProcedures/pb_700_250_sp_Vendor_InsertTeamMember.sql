-- =============================================
-- Stored Procedure: vendors.sp_InsertTeamMember
-- Description: Inserts a team member for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertTeamMember]'))
    DROP PROCEDURE [vendors].[sp_InsertTeamMember];
GO

CREATE PROCEDURE [vendors].[sp_InsertTeamMember]
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
