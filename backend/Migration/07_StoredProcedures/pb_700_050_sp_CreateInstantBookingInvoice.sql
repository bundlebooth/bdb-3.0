/*
    Migration Script: Create Stored Procedure [sp_CreateInstantBookingInvoice]
    Phase: 700 - Stored Procedures
    Description: Creates invoice for instant booking with payment
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [invoices].[sp_CreateInstantBookingInvoice]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_CreateInstantBookingInvoice]'))
    DROP PROCEDURE [invoices].[sp_CreateInstantBookingInvoice];
GO

CREATE PROCEDURE [invoices].[sp_CreateInstantBookingInvoice]
    @BookingID INT,
    @Subtotal DECIMAL(10, 2) = 0,
    @PlatformFee DECIMAL(10, 2) = 0,
    @TaxAmount DECIMAL(10, 2) = 0,
    @TaxPercent DECIMAL(5, 3) = 0,
    @TaxLabel NVARCHAR(50) = 'HST 13%',
    @ProcessingFee DECIMAL(10, 2) = 0,
    @GrandTotal DECIMAL(10, 2) = 0,
    @PaymentIntentID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if invoice already exists for this booking
        IF EXISTS (SELECT 1 FROM invoices.Invoices WHERE BookingID = @BookingID)
        BEGIN
            -- Update existing invoice to paid status
            UPDATE invoices.Invoices 
            SET Status = 'paid',
                PaymentStatus = 'paid',
                PaidAt = GETDATE(),
                StripePaymentIntentID = @PaymentIntentID,
                UpdatedAt = GETDATE()
            WHERE BookingID = @BookingID;
            
            SELECT InvoiceID FROM invoices.Invoices WHERE BookingID = @BookingID;
            RETURN;
        END
        
        -- Get booking details
        DECLARE @UserID INT, @VendorProfileID INT, @EventDate DATETIME, @EventName NVARCHAR(255);
        
        SELECT 
            @UserID = UserID,
            @VendorProfileID = VendorProfileID,
            @EventDate = EventDate,
            @EventName = EventName
        FROM bookings.Bookings 
        WHERE BookingID = @BookingID;
        
        IF @UserID IS NULL
        BEGIN
            RAISERROR('Booking not found', 16, 1);
            RETURN;
        END
        
        -- Generate invoice number (format: INV-BookingID-Timestamp)
        DECLARE @InvoiceNumber NVARCHAR(50);
        SET @InvoiceNumber = 'INV-' + CAST(@BookingID AS NVARCHAR(10)) + '-' + FORMAT(GETDATE(), 'yyyyMMddHHmmss');
        
        -- Create invoice
        INSERT INTO invoices.Invoices (
            BookingID,
            UserID,
            VendorProfileID,
            InvoiceNumber,
            Status,
            PaymentStatus,
            Subtotal,
            PlatformFee,
            TaxAmount,
            RenterProcessingFee,
            TotalAmount,
            DueDate,
            PaidAt,
            StripePaymentIntentID,
            CreatedAt,
            UpdatedAt
        )
        VALUES (
            @BookingID,
            @UserID,
            @VendorProfileID,
            @InvoiceNumber,
            'paid',
            'paid',
            @Subtotal,
            @PlatformFee,
            @TaxAmount,
            @ProcessingFee,
            @GrandTotal,
            GETDATE(),
            GETDATE(),
            @PaymentIntentID,
            GETDATE(),
            GETDATE()
        );
        
        DECLARE @InvoiceID INT = SCOPE_IDENTITY();
        
        SELECT @InvoiceID AS InvoiceID, @InvoiceNumber AS InvoiceNumber;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

PRINT 'Stored procedure [invoices].[sp_CreateInstantBookingInvoice] created successfully.';
GO
