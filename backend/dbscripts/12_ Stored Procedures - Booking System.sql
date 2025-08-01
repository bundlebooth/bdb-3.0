-- Section 12: Stored Procedures - Booking System

-- sp_Booking_Create: Create new booking
CREATE PROCEDURE sp_Booking_Create
    @UserID INT,
    @EventTypeID INT,
    @EventName NVARCHAR(255),
    @EventDescription NVARCHAR(MAX) = NULL,
    @EventDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @GuestCount INT,
    @ProviderDetails NVARCHAR(MAX), -- JSON array of provider IDs and their services/packages
    @PromotionCode NVARCHAR(50) = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @BookingID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @TotalPrice DECIMAL(18, 2) = 0;
GO
    DECLARE @DepositAmount DECIMAL(18, 2) = 0;
GO
    DECLARE @PromotionDiscount DECIMAL(18, 2) = 0;
GO
    DECLARE @PromotionID INT = NULL;
GO
    DECLARE @IsAvailable BIT = 1;
GO
    DECLARE @ErrorMessage NVARCHAR(255) = '';
GO
    -- Validate event date is in the future
    IF @EventDate < CAST(GETDATE() AS DATE)
    BEGIN
        RAISERROR('Event date must be in the future.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Validate time range
    IF @EndTime <= @StartTime
    BEGIN
        RAISERROR('End time must be after start time.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Check promotion code if provided
    IF @PromotionCode IS NOT NULL
    BEGIN
        SELECT 
            @PromotionID = PromotionID,
            @PromotionDiscount = CASE 
                WHEN DiscountType = 'Percentage' THEN @TotalPrice * (DiscountValue / 100)
                ELSE DiscountValue
            END
        FROM Promotions
        WHERE 
            PromotionCode = @PromotionCode
            AND IsActive = 1
            AND StartDate <= GETDATE()
            AND EndDate >= GETDATE()
            AND (MaxUses IS NULL OR CurrentUses < MaxUses);
GO
        IF @PromotionID IS NULL
        BEGIN
            RAISERROR('Invalid or expired promotion code.', 16, 1);
GO
            RETURN;
GO
        END
    END
    
    BEGIN TRANSACTION;
GO
    BEGIN TRY
        -- Parse provider details JSON
        DECLARE @ProviderTable TABLE (
            ProviderID INT,
            ServiceDetails NVARCHAR(MAX),
            PackageID INT,
            Price DECIMAL(18, 2)
        );
GO
        INSERT INTO @ProviderTable (ProviderID, ServiceDetails, PackageID)
        SELECT 
            ProviderID,
            ServiceDetails,
            PackageID
        FROM OPENJSON(@ProviderDetails)
        WITH (
            ProviderID INT '$.ProviderID',
            ServiceDetails NVARCHAR(MAX) '$.ServiceDetails' AS JSON,
            PackageID INT '$.PackageID'
        );
GO
        -- Calculate price and check availability for each provider
        DECLARE @CurrentProviderID INT;
GO
        DECLARE @CurrentServiceDetails NVARCHAR(MAX);
GO
        DECLARE @CurrentPackageID INT;
GO
        DECLARE @CurrentPrice DECIMAL(18, 2);
GO
        DECLARE provider_cursor CURSOR FOR
        SELECT ProviderID, ServiceDetails, PackageID FROM @ProviderTable;
GO
        OPEN provider_cursor;
GO
        FETCH NEXT FROM provider_cursor INTO @CurrentProviderID, @CurrentServiceDetails, @CurrentPackageID;
GO
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Check availability and calculate price
            DECLARE @ProviderAvailable BIT;
GO
            DECLARE @ProviderMessage NVARCHAR(255);
GO
            DECLARE @ProviderBasePrice DECIMAL(18, 2);
GO
            DECLARE @ProviderTotalPrice DECIMAL(18, 2);
GO
            DECLARE @ProviderMultiplier DECIMAL(5, 2);
GO
            DECLARE @ProviderDuration DECIMAL(10, 2);
GO
            EXEC sp_Provider_CalculatePrice
                @ProviderID = @CurrentProviderID,
                @EventDate = @EventDate,
                @StartTime = @StartTime,
                @EndTime = @EndTime,
                @GuestCount = @GuestCount,
                @ServiceIDs = @CurrentServiceDetails,
                @PackageID = @CurrentPackageID,
                @IsAvailable = @ProviderAvailable OUTPUT,
                @Message = @ProviderMessage OUTPUT,
                @BasePrice = @ProviderBasePrice OUTPUT,
                @TotalPrice = @ProviderTotalPrice OUTPUT,
                @PriceMultiplier = @ProviderMultiplier OUTPUT,
                @DurationHours = @ProviderDuration OUTPUT;
GO
            IF @ProviderAvailable = 0
            BEGIN
                SET @IsAvailable = 0;
GO
                SET @ErrorMessage = @ProviderMessage;
GO
                BREAK;
GO
            END
            
            -- Update provider price in temp table
            UPDATE @ProviderTable
            SET Price = @ProviderTotalPrice
            WHERE ProviderID = @CurrentProviderID;
GO
            -- Add to total price
            SET @TotalPrice = @TotalPrice + @ProviderTotalPrice;
GO
            FETCH NEXT FROM provider_cursor INTO @CurrentProviderID, @CurrentServiceDetails, @CurrentPackageID;
GO
        END
        
        CLOSE provider_cursor;
GO
        DEALLOCATE provider_cursor;
GO
        -- If any provider is unavailable, cancel the booking
        IF @IsAvailable = 0
        BEGIN
            RAISERROR(@ErrorMessage, 16, 1);
GO
            RETURN;
GO
        END
        
        -- Apply promotion discount
        IF @PromotionID IS NOT NULL
        BEGIN
            SET @TotalPrice = @TotalPrice - @PromotionDiscount;
GO
            IF @TotalPrice < 0 SET @TotalPrice = 0;
GO
        END
        
        -- Calculate deposit (30% of total price)
        SET @DepositAmount = @TotalPrice * 0.3;
GO
        -- Get default "Pending" status
        DECLARE @StatusID INT;
GO
        SELECT @StatusID = StatusID FROM BookingStatuses WHERE StatusName = 'Pending';
GO
        IF @StatusID IS NULL
        BEGIN
            SET @StatusID = 1; -- Fallback to first status
        END
        
        -- Create booking record
        INSERT INTO Bookings (
            EventTypeID, UserID, EventName, EventDescription, EventDate, 
            StartTime, EndTime, GuestCount, StatusID, TotalPrice, 
            DepositAmount, DepositPaid, BalanceDueDate
        )
        VALUES (
            @EventTypeID, @UserID, @EventName, @EventDescription, @EventDate, 
            @StartTime, @EndTime, @GuestCount, @StatusID, @TotalPrice, 
            @DepositAmount, 0, DATEADD(DAY, 14, GETDATE()) -- Balance due in 14 days
        );
GO
        SET @BookingID = SCOPE_IDENTITY();
GO
        -- Add booking providers
        INSERT INTO BookingProviders (
            BookingID, ProviderID, ProviderTypeID, ServiceDetails, SpecialRequests, 
            StatusID, Price, DepositAmount, DepositPaid, BalanceDueDate
        )
        SELECT 
            @BookingID,
            pt.ProviderID,
            sp.TypeID,
            pt.ServiceDetails,
            @SpecialRequests,
            @StatusID,
            pt.Price,
            pt.Price * 0.3, -- 30% deposit for each provider
            0,
            DATEADD(DAY, 14, GETDATE()) -- Balance due in 14 days
        FROM 
            @ProviderTable pt
            INNER JOIN ServiceProviders sp ON pt.ProviderID = sp.ProviderID;
GO
        -- Add booking timeline events
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES 
            (@BookingID, GETDATE(), 'Booking', 'Booking Created', 'Booking was created and is pending payment.'),
            (@BookingID, DATEADD(DAY, 1, GETDATE()), 'Reminder', 'Deposit Reminder', 'Reminder to pay deposit.'),
            (@BookingID, DATEADD(DAY, 7, GETDATE()), 'Reminder', 'Deposit Due', 'Deposit payment is due.'),
            (@BookingID, DATEADD(DAY, 14, GETDATE()), 'Payment', 'Balance Due', 'Full balance payment is due.'),
            (@BookingID, DATEADD(DAY, -7, @EventDate), 'Reminder', 'Upcoming Event', 'Event is coming up in 7 days.'),
            (@BookingID, DATEADD(DAY, -1, @EventDate), 'Reminder', 'Event Tomorrow', 'Event is happening tomorrow.'),
            (@BookingID, @EventDate, 'Event', 'Event Day', 'Event is happening today.');
GO
        -- Record promotion redemption if applicable
        IF @PromotionID IS NOT NULL
        BEGIN
            INSERT INTO PromotionRedemptions (
                PromotionID, BookingID, UserID, DiscountAmount
            )
            VALUES (
                @PromotionID, @BookingID, @UserID, @PromotionDiscount
            );
GO
            -- Increment promotion uses
            UPDATE Promotions
            SET CurrentUses = CurrentUses + 1
            WHERE PromotionID = @PromotionID;
GO
        END
        
        COMMIT TRANSACTION;
GO
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
GO
        THROW;
GO
    END CATCH
END;
GO

-- sp_Booking_UpdateStatus: Change booking status
CREATE PROCEDURE sp_Booking_UpdateStatus
    @BookingID INT,
    @StatusName NVARCHAR(50),
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @StatusID INT;
GO
    DECLARE @OldStatus NVARCHAR(50);
GO
    DECLARE @UserID INT;
GO
    DECLARE @EventDate DATE;
GO
    -- Get new status ID
    SELECT @StatusID = StatusID 
    FROM BookingStatuses 
    WHERE StatusName = @StatusName;
GO
    IF @StatusID IS NULL
    BEGIN
        RAISERROR('Invalid status name.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Get current status and user ID
    SELECT 
        @OldStatus = bs.StatusName,
        @UserID = b.UserID,
        @EventDate = b.EventDate
    FROM 
        Bookings b
        INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
    WHERE 
        b.BookingID = @BookingID;
GO
    IF @UserID IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Update booking status
    UPDATE Bookings
    SET 
        StatusID = @StatusID,
        LastUpdated = GETDATE()
    WHERE 
        BookingID = @BookingID;
GO
    -- Update all booking providers to same status
    UPDATE BookingProviders
    SET 
        StatusID = @StatusID,
        ModifiedDate = GETDATE()
    WHERE 
        BookingID = @BookingID;
GO
    -- Add timeline event for status change
    INSERT INTO BookingTimeline (
        BookingID, EventDate, EventType, Title, Description
    )
    VALUES (
        @BookingID, GETDATE(), 'StatusChange', 
        'Status Changed', 
        'Booking status changed from ' + @OldStatus + ' to ' + @StatusName + 
        CASE WHEN @Notes IS NOT NULL THEN '. Notes: ' + @Notes ELSE '' END
    );
GO
    -- If booking is confirmed, send deposit reminders
    IF @StatusName = 'Confirmed'
    BEGIN
        -- Add deposit due timeline events
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES 
            (@BookingID, DATEADD(DAY, 1, GETDATE()), 'Reminder', 'Deposit Reminder', 'Reminder to pay deposit.'),
            (@BookingID, DATEADD(DAY, 7, GETDATE()), 'Reminder', 'Deposit Due', 'Deposit payment is due.');
GO
    END
    
    -- If booking is completed, create review reminders
    IF @StatusName = 'Completed'
    BEGIN
        -- Add review reminder timeline events
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES 
            (@BookingID, DATEADD(DAY, 1, GETDATE()), 'Reminder', 'Leave a Review', 'Please leave a review for your providers.'),
            (@BookingID, DATEADD(DAY, 7, GETDATE()), 'Reminder', 'Review Reminder', 'Reminder to leave a review for your providers.');
GO
    END
END;
GO

-- sp_Booking_GetByUser: List user's bookings
CREATE PROCEDURE sp_Booking_GetByUser
    @UserID INT,
    @StatusFilter NVARCHAR(50) = NULL,
    @UpcomingOnly BIT = 0,
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
GO
    -- Get total count
    DECLARE @TotalCount INT;
GO
    SELECT @TotalCount = COUNT(*)
    FROM Bookings b
    WHERE b.UserID = @UserID
    AND (@StatusFilter IS NULL OR EXISTS (
        SELECT 1 FROM BookingStatuses bs 
        WHERE bs.StatusID = b.StatusID AND bs.StatusName = @StatusFilter
    ))
    AND (@UpcomingOnly = 0 OR b.EventDate >= GETDATE());
GO
    -- Get paginated bookings
    SELECT 
        b.BookingID,
        b.EventName,
        b.EventDate,
        b.StartTime,
        b.EndTime,
        b.GuestCount,
        b.TotalPrice,
        b.DepositAmount,
        b.DepositPaid,
        b.BalanceDueDate,
        bs.StatusName AS BookingStatus,
        et.TypeName AS EventType,
        DATEDIFF(DAY, GETDATE(), b.EventDate) AS DaysUntilEvent,
        (SELECT COUNT(*) FROM BookingProviders bp WHERE bp.BookingID = b.BookingID) AS ProviderCount,
        (SELECT STRING_AGG(sp.BusinessName, ', ') 
         FROM BookingProviders bp 
         INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
         WHERE bp.BookingID = b.BookingID) AS ProviderNames,
        @TotalCount AS TotalCount
    FROM 
        Bookings b
        INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
        INNER JOIN EventTypes et ON b.EventTypeID = et.EventTypeID
    WHERE 
        b.UserID = @UserID
        AND (@StatusFilter IS NULL OR bs.StatusName = @StatusFilter)
        AND (@UpcomingOnly = 0 OR b.EventDate >= GETDATE())
    ORDER BY 
        b.EventDate
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
GO
END;
GO

-- sp_Booking_CheckAvailability: Verify date availability
CREATE PROCEDURE sp_Booking_CheckAvailability
    @ProviderIDs NVARCHAR(MAX), -- JSON array of provider IDs
    @EventDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @GuestCount INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
GO
    -- Parse provider IDs from JSON
    DECLARE @ProviderTable TABLE (ProviderID INT);
GO
    INSERT INTO @ProviderTable (ProviderID)
    SELECT value FROM OPENJSON(@ProviderIDs);
GO
    -- Check availability for each provider
    SELECT 
        sp.ProviderID,
        sp.BusinessName,
        pt.TypeName AS ProviderType,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM ProviderBlackoutDates bd 
                WHERE bd.ProviderID = sp.ProviderID 
                AND @EventDate BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM Bookings b 
                INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
                WHERE bp.ProviderID = sp.ProviderID 
                AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
                AND b.EventDate = @EventDate
                AND (
                    (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
                    (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
                    (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
                )
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM ProviderAvailability pa 
                WHERE pa.ProviderID = sp.ProviderID 
                AND pa.DayOfWeek = DATEPART(WEEKDAY, @EventDate)
                AND pa.IsAvailable = 1
                AND @StartTime >= pa.StartTime 
                AND @EndTime <= pa.EndTime
            ) THEN 1
            ELSE 0
        END AS IsAvailable,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM ProviderBlackoutDates bd 
                WHERE bd.ProviderID = sp.ProviderID 
                AND @EventDate BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 'Provider is not available on this date (blackout).'
            WHEN EXISTS (
                SELECT 1 FROM Bookings b 
                INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
                WHERE bp.ProviderID = sp.ProviderID 
                AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
                AND b.EventDate = @EventDate
                AND (
                    (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
                    (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
                    (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
                )
            ) THEN 'Provider is already booked at the requested time.'
            WHEN NOT EXISTS (
                SELECT 1 FROM ProviderAvailability pa 
                WHERE pa.ProviderID = sp.ProviderID 
                AND pa.DayOfWeek = DATEPART(WEEKDAY, @EventDate)
                AND pa.IsAvailable = 1
                AND @StartTime >= pa.StartTime 
                AND @EndTime <= pa.EndTime
            ) THEN 'Provider is not available at the requested time.'
            WHEN @GuestCount IS NOT NULL AND sp.MinEventSize IS NOT NULL AND @GuestCount < sp.MinEventSize THEN 
                'Guest count is below provider minimum of ' + CAST(sp.MinEventSize AS NVARCHAR(10))
            WHEN @GuestCount IS NOT NULL AND sp.MaxEventSize IS NOT NULL AND @GuestCount > sp.MaxEventSize THEN 
                'Guest count exceeds provider maximum of ' + CAST(sp.MaxEventSize AS NVARCHAR(10))
            ELSE 'Available'
        END AS AvailabilityMessage
    FROM 
        ServiceProviders sp
        INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
        INNER JOIN @ProviderTable ptbl ON sp.ProviderID = ptbl.ProviderID
    WHERE 
        sp.IsActive = 1;
GO
END;
GO

-- sp_Booking_Cancel: Handle cancellations
CREATE PROCEDURE sp_Booking_Cancel
    @BookingID INT,
    @CancellationReason NVARCHAR(MAX) = NULL,
    @RefundAmount DECIMAL(18, 2) = NULL,
    @ProcessRefund BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @UserID INT;
GO
    DECLARE @CurrentStatus NVARCHAR(50);
GO
    DECLARE @TotalPaid DECIMAL(18, 2) = 0;
GO
    DECLARE @CancellationFee DECIMAL(18, 2) = 0;
GO
    -- Get booking details
    SELECT 
        @UserID = b.UserID,
        @CurrentStatus = bs.StatusName,
        @TotalPaid = ISNULL((SELECT SUM(Amount) FROM Payments p WHERE p.BookingID = b.BookingID AND p.Status = 'Completed'), 0)
    FROM 
        Bookings b
        INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
    WHERE 
        b.BookingID = @BookingID;
GO
    IF @UserID IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Check if booking is already cancelled
    IF @CurrentStatus = 'Cancelled'
    BEGIN
        RAISERROR('Booking is already cancelled.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Calculate cancellation fee if not specified
    IF @RefundAmount IS NULL
    BEGIN
        -- Default policy: 
        -- - Full refund if cancelled more than 30 days before event
        -- - 50% refund if cancelled 7-30 days before event
        -- - No refund if cancelled less than 7 days before event
        DECLARE @EventDate DATE;
GO
        DECLARE @DaysUntilEvent INT;
GO
        SELECT @EventDate = EventDate FROM Bookings WHERE BookingID = @BookingID;
GO
        SET @DaysUntilEvent = DATEDIFF(DAY, GETDATE(), @EventDate);
GO
        IF @DaysUntilEvent > 30
        BEGIN
            SET @RefundAmount = @TotalPaid;
GO
            SET @CancellationFee = 0;
GO
        END
        ELSE IF @DaysUntilEvent > 7
        BEGIN
            SET @RefundAmount = @TotalPaid * 0.5;
GO
            SET @CancellationFee = @TotalPaid * 0.5;
GO
        END
        ELSE
        BEGIN
            SET @RefundAmount = 0;
GO
            SET @CancellationFee = @TotalPaid;
GO
        END
    END
    ELSE
    BEGIN
        SET @CancellationFee = @TotalPaid - @RefundAmount;
GO
    END
    
    BEGIN TRANSACTION;
GO
    BEGIN TRY
        -- Update booking status to Cancelled
        DECLARE @CancelledStatusID INT;
GO
        SELECT @CancelledStatusID = StatusID FROM BookingStatuses WHERE StatusName = 'Cancelled';
GO
        UPDATE Bookings
        SET 
            StatusID = @CancelledStatusID,
            LastUpdated = GETDATE()
        WHERE 
            BookingID = @BookingID;
GO
        -- Update all booking providers to Cancelled status
        UPDATE BookingProviders
        SET 
            StatusID = @CancelledStatusID,
            ModifiedDate = GETDATE()
        WHERE 
            BookingID = @BookingID;
GO
        -- Add timeline event for cancellation
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES (
            @BookingID, GETDATE(), 'Cancellation', 
            'Booking Cancelled', 
            'Booking was cancelled. ' + 
            CASE WHEN @CancellationReason IS NOT NULL THEN 'Reason: ' + @CancellationReason ELSE '' END + 
            CASE WHEN @RefundAmount > 0 THEN ' Refund amount: ' + FORMAT(@RefundAmount, 'C') ELSE '' END
        );
GO
        -- Process refund if requested and applicable
        IF @ProcessRefund = 1 AND @RefundAmount > 0
        BEGIN
            -- Record refund payment
            INSERT INTO Payments (
                BookingID, UserID, Amount, PaymentDate, MethodID, 
                Status, FeeAmount, NetAmount, Notes
            )
            SELECT 
                @BookingID,
                @UserID,
                -@RefundAmount, -- Negative amount for refund
                GETDATE(),
                p.MethodID,
                'Completed',
                0, -- No fee for refunds
                -@RefundAmount,
                'Refund for cancelled booking #' + CAST(@BookingID AS NVARCHAR(10))
            FROM Payments p
            WHERE p.BookingID = @BookingID
            AND p.Status = 'Completed'
            ORDER BY p.PaymentDate DESC
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
GO
            -- Update booking to mark deposit as refunded
            UPDATE Bookings
            SET DepositPaid = 0
            WHERE BookingID = @BookingID;
GO
            -- Add timeline event for refund
            INSERT INTO BookingTimeline (
                BookingID, EventDate, EventType, Title, Description
            )
            VALUES (
                @BookingID, GETDATE(), 'Refund', 
                'Refund Processed', 
                'Refund of ' + FORMAT(@RefundAmount, 'C') + ' was processed for cancelled booking.'
            );
GO
        END
        
        -- Record cancellation fee
        IF @CancellationFee > 0
        BEGIN
            -- Add timeline event for cancellation fee
            INSERT INTO BookingTimeline (
                BookingID, EventDate, EventType, Title, Description
            )
            VALUES (
                @BookingID, GETDATE(), 'Fee', 
                'Cancellation Fee Applied', 
                'Cancellation fee of ' + FORMAT(@CancellationFee, 'C') + ' was applied.'
            );
GO
        END
        
        COMMIT TRANSACTION;
GO
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
GO
        THROW;
GO
    END CATCH
END;
GO

-- sp_Booking_AddMultipleProviders: Handle multi-service bookings
CREATE PROCEDURE sp_Booking_AddMultipleProviders
    @BookingID INT,
    @ProviderDetails NVARCHAR(MAX), -- JSON array of provider IDs and their services/packages
    @SpecialRequests NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @EventDate DATE;
GO
    DECLARE @StartTime TIME;
GO
    DECLARE @EndTime TIME;
GO
    DECLARE @GuestCount INT;
GO
    DECLARE @IsAvailable BIT = 1;
GO
    DECLARE @ErrorMessage NVARCHAR(255) = '';
GO
    -- Get booking details
    SELECT 
        @EventDate = EventDate,
        @StartTime = StartTime,
        @EndTime = EndTime,
        @GuestCount = GuestCount
    FROM Bookings
    WHERE BookingID = @BookingID;
GO
    IF @EventDate IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Parse provider details JSON
    DECLARE @ProviderTable TABLE (
        ProviderID INT,
        ServiceDetails NVARCHAR(MAX),
        PackageID INT,
        Price DECIMAL(18, 2)
    );
GO
    INSERT INTO @ProviderTable (ProviderID, ServiceDetails, PackageID)
    SELECT 
        ProviderID,
        ServiceDetails,
        PackageID
    FROM OPENJSON(@ProviderDetails)
    WITH (
        ProviderID INT '$.ProviderID',
        ServiceDetails NVARCHAR(MAX) '$.ServiceDetails' AS JSON,
        PackageID INT '$.PackageID'
    );
GO
    -- Check availability and calculate price for each new provider
    DECLARE @CurrentProviderID INT;
GO
    DECLARE @CurrentServiceDetails NVARCHAR(MAX);
GO
    DECLARE @CurrentPackageID INT;
GO
    DECLARE @CurrentPrice DECIMAL(18, 2);
GO
    DECLARE provider_cursor CURSOR FOR
    SELECT ProviderID, ServiceDetails, PackageID FROM @ProviderTable;
GO
    OPEN provider_cursor;
GO
    FETCH NEXT FROM provider_cursor INTO @CurrentProviderID, @CurrentServiceDetails, @CurrentPackageID;
GO
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Check if provider is already part of this booking
        IF EXISTS (SELECT 1 FROM BookingProviders WHERE BookingID = @BookingID AND ProviderID = @CurrentProviderID)
        BEGIN
            SET @IsAvailable = 0;
GO
            SET @ErrorMessage = 'Provider is already part of this booking.';
GO
            BREAK;
GO
        END
        
        -- Check availability and calculate price
        DECLARE @ProviderAvailable BIT;
GO
        DECLARE @ProviderMessage NVARCHAR(255);
GO
        DECLARE @ProviderBasePrice DECIMAL(18, 2);
GO
        DECLARE @ProviderTotalPrice DECIMAL(18, 2);
GO
        DECLARE @ProviderMultiplier DECIMAL(5, 2);
GO
        DECLARE @ProviderDuration DECIMAL(10, 2);
GO
        EXEC sp_Provider_CalculatePrice
            @ProviderID = @CurrentProviderID,
            @EventDate = @EventDate,
            @StartTime = @StartTime,
            @EndTime = @EndTime,
            @GuestCount = @GuestCount,
            @ServiceIDs = @CurrentServiceDetails,
            @PackageID = @CurrentPackageID,
            @IsAvailable = @ProviderAvailable OUTPUT,
            @Message = @ProviderMessage OUTPUT,
            @BasePrice = @ProviderBasePrice OUTPUT,
            @TotalPrice = @ProviderTotalPrice OUTPUT,
            @PriceMultiplier = @ProviderMultiplier OUTPUT,
            @DurationHours = @ProviderDuration OUTPUT;
GO
        IF @ProviderAvailable = 0
        BEGIN
            SET @IsAvailable = 0;
GO
            SET @ErrorMessage = @ProviderMessage;
GO
            BREAK;
GO
        END
        
        -- Update provider price in temp table
        UPDATE @ProviderTable
        SET Price = @ProviderTotalPrice
        WHERE ProviderID = @CurrentProviderID;
GO
        FETCH NEXT FROM provider_cursor INTO @CurrentProviderID, @CurrentServiceDetails, @CurrentPackageID;
GO
    END
    
    CLOSE provider_cursor;
GO
    DEALLOCATE provider_cursor;
GO
    -- If any provider is unavailable, cancel the operation
    IF @IsAvailable = 0
    BEGIN
        RAISERROR(@ErrorMessage, 16, 1);
GO
        RETURN;
GO
    END
    
    BEGIN TRANSACTION;
GO
    BEGIN TRY
        -- Get booking status
        DECLARE @StatusID INT;
GO
        SELECT @StatusID = StatusID 
        FROM Bookings 
        WHERE BookingID = @BookingID;
GO
        -- Add new booking providers
        INSERT INTO BookingProviders (
            BookingID, ProviderID, ProviderTypeID, ServiceDetails, SpecialRequests, 
            StatusID, Price, DepositAmount, DepositPaid, BalanceDueDate
        )
        SELECT 
            @BookingID,
            pt.ProviderID,
            sp.TypeID,
            pt.ServiceDetails,
            @SpecialRequests,
            @StatusID,
            pt.Price,
            pt.Price * 0.3, -- 30% deposit for each provider
            0,
            DATEADD(DAY, 14, GETDATE()) -- Balance due in 14 days
        FROM 
            @ProviderTable pt
            INNER JOIN ServiceProviders sp ON pt.ProviderID = sp.ProviderID;
GO
        -- Update booking total price
        DECLARE @AdditionalCost DECIMAL(18, 2);
GO
        SELECT @AdditionalCost = SUM(Price) 
        FROM @ProviderTable;
GO
        UPDATE Bookings
        SET 
            TotalPrice = TotalPrice + @AdditionalCost,
            DepositAmount = DepositAmount + (@AdditionalCost * 0.3),
            LastUpdated = GETDATE()
        WHERE 
            BookingID = @BookingID;
GO
        -- Add timeline event for added providers
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES (
            @BookingID, GETDATE(), 'Update', 
            'Additional Providers Added', 
            'Added ' + CAST((SELECT COUNT(*) FROM @ProviderTable) AS NVARCHAR(10)) + 
            ' providers to the booking. Additional cost: ' + FORMAT(@AdditionalCost, 'C')
        );
GO
        COMMIT TRANSACTION;
GO
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
GO
        THROW;
GO
    END CATCH
END;
GO

