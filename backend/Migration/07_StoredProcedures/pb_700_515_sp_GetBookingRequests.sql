/*
    Migration Script: Create Stored Procedure [vendors].[sp_GetBookingRequests]
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetBookingRequests]'))
    DROP PROCEDURE [vendors].[sp_GetBookingRequests];
GO


CREATE PROCEDURE [vendors].[sp_GetBookingRequests]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM bookings.Bookings WHERE VendorProfileID = @VendorProfileID AND Status = 'pending' ORDER BY EventDate DESC;
END;
GO
