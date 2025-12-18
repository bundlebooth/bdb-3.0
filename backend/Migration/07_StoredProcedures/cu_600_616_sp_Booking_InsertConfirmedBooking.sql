-- =============================================
-- Stored Procedure: sp_Booking_InsertConfirmedBooking
-- Description: Creates a confirmed booking from request
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_InsertConfirmedBooking]'))
    DROP PROCEDURE [dbo].[sp_Booking_InsertConfirmedBooking];
GO

CREATE PROCEDURE [dbo].[sp_Booking_InsertConfirmedBooking]
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
    
    INSERT INTO Bookings (UserID, VendorProfileID, ServiceID, EventDate, Status, AttendeeCount, SpecialRequests, TotalAmount)
    OUTPUT INSERTED.BookingID
    VALUES (@UserID, @VendorProfileID, @ServiceID, @EventDate, @Status, @AttendeeCount, @SpecialRequests, @TotalAmount);
END
GO
