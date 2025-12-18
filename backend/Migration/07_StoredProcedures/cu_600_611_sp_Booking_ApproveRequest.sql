-- =============================================
-- Stored Procedure: sp_Booking_ApproveRequest
-- Description: Approves a booking request
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_ApproveRequest]'))
    DROP PROCEDURE [dbo].[sp_Booking_ApproveRequest];
GO

CREATE PROCEDURE [dbo].[sp_Booking_ApproveRequest]
    @RequestID INT,
    @VendorProfileID INT,
    @Status NVARCHAR(50),
    @ResponseMessage NVARCHAR(MAX),
    @RespondedAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE BookingRequests 
    SET Status = @Status, ResponseMessage = @ResponseMessage, RespondedAt = @RespondedAt
    OUTPUT INSERTED.UserID, INSERTED.RequestID
    WHERE RequestID = @RequestID AND VendorProfileID = @VendorProfileID AND Status IN ('pending','expired');
END
GO
