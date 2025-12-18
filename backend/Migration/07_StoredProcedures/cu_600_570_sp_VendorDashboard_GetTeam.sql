-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetTeam
-- Description: Gets vendor team members
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetTeam]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetTeam];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetTeam]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TeamID, Name, Role, Bio, ImageURL, DisplayOrder 
    FROM VendorTeam WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
END
GO
