/*
    Migration Script: Create Stored Procedure [bookings].[sp_DeclineBooking]
    Description: Creates the [bookings].[sp_DeclineBooking] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_DeclineBooking]'))
    DROP PROCEDURE [bookings].[sp_DeclineBooking];
GO


CREATE PROCEDURE [bookings].[sp_DeclineBooking]
    @BookingID INT,
    @VendorProfileID INT,
    @DeclinedReason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserID INT;
    
    -- Verify booking exists and belongs to this vendor
    SELECT @UserID = UserID
    FROM bookings.Bookings
    WHERE BookingID = @BookingID 
      AND VendorProfileID = @VendorProfileID
      AND Status = 'pending';
    
    IF @UserID IS NULL
    BEGIN
        RAISERROR('Booking not found or not in pending status', 16, 1);
        RETURN;
    END
    
    -- Update booking
    UPDATE bookings.Bookings
    SET Status = 'declined',
        DeclinedReason = @DeclinedReason,
        RespondedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    -- Add to timeline
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@BookingID, 'declined', NULL, COALESCE(@DeclinedReason, 'Vendor declined booking'), GETDATE());
    
    SELECT @BookingID AS BookingID, @UserID AS UserID;
END;
GO
