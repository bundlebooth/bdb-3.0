/*
    Migration Script: Create Stored Procedure [bookings].[sp_RespondToRequest]
    Description: Vendor responds to a booking request (approve/decline/counter)
    
    Execution Order: 713
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_RespondToRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_RespondToRequest]'))
    DROP PROCEDURE [bookings].[sp_RespondToRequest];
GO

CREATE PROCEDURE [bookings].[sp_RespondToRequest]
    @RequestID INT,
    @VendorProfileID INT,
    @Status NVARCHAR(50),
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @ProposedPrice DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    
    SELECT @UserID = UserID FROM bookings.Bookings 
    WHERE BookingID = @RequestID AND VendorProfileID = @VendorProfileID AND Status = 'pending';
    
    IF @UserID IS NULL
    BEGIN
        SELECT NULL AS UserID;
        RETURN;
    END
    
    UPDATE bookings.Bookings 
    SET Status = @Status, 
        ResponseMessage = @ResponseMessage, 
        ProposedPrice = @ProposedPrice, 
        TotalAmount = COALESCE(@ProposedPrice, TotalAmount), 
        RespondedAt = GETDATE(), 
        UpdatedAt = GETDATE()
    WHERE BookingID = @RequestID;
    
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@RequestID, @Status, NULL, COALESCE(@ResponseMessage, 'Vendor responded'), GETDATE());
    
    SELECT @UserID AS UserID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_RespondToRequest] created successfully.';
GO
