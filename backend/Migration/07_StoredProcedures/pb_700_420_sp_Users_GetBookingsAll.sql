/*
    Migration Script: Create Stored Procedure [users].[sp_GetBookingsAll]
    Description: Gets all bookings for a user (alias for sp_GetUnifiedBookings)
    
    Execution Order: 707
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetBookingsAll]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetBookingsAll]'))
    DROP PROCEDURE [users].[sp_GetBookingsAll];
GO

CREATE PROCEDURE [users].[sp_GetBookingsAll]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM bookings.vw_UnifiedBookings WHERE UserID = @UserID ORDER BY EventDate DESC;
END;
GO

PRINT 'Stored procedure [users].[sp_GetBookingsAll] created successfully.';
GO
