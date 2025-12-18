-- =============================================
-- Stored Procedure: bookings.sp_DeclineRequest
-- Description: Declines a booking request
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_DeclineRequest]'))
    DROP PROCEDURE [bookings].[sp_DeclineRequest];
GO

CREATE PROCEDURE [bookings].[sp_DeclineRequest]
    @RequestID INT,
    @VendorProfileID INT,
    @Status NVARCHAR(50),
    @ResponseMessage NVARCHAR(MAX),
    @RespondedAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.BookingRequests 
    SET Status = @Status, ResponseMessage = @ResponseMessage, RespondedAt = @RespondedAt
    OUTPUT INSERTED.UserID, INSERTED.RequestID
    WHERE RequestID = @RequestID AND VendorProfileID = @VendorProfileID AND Status = 'pending';
END
GO

