-- =============================================
-- Stored Procedure: bookings.sp_InsertConfirmedBooking
-- Description: Creates a confirmed booking from request
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertConfirmedBooking]'))
    DROP PROCEDURE [bookings].[sp_InsertConfirmedBooking];
GO

CREATE PROCEDURE [bookings].[sp_InsertConfirmedBooking]
    @UserID INT,
    @VendorProfileID INT,
    @ServiceID INT,
    @EventDate DATETIME,
    @Status NVARCHAR(20),
    @AttendeeCount INT,
    @SpecialRequests NVARCHAR(MAX),
    @TotalAmount DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO bookings.Bookings (UserID, VendorProfileID, ServiceID, EventDate, Status, AttendeeCount, SpecialRequests, TotalAmount)
    OUTPUT INSERTED.BookingID
    VALUES (@UserID, @VendorProfileID, @ServiceID, @EventDate, @Status, @AttendeeCount, @SpecialRequests, @TotalAmount);
END
GO

