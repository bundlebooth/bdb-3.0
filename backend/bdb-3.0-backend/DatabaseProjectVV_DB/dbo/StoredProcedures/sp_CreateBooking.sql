
-- Create booking procedure (single service)
CREATE   PROCEDURE sp_CreateBooking
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
        FROM Services s
        JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
        WHERE s.ServiceID = @ServiceID;
        
        -- Calculate amounts
        SET @TotalAmount = @ServicePrice;
        SET @DepositAmount = @TotalAmount * (@DepositPercentage / 100);
        
        -- Create booking
        INSERT INTO Bookings (
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
        INSERT INTO BookingServices (
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
            'I have booked your service for ' + CONVERT(NVARCHAR(20), @EventDate, 107) + '. ' + 
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

