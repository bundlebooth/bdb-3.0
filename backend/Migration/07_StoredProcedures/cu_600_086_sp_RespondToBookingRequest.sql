/*
    Migration Script: Create Stored Procedure [sp_RespondToBookingRequest]
    Phase: 600 - Stored Procedures
    Script: cu_600_086_dbo.sp_RespondToBookingRequest.sql
    Description: Creates the [bookings].[sp_RespondToRequest] stored procedure
    
    Execution Order: 86
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_RespondToRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_RespondToRequest]'))
    DROP PROCEDURE [bookings].[sp_RespondToRequest];
GO

CREATE   PROCEDURE [bookings].[sp_RespondToRequest]
    @RequestID INT,
    @VendorUserID INT,
    @Response NVARCHAR(20), -- 'approved', 'declined', 'counter_offer'
    @ProposedPrice DECIMAL(10, 2) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @AlternativeDate DATE = NULL,
    @AlternativeTime TIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verify vendor owns this request
        DECLARE @VendorProfileID INT;
        DECLARE @UserID INT;
        DECLARE @CurrentStatus NVARCHAR(50);
        
        SELECT 
            @VendorProfileID = br.VendorProfileID,
            @UserID = br.UserID,
            @CurrentStatus = br.Status
        FROM bookings.BookingRequests br
        JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
        WHERE br.RequestID = @RequestID AND vp.UserID = @VendorUserID;
        
        IF @VendorProfileID IS NULL
        BEGIN
            SELECT 
                'error' AS Status,
                'Request not found or access denied' AS Message;
            RETURN;
        END
        
        IF @CurrentStatus != 'pending'
        BEGIN
            SELECT 
                'error' AS Status,
                'Request has already been responded to' AS Message;
            RETURN;
        END
        
        -- Update request
        UPDATE bookings.BookingRequests 
        SET 
            Status = @Response,
            ProposedPrice = @ProposedPrice,
            ResponseMessage = @ResponseMessage,
            AlternativeDate = @AlternativeDate,
            AlternativeTime = @AlternativeTime,
            RespondedAt = GETDATE()
        WHERE RequestID = @RequestID;
        
        -- Create notification for user
        DECLARE @NotificationTitle NVARCHAR(200);
        DECLARE @NotificationMessage NVARCHAR(MAX);
        DECLARE @VendorName NVARCHAR(100);
        
        SELECT @VendorName = BusinessName FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
        
        IF @Response = 'approved'
        BEGIN
            SET @NotificationTitle = 'Booking Request Approved!';
            SET @NotificationMessage = @VendorName + ' has approved your booking request.';
        END
        ELSE IF @Response = 'declined'
        BEGIN
            SET @NotificationTitle = 'Booking Request Declined';
            SET @NotificationMessage = @VendorName + ' has declined your booking request.';
        END
        ELSE IF @Response = 'counter_offer'
        BEGIN
            SET @NotificationTitle = 'Counter Offer Received';
            SET @NotificationMessage = @VendorName + ' has sent you a counter offer for your booking request.';
        END
        
        INSERT INTO notifications.Notifications (UserID, Title, Message, Type, RelatedID, RelatedType)
        VALUES (@UserID, @NotificationTitle, @NotificationMessage, 'booking_response', @RequestID, 'request');
        
        -- Send message in conversation
        DECLARE @ConversationID INT;
        SELECT @ConversationID = ConversationID 
        FROM messages.Conversations 
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ORDER BY CreatedAt DESC;
        
        IF @ConversationID IS NOT NULL AND @ResponseMessage IS NOT NULL
        BEGIN
            EXEC messages.sp_SendMessage 
                @ConversationID = @ConversationID,
                @SenderID = @VendorUserID,
                @Content = @ResponseMessage;
        END
        
        SELECT 
            'success' AS Status,
            'Response sent successfully' AS Message,
            @RequestID AS RequestID;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        SELECT 
            'error' AS Status,
            'Error responding to request: ' + @ErrorMessage AS Message;
    END CATCH
END;

GO

PRINT 'Stored procedure [bookings].[sp_RespondToRequest] created successfully.';
GO





