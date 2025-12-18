-- =============================================
-- Stored Procedure: bookings.sp_RespondToRequest
-- Description: Vendor responds to a booking request
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_RespondToRequest]'))
    DROP PROCEDURE [bookings].[sp_RespondToRequest];
GO

CREATE PROCEDURE [bookings].[sp_RespondToRequest]
    @RequestID INT,
    @VendorProfileID INT,
    @Status NVARCHAR(50),
    @ResponseMessage NVARCHAR(MAX),
    @ProposedPrice DECIMAL(10,2),
    @RespondedAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.BookingRequests 
    SET 
        Status = @Status,
        ResponseMessage = @ResponseMessage,
        ProposedPrice = @ProposedPrice,
        RespondedAt = @RespondedAt
    OUTPUT INSERTED.RequestID, INSERTED.UserID, INSERTED.Status
    WHERE RequestID = @RequestID AND VendorProfileID = @VendorProfileID;
END
GO

