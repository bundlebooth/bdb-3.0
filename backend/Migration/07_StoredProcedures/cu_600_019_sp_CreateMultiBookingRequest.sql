/*
    Migration Script: Create Stored Procedure [sp_CreateMultiBookingRequest]
    Phase: 600 - Stored Procedures
    Script: cu_600_019_dbo.sp_CreateMultiBookingRequest.sql
    Description: Creates the [dbo].[sp_CreateMultiBookingRequest] stored procedure
    
    Execution Order: 19
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_CreateMultiBookingRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateMultiBookingRequest]'))
    DROP PROCEDURE [dbo].[sp_CreateMultiBookingRequest];
GO

CREATE   PROCEDURE [dbo].[sp_CreateMultiBookingRequest]
    @UserID INT,
    @VendorIds NVARCHAR(500), -- Comma-separated list of vendor IDs
    @Services NVARCHAR(MAX), -- JSON string of services per vendor
    @EventDate DATE,
    @EventTime TIME,
    @EventLocation NVARCHAR(500),
    @AttendeeCount INT,
    @TotalBudget DECIMAL(10, 2),
    @SpecialRequests NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @RequestResults TABLE (
            RequestID INT,
            VendorProfileID INT,
            Status NVARCHAR(50),
            CreatedAt DATETIME,
            ExpiresAt DATETIME
        );
        
        -- Parse vendor IDs
        DECLARE @VendorTable TABLE (VendorProfileID INT);
        INSERT INTO @VendorTable (VendorProfileID)
        SELECT CAST(LTRIM(RTRIM(value)) AS INT)
        FROM STRING_SPLIT(@VendorIds, ',')
        WHERE LTRIM(RTRIM(value)) != '' AND ISNUMERIC(LTRIM(RTRIM(value))) = 1;
        
        -- Set expiry to 24 hours from now
        DECLARE @ExpiresAt DATETIME = DATEADD(HOUR, 24, GETDATE());
        
        -- Create individual requests for each vendor
        DECLARE @VendorID INT;
        DECLARE vendor_cursor CURSOR FOR SELECT VendorProfileID FROM @VendorTable;
        
        OPEN vendor_cursor;
        FETCH NEXT FROM vendor_cursor INTO @VendorID;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Insert booking request
            INSERT INTO BookingRequests (
                UserID, VendorProfileID, Services, EventDate, EventTime, 
                EventLocation, AttendeeCount, Budget, SpecialRequests, 
                Status, ExpiresAt, CreatedAt
            )
            OUTPUT INSERTED.RequestID, INSERTED.VendorProfileID, INSERTED.Status, 
                   INSERTED.CreatedAt, INSERTED.ExpiresAt
            INTO @RequestResults
            VALUES (
                @UserID, @VendorID, @Services, @EventDate, @EventTime,
                @EventLocation, @AttendeeCount, @TotalBudget, @SpecialRequests,
                'pending', @ExpiresAt, GETDATE()
            );
            
            -- Create conversation for this vendor-user pair
            DECLARE @ConversationID INT;
            EXEC sp_CreateConversation 
                @UserID = @UserID,
                @VendorProfileID = @VendorID,
                @ConversationID = @ConversationID OUTPUT;
            
            -- Send initial message to vendor
            IF @ConversationID IS NOT NULL
            BEGIN
                DECLARE @InitialMessage NVARCHAR(MAX) = 
                    'New booking request received for ' + CONVERT(NVARCHAR(10), @EventDate, 101) + 
                    ' at ' + CONVERT(NVARCHAR(8), @EventTime, 108) + 
                    '. Please review and respond within 24 hours.';
                
                EXEC sp_SendMessage
                    @ConversationID = @ConversationID,
                    @SenderID = @UserID,
                    @MessageText = @InitialMessage,
                    @MessageType = 'booking_request';
            END
            
            FETCH NEXT FROM vendor_cursor INTO @VendorID;
        END
        
        CLOSE vendor_cursor;
        DEALLOCATE vendor_cursor;
        
        -- Return results
        SELECT 
            RequestID,
            VendorProfileID,
            Status,
            CreatedAt,
            ExpiresAt
        FROM @RequestResults;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error creating multi-booking request: %s', 16, 1, @ErrorMessage);
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_CreateMultiBookingRequest] created successfully.';
GO
