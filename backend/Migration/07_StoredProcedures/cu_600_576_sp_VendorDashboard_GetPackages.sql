-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetPackages
-- Description: Gets vendor packages
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetPackages]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetPackages];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetPackages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT PackageID, Name, Description, Price, DurationMinutes, MaxGuests, WhatsIncluded
    FROM Packages WHERE VendorProfileID = @VendorProfileID ORDER BY PackageID;
END
GO
