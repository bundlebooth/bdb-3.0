/*
    Migration Script: Create Stored Procedure [sp_CreateBooking]
    Phase: 600 - Stored Procedures
    Script: cu_600_014_dbo.sp_CreateBooking.sql
    Description: Creates the [bookings].[sp_CreateBooking] stored procedure
    
    Execution Order: 14
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_CreateBooking]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CreateBooking]'))
    DROP PROCEDURE [bookings].[sp_CreateBooking];
GO

CREATE   PROCEDURE [bookings].[sp_CreateBooking]
    @UserID INT,
    @ServiceID INT,
    @EventDate DATETIME,
    @EndDate DATETIME,
    @AttendeeCount INT = 1,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @PaymentIntentID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @VendorProfileID INT;
        DECLARE @ServicePrice DECIMAL(10, 2);
        DECLARE @DepositPercentage DECIMAL(5, 2);
        DECLARE @DepositAmount DECIMAL(10, 2);
        DECLARE @TotalAmount DECIMAL(10, 2);
        
        -- Get service details
        SELECT 
            @VendorProfileID = sc.VendorProfileID,
            @ServicePrice = s.Price,
            @DepositPercentage = s.DepositPercentage
        FROM vendors.Services s
        JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID
        WHERE s.ServiceID = @ServiceID;
        
        -- Calculate amounts
        SET @TotalAmount = @ServicePrice;
        SET @DepositAmount = @TotalAmount * (@DepositPercentage / 100);
        
        -- Create booking
        INSERT INTO bookings.Bookings (
            UserID,
            VendorProfileID,
            ServiceID,
            EventDate,
            EndDate,
            Status,
            TotalAmount,
            DepositAmount,
            AttendeeCount,
            SpecialRequests,
            StripePaymentIntentID
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @ServiceID,
            @EventDate,
            @EndDate,
            'pending',
            @TotalAmount,
            @DepositAmount,
            @AttendeeCount,
            @SpecialRequests,
            @PaymentIntentID
        );
        
        DECLARE @BookingID INT = SCOPE_IDENTITY();
        
        -- Add booking service
        INSERT INTO bookings.BookingServices (
            BookingID,
            ServiceID,
            PriceAtBooking
        )
        VALUES (
            @BookingID,
            @ServiceID,
            @ServicePrice
        );
        
        -- Create booking timeline entry
        INSERT INTO bookings.BookingTimeline (
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
        
        -- Create initial message
        INSERT INTO messages.Messages (
            ConversationID,
            SenderID,
            Content
        )
        VALUES (
            @ConversationID,
            @UserID,
            'I have booked your service for ' + CONVERT(NVARCHAR(20), @EventDate, 107) + '. ' + 
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

PRINT 'Stored procedure [bookings].[sp_CreateBooking] created successfully.';
GO







