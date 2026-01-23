/*
    Migration Script: Create Stored Procedure [bookings].[sp_DeclineRequest]
    Description: Vendor declines a booking request
    
    Execution Order: 702
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_DeclineRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_DeclineRequest]'))
    DROP PROCEDURE [bookings].[sp_DeclineRequest];
GO

CREATE PROCEDURE [bookings].[sp_DeclineRequest]
    @RequestID INT,
    @VendorProfileID INT,
    @Status NVARCHAR(50) = 'declined',
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @RespondedAt DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserID INT;
    
    SELECT @UserID = UserID
    FROM bookings.Bookings
    WHERE BookingID = @RequestID 
      AND VendorProfileID = @VendorProfileID
      AND Status = 'pending';
    
    IF @UserID IS NULL
    BEGIN
        SELECT NULL AS UserID;
        RETURN;
    END
    
    UPDATE bookings.Bookings
    SET Status = @Status,
        ResponseMessage = @ResponseMessage,
        DeclinedReason = @ResponseMessage,
        RespondedAt = COALESCE(@RespondedAt, GETDATE()),
        UpdatedAt = GETDATE()
    WHERE BookingID = @RequestID;
    
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@RequestID, @Status, NULL, COALESCE(@ResponseMessage, 'Vendor declined booking'), GETDATE());
    
    SELECT @UserID AS UserID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_DeclineRequest] created successfully.';
GO
