-- Section 13: Stored Procedures - Financial

-- sp_Payment_Process: Handle payment transactions
CREATE PROCEDURE sp_Payment_Process
    @BookingID INT,
    @UserID INT,
    @Amount DECIMAL(18, 2),
    @MethodID INT,
    @TransactionID NVARCHAR(255) = NULL,
    @Status NVARCHAR(20) = 'Pending',
    @Notes NVARCHAR(MAX) = NULL,
    @PaymentID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @BookingStatus NVARCHAR(50);
    DECLARE @TotalPrice DECIMAL(18, 2);
    DECLARE @TotalPaid DECIMAL(18, 2);
    DECLARE @DepositAmount DECIMAL(18, 2);
    DECLARE @DepositPaid BIT;
    DECLARE @BalanceDueDate DATE;
    DECLARE @FeeAmount DECIMAL(18, 2) = 0;
    DECLARE @NetAmount DECIMAL(18, 2) = @Amount;

    -- Get booking details if provided
    IF @BookingID IS NOT NULL
    BEGIN
        SELECT 
            @BookingStatus = bs.StatusName,
            @TotalPrice = b.TotalPrice,
            @DepositAmount = b.DepositAmount,
            @DepositPaid = b.DepositPaid,
            @BalanceDueDate = b.BalanceDueDate
        FROM 
            Bookings b
            INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
        WHERE 
            b.BookingID = @BookingID;

        IF @BookingStatus IS NULL
        BEGIN
            RAISERROR('Booking not found.', 16, 1);
            RETURN;
        END
        
        -- Calculate total paid so far
        SELECT @TotalPaid = ISNULL(SUM(Amount), 0)
        FROM Payments
        WHERE BookingID = @BookingID AND Status = 'Completed';

        -- Check if payment exceeds remaining balance
        IF @Amount > (@TotalPrice - @TotalPaid)
        BEGIN
            RAISERROR('Payment amount exceeds remaining balance.', 16, 1);
            RETURN;
        END
        
        -- Calculate processing fee if method has one
        SELECT @FeeAmount = @Amount * (ProcessingFeePercent / 100)
        FROM PaymentMethods
        WHERE MethodID = @MethodID;

        SET @NetAmount = @Amount - @FeeAmount;
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Insert payment record
        INSERT INTO Payments (
            BookingID, UserID, ProviderID, Amount, PaymentDate, 
            MethodID, TransactionID, Status, FeeAmount, NetAmount, Notes
        )
        SELECT 
            @BookingID,
            @UserID,
            NULL, -- ProviderID will be set for payouts
            @Amount,
            GETDATE(),
            @MethodID,
            @TransactionID,
            @Status,
            @FeeAmount,
            @NetAmount,
            @Notes;

        SET @PaymentID = SCOPE_IDENTITY();

        -- If payment is for a booking and status is Completed, update booking
        IF @BookingID IS NOT NULL AND @Status = 'Completed'
        BEGIN
            -- Update total paid amount
            SET @TotalPaid = @TotalPaid + @Amount;

            -- Check if deposit is now paid
            DECLARE @NewDepositPaid BIT = @DepositPaid;
            IF @DepositPaid = 0 AND @TotalPaid >= @DepositAmount
            BEGIN
                SET @NewDepositPaid = 1;

                -- Add timeline event for deposit paid
                INSERT INTO BookingTimeline (
                    BookingID, EventDate, EventType, Title, Description
                )
                VALUES (
                    @BookingID, GETDATE(), 'Payment', 
                    'Deposit Paid', 
                    'Deposit of ' + FORMAT(@DepositAmount, 'C') + ' has been paid.'
                );
            END
            
            -- Check if booking is now fully paid
            DECLARE @NewStatusID INT;
            IF @TotalPaid >= @TotalPrice
            BEGIN
                -- Booking is fully paid
                SELECT @NewStatusID = StatusID FROM BookingStatuses WHERE StatusName = 'Confirmed';

                -- Add timeline event for full payment
                INSERT INTO BookingTimeline (
                    BookingID, EventDate, EventType, Title, Description
                )
                VALUES (
                    @BookingID, GETDATE(), 'Payment', 
                    'Fully Paid', 
                    'Booking has been fully paid. Thank you!'
                );
            END
            ELSE
            BEGIN
                -- Booking is partially paid
                SELECT @NewStatusID = StatusID FROM BookingStatuses WHERE StatusName = 
                    CASE WHEN @BookingStatus = 'Pending' AND @NewDepositPaid = 1 THEN 'Confirmed' ELSE @BookingStatus END;
            END
            
            -- Update booking
            UPDATE Bookings
            SET 
                StatusID = @NewStatusID,
                DepositPaid = @NewDepositPaid,
                LastUpdated = GETDATE()
            WHERE 
                BookingID = @BookingID;

            -- Update booking providers if deposit is now paid
            IF @NewDepositPaid = 1 AND @DepositPaid = 0
            BEGIN
                UPDATE BookingProviders
                SET 
                    DepositPaid = 1,
                    ModifiedDate = GETDATE()
                WHERE 
                    BookingID = @BookingID;
            END
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- sp_Invoice_Generate: Create invoices
CREATE PROCEDURE sp_Invoice_Generate
    @BookingID INT,
    @InvoiceNumber NVARCHAR(50) = NULL,
    @IssueDate DATE = NULL,
    @DueDate DATE = NULL,
    @InvoiceID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;
    DECLARE @EventDate DATE;
    DECLARE @TotalPrice DECIMAL(18, 2);
    DECLARE @TotalPaid DECIMAL(18, 2);
    DECLARE @TaxAmount DECIMAL(18, 2) = 0;

    -- Get booking details
    SELECT 
        @UserID = b.UserID,
        @EventDate = b.EventDate,
        @TotalPrice = b.TotalPrice,
        @TotalPaid = ISNULL((SELECT SUM(Amount) FROM Payments p WHERE p.BookingID = b.BookingID AND p.Status = 'Completed'), 0)
    FROM 
        Bookings b
    WHERE 
        b.BookingID = @BookingID;

    IF @UserID IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
        RETURN;
    END
    
    -- Calculate tax (simplified for example)
    -- In a real system, you would look up tax rates based on location
    SET @TaxAmount = @TotalPrice * 0.1; -- 10% tax
    
    -- Set default dates if not provided
    IF @IssueDate IS NULL SET @IssueDate = GETDATE();
    IF @DueDate IS NULL SET @DueDate = DATEADD(DAY, 14, @IssueDate);

    -- Generate invoice number if not provided (YYYYMMDD-XXXXX)
    IF @InvoiceNumber IS NULL
    BEGIN
        DECLARE @NextNum INT;
        SELECT @NextNum = ISNULL(MAX(CAST(SUBSTRING(InvoiceNumber, 10, 5) AS INT)), 0) + 1
        FROM Invoices
        WHERE InvoiceNumber LIKE FORMAT(GETDATE(), 'yyyyMMdd') + '-%';
        
        SET @InvoiceNumber = FORMAT(GETDATE(), 'yyyyMMdd') + '-' + RIGHT('00000' + CAST(@NextNum AS NVARCHAR(5)), 5);
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Insert invoice record
        INSERT INTO Invoices (
            BookingID, InvoiceNumber, IssueDate, DueDate, Status,
            Subtotal, TaxAmount, TotalAmount, AmountPaid, BalanceDue
        )
        VALUES (
            @BookingID, @InvoiceNumber, @IssueDate, @DueDate, 
            CASE WHEN @TotalPaid >= @TotalPrice THEN 'Paid' ELSE 'Pending' END,
            @TotalPrice - @TaxAmount, @TaxAmount, @TotalPrice, @TotalPaid, @TotalPrice - @TotalPaid
        );

        SET @InvoiceID = SCOPE_IDENTITY();

        -- Add timeline event for invoice generation
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES (
            @BookingID, GETDATE(), 'Invoice', 
            'Invoice Generated', 
            'Invoice #' + @InvoiceNumber + ' has been generated. Amount due: ' + FORMAT(@TotalPrice - @TotalPaid, 'C')
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- sp_Revenue_Report: Generate financial reports
CREATE PROCEDURE sp_Revenue_Report
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @ProviderID INT = NULL,
    @ProviderTypeID INT = NULL,
    @EventTypeID INT = NULL,
    @GroupBy NVARCHAR(20) = 'month' -- day, week, month, quarter, year
AS
BEGIN
    SET NOCOUNT ON;

    -- Set default date range if not provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(YEAR, -1, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();

    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
        RETURN;
    END
    
    -- Generate report based on grouping
    IF @GroupBy = 'day'
    BEGIN
        SELECT 
            CAST(b.EventDate AS DATE) AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            CAST(b.EventDate AS DATE)
        ORDER BY 
            CAST(b.EventDate AS DATE);
    END
    ELSE IF @GroupBy = 'week'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(WEEK, b.EventDate) AS Week,
            MIN(b.EventDate) AS WeekStartDate,
            MAX(b.EventDate) AS WeekEndDate,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(WEEK, b.EventDate)
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(WEEK, b.EventDate);
    END
    ELSE IF @GroupBy = 'month'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(MONTH, b.EventDate) AS Month,
            FORMAT(b.EventDate, 'yyyy-MM') AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(MONTH, b.EventDate),
            FORMAT(b.EventDate, 'yyyy-MM')
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(MONTH, b.EventDate);
    END
    ELSE IF @GroupBy = 'quarter'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(QUARTER, b.EventDate) AS Quarter,
            'Q' + CAST(DATEPART(QUARTER, b.EventDate) AS VARCHAR(1)) + ' ' + CAST(DATEPART(YEAR, b.EventDate) AS VARCHAR(4)) AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(QUARTER, b.EventDate),
            'Q' + CAST(DATEPART(QUARTER, b.EventDate) AS VARCHAR(1)) + ' ' + CAST(DATEPART(YEAR, b.EventDate) AS VARCHAR(4))
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(QUARTER, b.EventDate);
    END
    ELSE -- year
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            DATEPART(YEAR, b.EventDate)
        ORDER BY 
            DATEPART(YEAR, b.EventDate);
    END
    
    -- Get summary totals
    SELECT 
        COUNT(DISTINCT b.BookingID) AS TotalBookingCount,
        SUM(b.TotalPrice) AS TotalGrossRevenue,
        SUM(p.FeeAmount) AS TotalFeesCollected,
        SUM(p.NetAmount) AS TotalNetRevenue,
        SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS TotalRefunds
    FROM 
        Bookings b
        INNER JOIN Payments p ON b.BookingID = p.BookingID
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
    WHERE 
        b.EventDate BETWEEN @StartDate AND @EndDate
        AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
        AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
        AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
        AND p.Status = 'Completed';
END;
GO

-- sp_Refund_Process: Handle refunds
CREATE PROCEDURE sp_Refund_Process
    @PaymentID INT,
    @RefundAmount DECIMAL(18, 2),
    @MethodID INT,
    @TransactionID NVARCHAR(255) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @RefundID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @OriginalAmount DECIMAL(18, 2);
    DECLARE @BookingID INT;
    DECLARE @UserID INT;
    DECLARE @ProviderID INT;

    -- Get original payment details
    SELECT 
        @OriginalAmount = Amount,
        @BookingID = BookingID,
        @UserID = UserID,
        @ProviderID = ProviderID
    FROM Payments
    WHERE PaymentID = @PaymentID;

    IF @OriginalAmount IS NULL
    BEGIN
        RAISERROR('Original payment not found.', 16, 1);
        RETURN;
    END
    
    -- Validate refund amount
    IF @RefundAmount <= 0 OR @RefundAmount > ABS(@OriginalAmount)
    BEGIN
        RAISERROR('Invalid refund amount.', 16, 1);
        RETURN;
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Record refund payment (negative amount)
        INSERT INTO Payments (
            BookingID, UserID, ProviderID, Amount, PaymentDate, 
            MethodID, TransactionID, Status, FeeAmount, NetAmount, Notes
        )
        VALUES (
            @BookingID,
            @UserID,
            @ProviderID,
            -@RefundAmount,
            GETDATE(),
            @MethodID,
            @TransactionID,
            'Completed',
            0, -- No fee for refunds
            -@RefundAmount,
            @Notes
        );

        SET @RefundID = SCOPE_IDENTITY();

        -- Update original payment if this is a partial refund
        IF @RefundAmount < ABS(@OriginalAmount)
        BEGIN
            UPDATE Payments
            SET Notes = ISNULL(Notes, '') + ' Partially refunded: ' + FORMAT(@RefundAmount, 'C')
            WHERE PaymentID = @PaymentID;
        END
        
        -- If this is a booking refund, update booking totals
        IF @BookingID IS NOT NULL
        BEGIN
            DECLARE @TotalPaid DECIMAL(18, 2);
            DECLARE @DepositAmount DECIMAL(18, 2);
            DECLARE @DepositPaid BIT;

            -- Get current paid amount
            SELECT @TotalPaid = ISNULL(SUM(Amount), 0)
            FROM Payments
            WHERE BookingID = @BookingID AND Status = 'Completed';

            -- Get deposit info
            SELECT 
                @DepositAmount = DepositAmount,
                @DepositPaid = DepositPaid
            FROM Bookings
            WHERE BookingID = @BookingID;

            -- Check if deposit should be marked as unpaid
            IF @DepositPaid = 1 AND @TotalPaid < @DepositAmount
            BEGIN
                UPDATE Bookings
                SET 
                    DepositPaid = 0,
                    LastUpdated = GETDATE()
                WHERE 
                    BookingID = @BookingID;

                -- Update booking providers
                UPDATE BookingProviders
                SET 
                    DepositPaid = 0,
                    ModifiedDate = GETDATE()
                WHERE 
                    BookingID = @BookingID;

                -- Add timeline event
                INSERT INTO BookingTimeline (
                    BookingID, EventDate, EventType, Title, Description
                )
                VALUES (
                    @BookingID, GETDATE(), 'Payment', 
                    'Deposit Refunded', 
                    'Deposit has been partially refunded. New amount paid: ' + FORMAT(@TotalPaid, 'C')
                );
            END
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- sp_Payment_ProcessPayout: Handle provider payouts
CREATE PROCEDURE sp_Payment_ProcessPayout
    @ProviderID INT,
    @Amount DECIMAL(18, 2),
    @MethodID INT,
    @TransactionID NVARCHAR(255) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @PayoutID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate provider exists
    IF NOT EXISTS (SELECT 1 FROM ServiceProviders WHERE ProviderID = @ProviderID AND IsActive = 1)
    BEGIN
        RAISERROR('Provider not found or inactive.', 16, 1);
        RETURN;
    END
    
    -- Calculate processing fee if method has one
    DECLARE @FeeAmount DECIMAL(18, 2) = 0;
    DECLARE @NetAmount DECIMAL(18, 2) = @Amount;

    SELECT @FeeAmount = @Amount * (ProcessingFeePercent / 100)
    FROM PaymentMethods
    WHERE MethodID = @MethodID;

    SET @NetAmount = @Amount - @FeeAmount;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Record payout
        INSERT INTO Payouts (
            ProviderID, Amount, PayoutDate, MethodID, Status,
            TransactionID, FeeAmount, NetAmount, Notes
        )
        VALUES (
            @ProviderID, @Amount, GETDATE(), @MethodID, 'Completed',
            @TransactionID, @FeeAmount, @NetAmount, @Notes
        );

        SET @PayoutID = SCOPE_IDENTITY();

        -- Record corresponding payment (negative amount from system to provider)
        INSERT INTO Payments (
            BookingID, UserID, ProviderID, Amount, PaymentDate, 
            MethodID, TransactionID, Status, FeeAmount, NetAmount, Notes
        )
        VALUES (
            NULL, -- No booking
            NULL, -- No user
            @ProviderID,
            -@Amount,
            GETDATE(),
            @MethodID,
            @TransactionID,
            'Completed',
            @FeeAmount,
            -@NetAmount, -- Negative net amount
            'Payout to provider: ' + ISNULL(@Notes, '')
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- sp_Financial_GetProviderEarnings: Provider earnings report
CREATE PROCEDURE sp_Financial_GetProviderEarnings
    @ProviderID INT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @GroupBy NVARCHAR(20) = 'month' -- day, week, month, quarter, year
AS
BEGIN
    SET NOCOUNT ON;

    -- Set default date range if not provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(YEAR, -1, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();

    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
        RETURN;
    END
    
    -- Generate report based on grouping
    IF @GroupBy = 'day'
    BEGIN
        SELECT 
            CAST(b.EventDate AS DATE) AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND CAST(po.PayoutDate AS DATE) = CAST(b.EventDate AS DATE)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            CAST(b.EventDate AS DATE)
        ORDER BY 
            CAST(b.EventDate AS DATE);
    END
    ELSE IF @GroupBy = 'week'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(WEEK, b.EventDate) AS Week,
            MIN(b.EventDate) AS WeekStartDate,
            MAX(b.EventDate) AS WeekEndDate,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND DATEPART(YEAR, po.PayoutDate) = DATEPART(YEAR, b.EventDate) AND DATEPART(WEEK, po.PayoutDate) = DATEPART(WEEK, b.EventDate)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(WEEK, b.EventDate)
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(WEEK, b.EventDate);
    END
    ELSE IF @GroupBy = 'month'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(MONTH, b.EventDate) AS Month,
            FORMAT(b.EventDate, 'yyyy-MM') AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND DATEPART(YEAR, po.PayoutDate) = DATEPART(YEAR, b.EventDate) AND DATEPART(MONTH, po.PayoutDate) = DATEPART(MONTH, b.EventDate)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(MONTH, b.EventDate),
            FORMAT(b.EventDate, 'yyyy-MM')
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(MONTH, b.EventDate);
    END
    ELSE IF @GroupBy = 'quarter'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(QUARTER, b.EventDate) AS Quarter,
            'Q' + CAST(DATEPART(QUARTER, b.EventDate) AS VARCHAR(1)) + ' ' + CAST(DATEPART(YEAR, b.EventDate) AS VARCHAR(4)) AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND DATEPART(YEAR, po.PayoutDate) = DATEPART(YEAR, b.EventDate) AND DATEPART(QUARTER, po.PayoutDate) = DATEPART(QUARTER, b.EventDate)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(QUARTER, b.EventDate),
            'Q' + CAST(DATEPART(QUARTER, b.EventDate) AS VARCHAR(1)) + ' ' + CAST(DATEPART(YEAR, b.EventDate) AS VARCHAR(4))
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(QUARTER, b.EventDate);
    END
    ELSE -- year
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND DATEPART(YEAR, po.PayoutDate) = DATEPART(YEAR, b.EventDate)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            DATEPART(YEAR, b.EventDate)
        ORDER BY 
            DATEPART(YEAR, b.EventDate);
    END
    
    -- Get summary totals
    SELECT 
        COUNT(DISTINCT b.BookingID) AS TotalBookingCount,
        SUM(bp.Price) AS TotalGrossEarnings,
        SUM(po.Amount) AS TotalPayoutsReceived,
        SUM(po.FeeAmount) AS TotalPayoutFees,
        SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS TotalBalanceDue
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'));

    -- Get upcoming earnings (confirmed but not yet completed bookings)
    SELECT 
        COUNT(DISTINCT b.BookingID) AS UpcomingBookingCount,
        SUM(bp.Price) AS UpcomingEarnings
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate > GETDATE()
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName = 'Confirmed');
END;
GO
