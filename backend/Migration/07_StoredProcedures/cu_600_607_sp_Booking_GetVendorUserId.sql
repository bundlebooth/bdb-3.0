-- =============================================
-- Stored Procedure: sp_Booking_GetVendorUserId
-- Description: Gets vendor's user ID from vendor profile
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetVendorUserId]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetVendorUserId];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetVendorUserId]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
