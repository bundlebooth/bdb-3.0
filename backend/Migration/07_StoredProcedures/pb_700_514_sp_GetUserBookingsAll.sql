/*
    Migration Script: Create Stored Procedure [users].[sp_GetUserBookingsAll]
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserBookingsAll]'))
    DROP PROCEDURE [users].[sp_GetUserBookingsAll];
GO


CREATE PROCEDURE [users].[sp_GetUserBookingsAll]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Now uses unified Bookings table only
    SELECT * FROM bookings.vw_UnifiedBookings WHERE UserID = @UserID ORDER BY EventDate DESC;
END;
GO
