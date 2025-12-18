-- =============================================
-- Stored Procedure: sp_Invoice_Update
-- Description: Updates an existing invoice
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_Update]'))
    DROP PROCEDURE [dbo].[sp_Invoice_Update];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_Update]
    @InvoiceID INT,
    @IssueDate DATETIME,
    @Status NVARCHAR(20),
    @Subtotal DECIMAL(10,2),
    @VendorExpensesTotal DECIMAL(10,2),
    @PlatformFee DECIMAL(10,2),
    @StripeFee DECIMAL(10,2),
    @TaxAmount DECIMAL(10,2),
    @TotalAmount DECIMAL(10,2),
    @FeesIncludedInTotal BIT,
    @SnapshotJSON NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Invoices
    SET IssueDate = @IssueDate, 
        Status = @Status, 
        Subtotal = @Subtotal, 
        VendorExpensesTotal = @VendorExpensesTotal,
        PlatformFee = @PlatformFee, 
        StripeFee = @StripeFee, 
        TaxAmount = @TaxAmount, 
        TotalAmount = @TotalAmount, 
        FeesIncludedInTotal = @FeesIncludedInTotal,
        UpdatedAt = GETDATE(), 
        SnapshotJSON = @SnapshotJSON
    WHERE InvoiceID = @InvoiceID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
