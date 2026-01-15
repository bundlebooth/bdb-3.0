-- =============================================
-- Bookings - Update Invoice Status
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('bookings.sp_UpdateInvoiceStatus', 'P') IS NOT NULL
    DROP PROCEDURE bookings.sp_UpdateInvoiceStatus;
GO

CREATE PROCEDURE bookings.sp_UpdateInvoiceStatus
    @BookingID INT,
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE invoices.Invoices 
    SET Status = @Status, UpdatedAt = GETUTCDATE() 
    WHERE BookingID = @BookingID;
END
GO
