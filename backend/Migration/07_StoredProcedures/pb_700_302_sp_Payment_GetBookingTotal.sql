-- =============================================
-- Stored Procedure: payments.sp_GetBookingTotal
-- Description: Gets booking total amount
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingTotal]'))
    DROP PROCEDURE [payments].[sp_GetBookingTotal];
GO

CREATE PROCEDURE [payments].[sp_GetBookingTotal]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 TotalAmount FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

