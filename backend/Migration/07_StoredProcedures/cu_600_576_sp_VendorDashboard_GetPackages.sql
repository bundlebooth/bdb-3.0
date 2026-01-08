-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetPackages
-- Description: Gets vendor packages
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetPackages]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetPackages];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetPackages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT PackageID, Name, Description, Price, DurationMinutes, MaxGuests, WhatsIncluded
    FROM Packages WHERE VendorProfileID = @VendorProfileID ORDER BY PackageID;
END
GO
