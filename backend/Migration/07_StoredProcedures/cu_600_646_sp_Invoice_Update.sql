-- =============================================
-- Stored Procedure: invoices.sp_Update
-- Description: Updates an existing invoice
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_Update]'))
    DROP PROCEDURE [invoices].[sp_Update];
GO

CREATE PROCEDURE [invoices].[sp_Update]
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
    
    UPDATE invoices.Invoices
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

