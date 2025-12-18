-- =============================================
-- Stored Procedure: sp_Admin_UpdateBooking
-- Description: Updates booking details
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UpdateBooking]'))
    DROP PROCEDURE [dbo].[sp_Admin_UpdateBooking];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UpdateBooking]
    @BookingID INT,
    @Status NVARCHAR(20) = NULL,
    @EventDate DATETIME = NULL,
    @EndDate DATETIME = NULL,
    @TotalAmount DECIMAL(10,2) = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings 
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
