/*
    Migration Script: Create Stored Procedure [sp_CreateBookingRequest]
    Phase: 600 - Stored Procedures
    Script: cu_600_016_dbo.sp_CreateBookingRequest.sql
    Description: Creates the [dbo].[sp_CreateBookingRequest] stored procedure
    
    Execution Order: 16
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_CreateBookingRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateBookingRequest]'))
    DROP PROCEDURE [dbo].[sp_CreateBookingRequest];
GO

CREATE   PROCEDURE [dbo].[sp_CreateBookingRequest]
    @UserID INT,
    @VendorProfileID INT,
    @ServiceID INT = NULL,
    @EventDate DATE,
    @EventTime TIME = NULL,
    @EventLocation NVARCHAR(500) = NULL,
    @AttendeeCount INT = 1,
    @Budget DECIMAL(10, 2) = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @Services NVARCHAR(MAX) = NULL, -- JSON string for multiple services
    @ExpiresInHours INT = 24
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @RequestID INT;
        DECLARE @ExpiresAt DATETIME = DATEADD(HOUR, @ExpiresInHours, GETDATE());
        
        -- Insert booking request
        INSERT INTO BookingRequests (
            UserID, VendorProfileID, ServiceID, EventDate, EventTime, 
            EventLocation, AttendeeCount, Budget, SpecialRequests, 
            Services, Status, ExpiresAt, CreatedAt
        )
        VALUES (
            @UserID, @VendorProfileID, @ServiceID, @EventDate, @EventTime,
            @EventLocation, @AttendeeCount, @Budget, @SpecialRequests,
            @Services, 'pending', @ExpiresAt, GETDATE()
        );
        
        SET @RequestID = SCOPE_IDENTITY();
        
        -- Create conversation for the request
        DECLARE @ConversationID INT;
        EXEC sp_CreateConversation 
            @UserID = @UserID,
            @VendorProfileID = @VendorProfileID,
            @Subject = 'Booking Request',
            @ConversationID = @ConversationID OUTPUT;
        
        -- Send initial message
        IF @ConversationID IS NOT NULL
        BEGIN
            DECLARE @InitialMessage NVARCHAR(MAX) = 
                'New booking request for ' + CONVERT(NVARCHAR(10), @EventDate, 101);
            
            IF @EventTime IS NOT NULL
                SET @InitialMessage = @InitialMessage + ' at ' + CONVERT(NVARCHAR(8), @EventTime, 108);
            
            SET @InitialMessage = @InitialMessage + '. Please review and respond within ' + 
                CAST(@ExpiresInHours AS NVARCHAR(10)) + ' hours.';
            
            EXEC sp_SendMessage 
                @ConversationID = @ConversationID,
                @SenderID = @UserID,
                @Content = @InitialMessage;
        END
        
        -- Create notification for vendor
        INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID, RelatedType)
        SELECT 
            u.UserID,
            'New Booking Request',
            'You have received a new booking request from ' + (SELECT Name FROM Users WHERE UserID = @UserID),
            'booking_request',
            @RequestID,
            'request'
        FROM Users u
        JOIN VendorProfiles vp ON u.UserID = vp.UserID
        WHERE vp.VendorProfileID = @VendorProfileID;
        
        SELECT 
            @RequestID AS RequestID,
            'success' AS Status,
            'Booking request created successfully' AS Message;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        SELECT 
            NULL AS RequestID,
            'error' AS Status,
            'Error creating booking request: ' + @ErrorMessage AS Message;
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_CreateBookingRequest] created successfully.';
GO
