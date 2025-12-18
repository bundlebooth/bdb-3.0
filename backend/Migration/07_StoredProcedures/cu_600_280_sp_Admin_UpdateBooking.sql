-- =============================================
-- Stored Procedure: admin.sp_UpdateBooking
-- Description: Updates booking details
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpdateBooking]'))
    DROP PROCEDURE [admin].[sp_UpdateBooking];
GO

CREATE PROCEDURE [admin].[sp_UpdateBooking]
    @BookingID INT,
    @Status NVARCHAR(20) = NULL,
    @EventDate DATETIME = NULL,
    @EndDate DATETIME = NULL,
    @TotalAmount DECIMAL(10,2) = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings 
    SET Status = COALESCE(@Status, Status),
        EventDate = COALESCE(@EventDate, EventDate),
        EndDate = COALESCE(@EndDate, EndDate),
        TotalAmount = COALESCE(@TotalAmount, TotalAmount),
        SpecialRequests = COALESCE(@SpecialRequests, SpecialRequests),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

