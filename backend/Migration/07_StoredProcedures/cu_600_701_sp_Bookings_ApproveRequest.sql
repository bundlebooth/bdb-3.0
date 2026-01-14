/*
    Migration Script: Create Stored Procedure [bookings].[sp_ApproveRequest]
    Description: Vendor approves a booking request
    
    Execution Order: 701
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_ApproveRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_ApproveRequest]'))
    DROP PROCEDURE [bookings].[sp_ApproveRequest];
GO

CREATE PROCEDURE [bookings].[sp_ApproveRequest]
    @RequestID INT,
    @VendorProfileID INT,
    @Status NVARCHAR(50) = 'approved',
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
        RespondedAt = COALESCE(@RespondedAt, GETDATE()),
        UpdatedAt = GETDATE()
    WHERE BookingID = @RequestID;
    
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@RequestID, @Status, NULL, 'Vendor approved booking', GETDATE());
    
    SELECT @UserID AS UserID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_ApproveRequest] created successfully.';
GO
