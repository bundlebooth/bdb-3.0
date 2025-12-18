-- =============================================
-- Stored Procedure: sp_Admin_GetBookingDetails
-- Description: Gets single booking details for admin panel
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetBookingDetails]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetBookingDetails];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetBookingDetails]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.*,
        u.Name as ClientName,
        u.Email as ClientEmail,
        u.Phone as ClientPhone,
        vp.BusinessName as VendorName,
        vp.BusinessEmail as VendorEmail,
        vp.BusinessPhone as VendorPhone
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO
