-- =============================================
-- Stored Procedure: bookings.sp_ApproveRequest
-- Description: Approves a booking request
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_ApproveRequest]'))
    DROP PROCEDURE [bookings].[sp_ApproveRequest];
GO

CREATE PROCEDURE [bookings].[sp_ApproveRequest]
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
    WHERE RequestID = @RequestID AND VendorProfileID = @VendorProfileID AND Status IN ('pending','expired');
END
GO

