/*
    Migration Script: Create Stored Procedure [vendors].[sp_Dashboard_GetAllBookings]
    Description: Gets all bookings for vendor dashboard
    
    Execution Order: 706
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Dashboard_GetAllBookings]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetAllBookings]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetAllBookings];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetAllBookings]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM bookings.vw_UnifiedBookings WHERE VendorProfileID = @VendorProfileID ORDER BY EventDate DESC;
END;
GO

PRINT 'Stored procedure [vendors].[sp_Dashboard_GetAllBookings] created successfully.';
GO
