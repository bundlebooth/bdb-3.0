-- =============================================
-- Stored Procedure: sp_Payment_InsertTransaction
-- Description: Inserts a new transaction record
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_InsertTransaction]'))
    DROP PROCEDURE [dbo].[sp_Payment_InsertTransaction];
GO

CREATE PROCEDURE [dbo].[sp_Payment_InsertTransaction]
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
    
    INSERT INTO Transactions (UserID, VendorProfileID, BookingID, Amount, FeeAmount, NetAmount, Currency, Description, StripeChargeID, Status, CreatedAt)
    OUTPUT INSERTED.TransactionID
    VALUES (@UserID, @VendorProfileID, @BookingID, @Amount, @FeeAmount, @NetAmount, @Currency, @Description, @StripeChargeID, @Status, GETDATE());
END
GO
