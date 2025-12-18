-- =============================================
-- Stored Procedure: sp_Invoice_Create
-- Description: Creates a new invoice
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_Create]'))
    DROP PROCEDURE [dbo].[sp_Invoice_Create];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_Create]
    @BookingID INT,
    @UserID INT,
    @VendorProfileID INT,
    @InvoiceNumber NVARCHAR(50),
    @IssueDate DATETIME,
    @DueDate DATETIME,
    @Status NVARCHAR(20),
    @Currency NVARCHAR(10),
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
    
    INSERT INTO Invoices (
        BookingID, UserID, VendorProfileID, InvoiceNumber, IssueDate, DueDate, Status,
        Currency, Subtotal, VendorExpensesTotal, PlatformFee, StripeFee, TaxAmount, TotalAmount, 
        FeesIncludedInTotal, SnapshotJSON, CreatedAt, UpdatedAt
    ) VALUES (
        @BookingID, @UserID, @VendorProfileID, @InvoiceNumber, @IssueDate, @DueDate, @Status,
        @Currency, @Subtotal, @VendorExpensesTotal, @PlatformFee, @StripeFee, @TaxAmount, @TotalAmount, 
        @FeesIncludedInTotal, @SnapshotJSON, GETDATE(), GETDATE()
    );
    
    SELECT SCOPE_IDENTITY() AS InvoiceID;
END
GO
