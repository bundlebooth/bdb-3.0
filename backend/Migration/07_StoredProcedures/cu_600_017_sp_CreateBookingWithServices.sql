/*
    Migration Script: Create Stored Procedure [sp_CreateBookingWithServices]
    Phase: 600 - Stored Procedures
    Script: cu_600_017_dbo.sp_CreateBookingWithServices.sql
    Description: Creates the [dbo].[sp_CreateBookingWithServices] stored procedure
    
    Execution Order: 17
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_CreateBookingWithServices]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateBookingWithServices]'))
    DROP PROCEDURE [dbo].[sp_CreateBookingWithServices];
GO

CREATE   PROCEDURE [dbo].[sp_CreateBookingWithServices]
    @UserID INT,
    @VendorProfileID INT,
    @EventDate DATETIME,
    @EndDate DATETIME,
    @AttendeeCount INT = 1,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @PaymentIntentID NVARCHAR(100) = NULL,
    @ServicesJSON NVARCHAR(MAX),
    @EventLocation NVARCHAR(500) = NULL,
    @EventName NVARCHAR(255) = NULL,
    @EventType NVARCHAR(100) = NULL,
    @TimeZone NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @TotalAmount DECIMAL(10, 2) = 0;
        DECLARE @DepositAmount DECIMAL(10, 2) = 0;
        DECLARE @MaxDepositPercentage DECIMAL(5, 2) = 0;
        
        -- Parse services JSON
        DECLARE @Services TABLE (
            ServiceID INT,
            AddOnID INT NULL,
            Quantity INT,
            Price DECIMAL(10, 2),
            DepositPercentage DECIMAL(5, 2)
        );
        
        INSERT INTO @Services
        SELECT 
            ServiceID,
            AddOnID,
            Quantity,
            Price,
            DepositPercentage
        FROM OPENJSON(@ServicesJSON)
        WITH (
            ServiceID INT '$.serviceId',
            AddOnID INT '$.addOnId',
            Quantity INT '$.quantity',
            Price DECIMAL(10, 2) '$.price',
            DepositPercentage DECIMAL(5, 2) '$.depositPercentage'
        );
        
        -- Calculate totals
        SELECT 
            @TotalAmount = SUM(Price * Quantity),
            @MaxDepositPercentage = MAX(DepositPercentage)
        FROM @Services;
        
        SET @DepositAmount = @TotalAmount * (@MaxDepositPercentage / 100);
        
        -- Create booking
        INSERT INTO Bookings (
            UserID,
            VendorProfileID,
            EventDate,
            EndDate,
            Status,
            TotalAmount,
            DepositAmount,
            AttendeeCount,
            SpecialRequests,
            StripePaymentIntentID,
            EventLocation,
            EventName,
            EventType,
            TimeZone
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @EventDate,
            @EndDate,
            'pending',
            @TotalAmount,
            @DepositAmount,
            @AttendeeCount,
            @SpecialRequests,
            @PaymentIntentID,
            @EventLocation,
            @EventName,
            @EventType,
            @TimeZone
        );
        
        DECLARE @BookingID INT = SCOPE_IDENTITY();
        
        -- Add booking services
        INSERT INTO BookingServices (
            BookingID,
            ServiceID,
            AddOnID,
            Quantity,
            PriceAtBooking,
            Notes
        )
        SELECT 
            @BookingID,
            ServiceID,
            AddOnID,
            Quantity,
            Price,
            'Booked via website'
        FROM @Services;
        
        -- Create booking timeline entry
        INSERT INTO BookingTimeline (
            BookingID,
            Status,
            ChangedBy,
            Notes
        )
        VALUES (
            @BookingID,
            'pending',
            @UserID,
            'Booking created by customer'
        );
        
        -- Create conversation
        DECLARE @ConversationID INT;
        
        INSERT INTO Conversations (
            UserID,
            VendorProfileID,
            BookingID,
            Subject,
            LastMessageAt
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            'Booking #' + CAST(@BookingID AS NVARCHAR(10)),
            GETDATE()
        );
        
        SET @ConversationID = SCOPE_IDENTITY();
        
        -- Create initial message
        INSERT INTO Messages (
            ConversationID,
            SenderID,
            Content
        )
        VALUES (
            @ConversationID,
            @UserID,
            'I have booked services for ' + CONVERT(NVARCHAR(20), @EventDate, 107) + '. ' + 
            ISNULL(@SpecialRequests, 'No special requests.')
        );
        
        -- Create notification for vendor
        INSERT INTO Notifications (
            UserID,
            Type,
            Title,
            Message,
            RelatedID,
            RelatedType,
            ActionURL
        )
        VALUES (
            (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
            'booking',
            'New Booking Request',
            'You have a new booking request for ' + CONVERT(NVARCHAR(20), @EventDate, 107),
            @BookingID,
            'booking',
            '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
        );
        
        COMMIT TRANSACTION;
        
        SELECT @BookingID AS BookingID, @ConversationID AS ConversationID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_CreateBookingWithServices] created successfully.';
GO
