-- =============================================
-- Stored Procedure: vendors.sp_InsertServiceArea
-- Description: Inserts a service area for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertServiceArea]'))
    DROP PROCEDURE [vendors].[sp_InsertServiceArea];
GO

CREATE PROCEDURE [vendors].[sp_InsertServiceArea]
    @VendorProfileID INT,
    @GooglePlaceID NVARCHAR(100),
    @CityName NVARCHAR(100),
    @StateProvince NVARCHAR(100) = '',
    @Country NVARCHAR(100) = ''
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorServiceAreas (VendorProfileID, GooglePlaceID, CityName, [State/Province], Country, IsActive, CreatedDate, LastModifiedDate)
    VALUES (@VendorProfileID, @GooglePlaceID, @CityName, @StateProvince, @Country, 1, GETDATE(), GETDATE());
    
    SELECT SCOPE_IDENTITY() AS VendorServiceAreaID;
END
GO
