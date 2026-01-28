/*
    Migration Script: Create Stored Procedure [sp_CreateBookingWithServices]
    Phase: 600 - Stored Procedures
    Script: cu_600_017_dbo.sp_CreateBookingWithServices.sql
    Description: Creates the [bookings].[sp_CreateWithServices] stored procedure
    
    Execution Order: 17
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_CreateWithServices]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CreateWithServices]'))
    DROP PROCEDURE [bookings].[sp_CreateWithServices];
GO

CREATE   PROCEDURE [bookings].[sp_CreateWithServices]
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
    @TimeZone NVARCHAR(100) = NULL,
    @IsInstantBooking BIT = 0,
    @TotalAmount DECIMAL(10, 2) = NULL,
    -- Financial details
    @Subtotal DECIMAL(10, 2) = NULL,
    @PlatformFee DECIMAL(10, 2) = NULL,
    @TaxAmount DECIMAL(10, 2) = NULL,
    @TaxPercent DECIMAL(5, 3) = NULL,
    @TaxLabel NVARCHAR(50) = NULL,
    @ProcessingFee DECIMAL(10, 2) = NULL,
    @GrandTotal DECIMAL(10, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @CalcTotalAmount DECIMAL(10, 2) = 0;
        DECLARE @DepositAmount DECIMAL(10, 2) = 0;
        DECLARE @MaxDepositPercentage DECIMAL(5, 2) = 0;
        DECLARE @BookingStatus NVARCHAR(50) = CASE WHEN @IsInstantBooking = 1 THEN 'confirmed' ELSE 'pending' END;
        
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
        
        -- Calculate totals from services if not provided
        SELECT 
            @CalcTotalAmount = ISNULL(SUM(Price * Quantity), 0),
            @MaxDepositPercentage = ISNULL(MAX(DepositPercentage), 0)
        FROM @Services;
        
        -- Use provided TotalAmount if available, otherwise use calculated
        IF @TotalAmount IS NOT NULL AND @TotalAmount > 0
            SET @CalcTotalAmount = @TotalAmount;
        
        SET @DepositAmount = @CalcTotalAmount * (@MaxDepositPercentage / 100);
        
        -- Create booking
        INSERT INTO bookings.Bookings (
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
            TimeZone,
            FullAmountPaid,
            Subtotal,
            PlatformFee,
            TaxAmount,
            TaxPercent,
            TaxLabel,
            ProcessingFee,
            GrandTotal
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @EventDate,
            @EndDate,
            @BookingStatus,
            @CalcTotalAmount,
            @DepositAmount,
            @AttendeeCount,
            @SpecialRequests,
            @PaymentIntentID,
            @EventLocation,
            @EventName,
            @EventType,
            @TimeZone,
            CASE WHEN @IsInstantBooking = 1 THEN 1 ELSE 0 END,
            @Subtotal,
            @PlatformFee,
            @TaxAmount,
            @TaxPercent,
            @TaxLabel,
            @ProcessingFee,
            @GrandTotal
        );
        
        DECLARE @BookingID INT = SCOPE_IDENTITY();
        
        -- Add booking services
        INSERT INTO bookings.BookingServices (
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
        INSERT INTO bookings.BookingTimeline (
            BookingID,
            Status,
            ChangedBy,
            Notes
        )
        VALUES (
            @BookingID,
            @BookingStatus,
            @UserID,
            CASE WHEN @IsInstantBooking = 1 THEN 'Instant booking confirmed with payment' ELSE 'Booking request created by customer' END
        );
        
        -- Get or create conversation
        DECLARE @ConversationID INT;
        
        -- Check if conversation already exists
        SELECT @ConversationID = ConversationID 
        FROM messages.Conversations 
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
        
        IF @ConversationID IS NULL
        BEGIN
            INSERT INTO messages.Conversations (
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
        END
        ELSE
        BEGIN
            -- Update existing conversation with new booking
            UPDATE messages.Conversations 
            SET BookingID = @BookingID, 
                LastMessageAt = GETDATE()
            WHERE ConversationID = @ConversationID;
        END
        
        -- Create initial message
        INSERT INTO messages.Messages (
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
        INSERT INTO notifications.Notifications (
            UserID,
            Type,
            Title,
            Message,
            RelatedID,
            RelatedType,
            ActionURL
        )
        VALUES (
            (SELECT UserID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID),
            'booking',
            CASE WHEN @IsInstantBooking = 1 THEN 'New Confirmed Booking' ELSE 'New Booking Request' END,
            CASE WHEN @IsInstantBooking = 1 
                THEN 'You have a new confirmed booking (paid) for ' + CONVERT(NVARCHAR(20), @EventDate, 107)
                ELSE 'You have a new booking request for ' + CONVERT(NVARCHAR(20), @EventDate, 107)
            END,
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

PRINT 'Stored procedure [bookings].[sp_CreateWithServices] created successfully.';
GO







