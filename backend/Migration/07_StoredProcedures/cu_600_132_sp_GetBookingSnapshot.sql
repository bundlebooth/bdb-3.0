-- =============================================
-- Stored Procedure: bookings.sp_GetSnapshot
-- Description: Gets complete booking snapshot with services and transactions
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetSnapshot]'))
    DROP PROCEDURE [bookings].[sp_GetSnapshot];
GO

CREATE PROCEDURE [bookings].[sp_GetSnapshot]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Return booking core
    SELECT TOP 1 
        b.BookingID, b.UserID, b.VendorProfileID, b.EventDate, b.EndDate, b.Status,
        b.TotalAmount, b.DepositAmount, b.DepositPaid, b.FullAmountPaid,
        b.EventName, b.EventType, b.EventLocation, b.TimeZone, b.ServiceID,
        u.Name AS ClientName, u.Email AS ClientEmail,
        vp.BusinessName AS VendorName
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
    
    -- Return services
    SELECT bs.BookingServiceID, bs.Quantity, bs.PriceAtBooking,
           s.ServiceID, s.Name AS ServiceName, s.DurationMinutes
    FROM bookings.BookingServices bs
    LEFT JOIN vendors.Services s ON bs.ServiceID = s.ServiceID
    WHERE bs.BookingID = @BookingID;
    
    -- Return expenses (if table exists)
    IF OBJECT_ID('dbo.BookingExpenses', 'U') IS NOT NULL
    BEGIN
        SELECT BookingExpenseID, Title, Amount, Notes, CreatedAt
        FROM BookingExpenses
        WHERE BookingID = @BookingID
        ORDER BY CreatedAt ASC;
    END
    
    -- Return transactions
    SELECT StripeChargeID, FeeAmount, Amount, CreatedAt
    FROM payments.Transactions
    WHERE BookingID = @BookingID AND Status = 'succeeded'
    ORDER BY CreatedAt ASC;
END
GO





