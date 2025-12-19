/*
    Migration Script: Create Stored Procedure [bookings].[sp_GetUserBookings]
    Phase: 600 - Stored Procedures
    Script: cu_600_671_sp_Bookings_GetUserBookings.sql
    Description: Creates the [bookings].[sp_GetUserBookings] stored procedure
                 Used by GET /api/bookings/user/:userId endpoint
    
    Execution Order: 671
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_GetUserBookings]...';
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
        vp.BusinessName AS VendorName
    FROM bookings.Bookings b
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.UserID = @UserID
    ORDER BY b.EventDate DESC;
END;

GO

PRINT 'Stored procedure [bookings].[sp_GetUserBookings] created successfully.';
GO
