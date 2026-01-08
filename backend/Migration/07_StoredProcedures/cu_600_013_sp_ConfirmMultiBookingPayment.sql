/*
    Migration Script: Create Stored Procedure [sp_ConfirmMultiBookingPayment]
    Phase: 600 - Stored Procedures
    Script: cu_600_013_dbo.sp_ConfirmMultiBookingPayment.sql
    Description: Creates the [payments].[sp_ConfirmMultiBookingPayment] stored procedure
    
    Execution Order: 13
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [payments].[sp_ConfirmMultiBookingPayment]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_ConfirmMultiBookingPayment]'))
    DROP PROCEDURE [payments].[sp_ConfirmMultiBookingPayment];
GO

CREATE   PROCEDURE [payments].[sp_ConfirmMultiBookingPayment]
    @PaymentIntentID NVARCHAR(100),
    @RequestIDs NVARCHAR(500), -- Comma-separated list of approved request IDs
    @TotalAmount DECIMAL(10, 2)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Parse request IDs
        DECLARE @RequestTable TABLE (RequestID INT);
        INSERT INTO @RequestTable (RequestID)
        SELECT CAST(LTRIM(RTRIM(value)) AS INT)
        FROM STRING_SPLIT(@RequestIDs, ',')
        WHERE LTRIM(RTRIM(value)) != '' AND ISNUMERIC(LTRIM(RTRIM(value))) = 1;
        
        DECLARE @CreatedBookings TABLE (
            BookingID INT,
            VendorProfileID INT,
            UserID INT
        );
        
        -- Create bookings for each approved request
        DECLARE @RequestID INT, @UserID INT, @VendorProfileID INT;
        DECLARE @Services NVARCHAR(MAX), @EventDate DATE, @EventTime TIME, @EventEndTime TIME;
        DECLARE @EventLocation NVARCHAR(500), @AttendeeCount INT, @SpecialRequests NVARCHAR(MAX);
        DECLARE @EventName NVARCHAR(255), @EventType NVARCHAR(100), @TimeZone NVARCHAR(100);
        DECLARE @StartDateTime DATETIME, @EndDateTime DATETIME;
        
        DECLARE request_cursor CURSOR FOR 
        SELECT br.RequestID, br.UserID, br.VendorProfileID, br.Services, 
               br.EventDate, br.EventTime, br.EventEndTime, br.EventLocation, br.AttendeeCount, br.SpecialRequests,
               br.EventName, br.EventType, br.TimeZone
        FROM bookings.BookingRequests br
        JOIN @RequestTable rt ON br.RequestID = rt.RequestID
        WHERE br.Status = 'approved';
        
        OPEN request_cursor;
        FETCH NEXT FROM request_cursor INTO @RequestID, @UserID, @VendorProfileID, @Services, 
                                           @EventDate, @EventTime, @EventEndTime, @EventLocation, @AttendeeCount, @SpecialRequests,
                                           @EventName, @EventType, @TimeZone;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Combine date and time into full datetimes
            SET @StartDateTime = CASE 
                WHEN @EventTime IS NOT NULL THEN CONVERT(DATETIME, CONVERT(VARCHAR(10), @EventDate, 120) + ' ' + CONVERT(VARCHAR(8), @EventTime, 108))
                ELSE CONVERT(DATETIME, @EventDate)
            END;
            SET @EndDateTime = CASE 
                WHEN @EventEndTime IS NOT NULL THEN CONVERT(DATETIME, CONVERT(VARCHAR(10), @EventDate, 120) + ' ' + CONVERT(VARCHAR(8), @EventEndTime, 108))
                ELSE @StartDateTime
            END;
            -- Create booking using existing stored procedure
            DECLARE @BookingResult TABLE (BookingID INT, ConversationID INT);
            
            INSERT INTO @BookingResult
            EXEC bookings.sp_CreateWithServices
                @UserID = @UserID,
                @VendorProfileID = @VendorProfileID,
                @EventDate = @StartDateTime,
                @EndDate = @EndDateTime,
                @AttendeeCount = @AttendeeCount,
                @SpecialRequests = @SpecialRequests,
                @ServicesJSON = @Services,
                @PaymentIntentID = @PaymentIntentID,
                @EventLocation = @EventLocation,
                @EventName = @EventName,
                @EventType = @EventType,
                @TimeZone = @TimeZone;
            
            -- Record the created booking
            INSERT INTO @CreatedBookings (BookingID, VendorProfileID, UserID)
            SELECT BookingID, @VendorProfileID, @UserID FROM @BookingResult;
            
            -- Update request status to confirmed
            UPDATE bookings.BookingRequests 
            SET Status = 'confirmed', 
                ConfirmedAt = GETDATE(),
                PaymentIntentID = @PaymentIntentID
            WHERE RequestID = @RequestID;
            
            FETCH NEXT FROM request_cursor INTO @RequestID, @UserID, @VendorProfileID, @Services, 
                                               @EventDate, @EventTime, @EventLocation, @AttendeeCount, @SpecialRequests;
        END
        
        CLOSE request_cursor;
        DEALLOCATE request_cursor;
        
        -- Return created bookings
        SELECT 
            cb.BookingID,
            cb.VendorProfileID,
            vp.BusinessName,
            cb.UserID
        FROM @CreatedBookings cb
        JOIN vendors.VendorProfiles vp ON cb.VendorProfileID = vp.VendorProfileID;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error confirming multi-booking payment: %s', 16, 1, @ErrorMessage);
    END CATCH
END;

GO

PRINT 'Stored procedure [payments].[sp_ConfirmMultiBookingPayment] created successfully.';
GO


