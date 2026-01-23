/*
    Migration Script: Create Stored Procedure [users].[sp_GetBookingRequests]
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetBookingRequests]'))
    DROP PROCEDURE [users].[sp_GetBookingRequests];
GO


CREATE PROCEDURE [users].[sp_GetBookingRequests]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM bookings.Bookings WHERE UserID = @UserID AND Status = 'pending' ORDER BY EventDate DESC;
END;
GO
