-- =============================================
-- Stored Procedure: admin.sp_ProcessRefund
-- Description: Processes a refund for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_ProcessRefund]'))
    DROP PROCEDURE [admin].[sp_ProcessRefund];
GO

CREATE PROCEDURE [admin].[sp_ProcessRefund]
    @BookingID INT,
    @RefundAmount DECIMAL(10,2),
    @Reason NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings 
    SET Status = 'Refunded',
        RefundAmount = @RefundAmount,
        CancellationDate = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

