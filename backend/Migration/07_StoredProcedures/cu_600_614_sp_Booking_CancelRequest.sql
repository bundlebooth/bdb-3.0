-- =============================================
-- Stored Procedure: sp_Booking_CancelRequest
-- Description: Cancels a booking request by user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_CancelRequest]'))
    DROP PROCEDURE [dbo].[sp_Booking_CancelRequest];
GO

CREATE PROCEDURE [dbo].[sp_Booking_CancelRequest]
    @RequestID INT,
    @UserID INT,
    @Status NVARCHAR(50),
    @RespondedAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE BookingRequests 
    SET Status = @Status, RespondedAt = @RespondedAt
    OUTPUT INSERTED.VendorProfileID
    WHERE RequestID = @RequestID AND UserID = @UserID AND Status IN ('pending', 'approved');
END
GO
