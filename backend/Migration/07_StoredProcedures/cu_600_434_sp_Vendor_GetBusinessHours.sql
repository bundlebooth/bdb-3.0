-- =============================================
-- Stored Procedure: sp_Vendor_GetBusinessHours
-- Description: Gets business hours for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetBusinessHours]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetBusinessHours];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetBusinessHours]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DayOfWeek, IsAvailable, OpenTime, CloseTime
    FROM VendorBusinessHours
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;
END
GO
