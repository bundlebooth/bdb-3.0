-- =============================================
-- Stored Procedure: payments.sp_GetBookingServices
-- Description: Gets booking services with pricing
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingServices]'))
    DROP PROCEDURE [payments].[sp_GetBookingServices];
GO

CREATE PROCEDURE [payments].[sp_GetBookingServices]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Quantity, PriceAtBooking FROM bookings.BookingServices WHERE BookingID = @BookingID;
END
GO

