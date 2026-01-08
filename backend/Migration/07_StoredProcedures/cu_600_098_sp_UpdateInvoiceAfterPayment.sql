/*
    Migration Script: Create Stored Procedure [invoices.sp_UpdateAfterPayment]
    Phase: 600 - Stored Procedures
    Script: cu_600_098_sp_UpdateInvoiceAfterPayment.sql
    Description: Creates the [invoices].[sp_UpdateAfterPayment] stored procedure
    Schema: invoices
    Execution Order: 98
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [invoices].[sp_UpdateAfterPayment]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_UpdateAfterPayment]'))
    DROP PROCEDURE [invoices].[sp_UpdateAfterPayment];
GO

-- Procedure to update invoice after payment
CREATE PROCEDURE [invoices].[sp_UpdateAfterPayment]
    @BookingID INT,
    @StripeSessionId NVARCHAR(255) = NULL,
    @ServiceSubtotal DECIMAL(10,2) = NULL,
    @RenterProcessingFee DECIMAL(10,2) = NULL,
    @PlatformCommission DECIMAL(10,2) = NULL,
    @VendorPayout DECIMAL(10,2) = NULL,
    @TotalAmount DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE invoices.Invoices
    SET PaymentStatus = 'paid',
        PaidAt = GETUTCDATE(),
        StripeSessionId = ISNULL(@StripeSessionId, StripeSessionId),
        ServiceSubtotal = ISNULL(@ServiceSubtotal, ServiceSubtotal),
        RenterProcessingFee = ISNULL(@RenterProcessingFee, RenterProcessingFee),
        PlatformCommission = ISNULL(@PlatformCommission, PlatformCommission),
        VendorPayout = ISNULL(@VendorPayout, VendorPayout),
        TotalAmount = ISNULL(@TotalAmount, TotalAmount),
        UpdatedAt = GETUTCDATE()
    WHERE BookingID = @BookingID;
    
    -- Also update booking status
    UPDATE bookings.Bookings
    SET FullAmountPaid = 1,
        Status = 'paid',
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT InvoiceID FROM invoices.Invoices WHERE BookingID = @BookingID;
END;
GO

PRINT 'Stored procedure [invoices].[sp_UpdateAfterPayment] created successfully.';
GO


