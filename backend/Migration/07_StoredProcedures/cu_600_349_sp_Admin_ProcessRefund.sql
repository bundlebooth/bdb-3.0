-- =============================================
-- Stored Procedure: sp_Admin_ProcessRefund
-- Description: Processes a refund for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_ProcessRefund]'))
    DROP PROCEDURE [dbo].[sp_Admin_ProcessRefund];
GO

CREATE PROCEDURE [dbo].[sp_Admin_ProcessRefund]
    @BookingID INT,
    @RefundAmount DECIMAL(10,2),
    @Reason NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings 
    SET Status = 'Refunded',
        RefundAmount = @RefundAmount,
        CancellationDate = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
