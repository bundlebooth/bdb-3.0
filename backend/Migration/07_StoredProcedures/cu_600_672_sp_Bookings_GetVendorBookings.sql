/*
    Migration Script: Create Stored Procedure [bookings].[sp_GetVendorBookings]
    Phase: 600 - Stored Procedures
    Script: cu_600_672_sp_Bookings_GetVendorBookings.sql
    Description: Creates the [bookings].[sp_GetVendorBookings] stored procedure
                 Used by GET /api/bookings/vendor/:vendorId endpoint
    
    Execution Order: 672
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_GetVendorBookings]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorBookings]'))
    DROP PROCEDURE [bookings].[sp_GetVendorBookings];
GO

CREATE PROCEDURE [bookings].[sp_GetVendorBookings]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.*,
        u.Name AS ClientName,
        u.Email AS ClientEmail
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    WHERE b.VendorProfileID = @VendorProfileID
    ORDER BY b.EventDate DESC;
END;

GO

PRINT 'Stored procedure [bookings].[sp_GetVendorBookings] created successfully.';
GO
