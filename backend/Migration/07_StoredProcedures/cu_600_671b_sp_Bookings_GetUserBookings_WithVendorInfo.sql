/*
    Migration Script: Update Stored Procedure [bookings].[sp_GetUserBookings]
    Phase: 600 - Stored Procedures
    Script: cu_600_671b_sp_Bookings_GetUserBookings_WithVendorInfo.sql
    Description: Updates the [bookings].[sp_GetUserBookings] stored procedure
                 to include vendor info (MemberSince, LastActive, ResponseTime)
    
    Execution Order: 671b
*/

SET NOCOUNT ON;
GO

PRINT 'Updating stored procedure [bookings].[sp_GetUserBookings] with vendor info...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetUserBookings]'))
    DROP PROCEDURE [bookings].[sp_GetUserBookings];
GO

CREATE PROCEDURE [bookings].[sp_GetUserBookings]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.*,
        vp.BusinessName AS VendorName,
        vp.LogoURL AS VendorLogoUrl,
        vp.CreatedAt AS VendorMemberSince,
        vu.LastActiveAt AS VendorLastActive,
        vrt.AvgResponseMinutes AS VendorResponseMinutes
    FROM bookings.Bookings b
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    LEFT JOIN users.Users vu ON vp.UserID = vu.UserID
    LEFT JOIN vendors.vw_VendorResponseTimes vrt ON vp.VendorProfileID = vrt.VendorProfileID
    WHERE b.UserID = @UserID
    ORDER BY b.EventDate DESC;
END;

GO

PRINT 'Stored procedure [bookings].[sp_GetUserBookings] updated successfully.';
GO
