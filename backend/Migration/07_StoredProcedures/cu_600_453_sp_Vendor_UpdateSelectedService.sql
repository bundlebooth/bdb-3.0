-- =============================================
-- Stored Procedure: vendors.sp_UpdateSelectedService
-- Description: Updates a selected service for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateSelectedService]'))
    DROP PROCEDURE [vendors].[sp_UpdateSelectedService];
GO

CREATE PROCEDURE [vendors].[sp_UpdateSelectedService]
    @VendorSelectedServiceID INT,
    @VendorProfileID INT,
    @VendorPrice DECIMAL(10,2) = NULL,
    @VendorDescription NVARCHAR(MAX) = NULL,
    @VendorDurationMinutes INT = NULL,
    @ImageURL NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorSelectedServices
    SET 
        VendorPrice = ISNULL(@VendorPrice, VendorPrice),
        VendorDescription = @VendorDescription,
        VendorDurationMinutes = @VendorDurationMinutes,
        ImageURL = @ImageURL,
        UpdatedAt = GETDATE()
    WHERE VendorSelectedServiceID = @VendorSelectedServiceID
        AND VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

