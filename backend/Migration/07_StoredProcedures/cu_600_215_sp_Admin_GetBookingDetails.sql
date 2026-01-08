-- =============================================
-- Stored Procedure: admin.sp_GetBookingDetails
-- Description: Gets single booking details for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetBookingDetails]'))
    DROP PROCEDURE [admin].[sp_GetBookingDetails];
GO

CREATE PROCEDURE [admin].[sp_GetBookingDetails]
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
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO



