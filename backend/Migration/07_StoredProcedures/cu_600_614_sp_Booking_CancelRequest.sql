-- =============================================
-- Stored Procedure: bookings.sp_CancelRequest
-- Description: Cancels a booking request by user
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CancelRequest]'))
    DROP PROCEDURE [bookings].[sp_CancelRequest];
GO

CREATE PROCEDURE [bookings].[sp_CancelRequest]
    @RequestID INT,
    @UserID INT,
    @Status NVARCHAR(50),
    @RespondedAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.BookingRequests 
    SET Status = @Status, RespondedAt = @RespondedAt
    OUTPUT INSERTED.VendorProfileID
    WHERE RequestID = @RequestID AND UserID = @UserID AND Status IN ('pending', 'approved');
END
GO

