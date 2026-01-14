/*
    Migration Script: Create Stored Procedure [bookings].[sp_GetRequestDetails]
    Description: Gets details for a specific booking/request
    
    Execution Order: 711
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_GetRequestDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetRequestDetails]'))
    DROP PROCEDURE [bookings].[sp_GetRequestDetails];
GO

CREATE PROCEDURE [bookings].[sp_GetRequestDetails]
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM bookings.vw_UnifiedBookings WHERE BookingID = @RequestID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_GetRequestDetails] created successfully.';
GO
