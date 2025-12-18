-- =============================================
-- Stored Procedure: sp_Vendor_GetAvailabilityExceptions
-- Description: Gets availability exceptions for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetAvailabilityExceptions]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetAvailabilityExceptions];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetAvailabilityExceptions]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Date, IsAvailable, Reason
    FROM VendorAvailabilityExceptions
    WHERE VendorProfileID = @VendorProfileID
    AND Date >= CAST(GETDATE() AS DATE)
    ORDER BY Date;
END
GO
