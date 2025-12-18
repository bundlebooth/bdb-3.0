-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetTeam
-- Description: Gets vendor team members
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetTeam]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetTeam];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetTeam]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TeamID, Name, Role, Bio, ImageURL, DisplayOrder 
    FROM VendorTeam WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
END
GO
