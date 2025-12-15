/*
    Migration Script: Create Stored Procedure [sp_UpdateInvoiceAfterPayment]
    Phase: 600 - Stored Procedures
    Script: cu_600_098_dbo.sp_UpdateInvoiceAfterPayment.sql
    Description: Creates the [dbo].[sp_UpdateInvoiceAfterPayment] stored procedure
    
    Execution Order: 98
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateInvoiceAfterPayment]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateInvoiceAfterPayment]'))
    DROP PROCEDURE [dbo].[sp_UpdateInvoiceAfterPayment];
GO

-- Procedure to update invoice after payment
CREATE PROCEDURE [dbo].[sp_UpdateInvoiceAfterPayment]
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
    
    UPDATE Invoices
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
    UPDATE Bookings
    SET FullAmountPaid = 1,
        Status = 'paid',
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT InvoiceID FROM Invoices WHERE BookingID = @BookingID;
END;
GO

PRINT 'Stored procedure [dbo].[sp_UpdateInvoiceAfterPayment] created successfully.';
GO
