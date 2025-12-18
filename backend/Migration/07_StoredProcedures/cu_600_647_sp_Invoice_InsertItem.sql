-- =============================================
-- Stored Procedure: invoices.sp_InsertItem
-- Description: Inserts an invoice item
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_InsertItem]'))
    DROP PROCEDURE [invoices].[sp_InsertItem];
GO

CREATE PROCEDURE [invoices].[sp_InsertItem]
    @InvoiceID INT,
    @ItemType NVARCHAR(50),
    @RefID INT = NULL,
    @Title NVARCHAR(255),
    @Description NVARCHAR(MAX) = NULL,
    @Quantity DECIMAL(10,2),
    @UnitPrice DECIMAL(10,2),
    @Amount DECIMAL(10,2),
    @IsPayable BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO invoices.InvoiceItems (InvoiceID, ItemType, RefID, Title, Description, Quantity, UnitPrice, Amount, IsPayable)
    VALUES (@InvoiceID, @ItemType, @RefID, @Title, @Description, @Quantity, @UnitPrice, @Amount, @IsPayable);
    
    SELECT SCOPE_IDENTITY() AS InvoiceItemID;
END
GO

