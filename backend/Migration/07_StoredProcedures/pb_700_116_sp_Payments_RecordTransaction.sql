-- =============================================
-- Stored Procedure: payments.sp_RecordTransaction
-- Description: Records a payment transaction
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_RecordTransaction]'))
    DROP PROCEDURE [payments].[sp_RecordTransaction];
GO

CREATE PROCEDURE [payments].[sp_RecordTransaction]
    @UserID INT = NULL,
    @VendorProfileID INT = NULL,
    @BookingID INT,
    @Amount DECIMAL(10,2),
    @FeeAmount DECIMAL(10,2),
    @NetAmount DECIMAL(10,2),
    @Currency NVARCHAR(3) = 'CAD',
    @Description NVARCHAR(255) = 'Payment',
    @StripeChargeID NVARCHAR(100) = NULL,
    @Status NVARCHAR(20) = 'succeeded'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check for duplicate transaction
    IF @StripeChargeID IS NOT NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM payments.Transactions WHERE StripeChargeID = @StripeChargeID)
        BEGIN
            SELECT TransactionID FROM payments.Transactions WHERE StripeChargeID = @StripeChargeID;
            RETURN;
        END
    END
    
    INSERT INTO payments.Transactions (UserID, VendorProfileID, BookingID, Amount, FeeAmount, NetAmount, Currency, Description, StripeChargeID, Status, CreatedAt)
    OUTPUT INSERTED.TransactionID
    VALUES (@UserID, @VendorProfileID, @BookingID, @Amount, @FeeAmount, @NetAmount, @Currency, @Description, @StripeChargeID, @Status, GETDATE());
END
GO

