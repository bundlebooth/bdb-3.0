/*
    Migration Script: Create Stored Procedure [bookings].[sp_ApproveBooking]
    Description: Creates the [bookings].[sp_ApproveBooking] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_ApproveBooking]'))
    DROP PROCEDURE [bookings].[sp_ApproveBooking];
GO


CREATE PROCEDURE [bookings].[sp_ApproveBooking]
    @BookingID INT,
    @VendorProfileID INT,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @ProposedPrice DECIMAL(10,2) = NULL
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
    SET Status = 'approved',
        ResponseMessage = @ResponseMessage,
        ProposedPrice = @ProposedPrice,
        TotalAmount = COALESCE(@ProposedPrice, TotalAmount, Budget),
        RespondedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    -- Add to timeline
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@BookingID, 'approved', NULL, 'Vendor approved booking', GETDATE());
    
    SELECT @BookingID AS BookingID, @UserID AS UserID;
END;
GO
