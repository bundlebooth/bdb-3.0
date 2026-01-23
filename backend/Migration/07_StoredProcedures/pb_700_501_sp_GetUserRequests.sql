/*
    Migration Script: Create Stored Procedure [bookings].[sp_GetUserRequests]
    Description: Creates the [bookings].[sp_GetUserRequests] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetUserRequests]'))
    DROP PROCEDURE [bookings].[sp_GetUserRequests];
GO


CREATE PROCEDURE [bookings].[sp_GetUserRequests]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM bookings.vw_UnifiedBookings WHERE UserID = @UserID AND UnifiedStatus = 'pending' ORDER BY EventDate DESC;
END;
GO
