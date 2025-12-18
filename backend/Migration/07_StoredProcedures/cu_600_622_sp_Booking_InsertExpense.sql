-- =============================================
-- Stored Procedure: bookings.sp_InsertExpense
-- Description: Inserts an expense for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertExpense]'))
    DROP PROCEDURE [bookings].[sp_InsertExpense];
GO

CREATE PROCEDURE [bookings].[sp_InsertExpense]
    @BookingID INT,
    @VendorProfileID INT,
    @Title NVARCHAR(255),
    @Amount DECIMAL(10,2),
    @Notes NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO BookingExpenses (BookingID, VendorProfileID, Title, Amount, Notes, CreatedAt)
    OUTPUT INSERTED.BookingExpenseID, INSERTED.Title, INSERTED.Amount, INSERTED.Notes, INSERTED.CreatedAt
    VALUES (@BookingID, @VendorProfileID, @Title, @Amount, @Notes, GETDATE());
END
GO
