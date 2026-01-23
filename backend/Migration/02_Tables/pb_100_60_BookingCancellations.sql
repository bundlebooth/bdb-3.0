-- Booking Cancellations Table
-- Tracks cancellation details including who cancelled and refund info

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BookingCancellations' AND schema_id = SCHEMA_ID('bookings'))
BEGIN
    CREATE TABLE bookings.BookingCancellations (
        CancellationID INT IDENTITY(1,1) PRIMARY KEY,
        BookingID INT NOT NULL,
        
        -- Who initiated the cancellation
        CancelledBy NVARCHAR(20) NOT NULL, -- 'client', 'vendor', 'admin', 'system'
        CancelledByUserID INT NULL,
        
        -- Cancellation details
        CancellationReason NVARCHAR(MAX) NULL,
        CancellationDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- Refund information
        RefundAmount DECIMAL(10,2) NULL,
        RefundPercent DECIMAL(5,2) NULL,
        RefundStatus NVARCHAR(50) NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'none'
        
        -- Stripe refund details
        StripeRefundID NVARCHAR(100) NULL,
        StripeRefundStatus NVARCHAR(50) NULL,
        
        -- Application fee handling (platform fee is NOT refunded)
        ApplicationFeeRetained DECIMAL(10,2) NULL,
        
        -- Policy applied
        PolicyID INT NULL,
        HoursBeforeEvent INT NULL,
        
        -- Admin notes
        AdminNotes NVARCHAR(MAX) NULL,
        ProcessedAt DATETIME2 NULL,
        ProcessedByUserID INT NULL,
        
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_BookingCancellations_Booking 
            FOREIGN KEY (BookingID) REFERENCES bookings.Bookings(BookingID),
        CONSTRAINT FK_BookingCancellations_Policy 
            FOREIGN KEY (PolicyID) REFERENCES vendors.CancellationPolicies(PolicyID)
    );
    
    CREATE INDEX IX_BookingCancellations_BookingID 
        ON bookings.BookingCancellations(BookingID);
    CREATE INDEX IX_BookingCancellations_CancelledBy 
        ON bookings.BookingCancellations(CancelledBy);
END
GO
