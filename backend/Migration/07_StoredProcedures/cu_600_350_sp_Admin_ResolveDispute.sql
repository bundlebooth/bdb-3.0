-- =============================================
-- Stored Procedure: admin.sp_ResolveDispute
-- Description: Resolves a booking dispute
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_ResolveDispute]'))
    DROP PROCEDURE [admin].[sp_ResolveDispute];
GO

CREATE PROCEDURE [admin].[sp_ResolveDispute]
    @BookingID INT,
    @Status NVARCHAR(50),
    @RefundAmount DECIMAL(10,2) = NULL,
    @Resolution NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings 
    SET Status = @Status,
        RefundAmount = @RefundAmount,
        SpecialRequests = CASE WHEN @Resolution IS NOT NULL THEN ISNULL(SpecialRequests, '') + ' [Resolution: ' + @Resolution + ']' ELSE SpecialRequests END,
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

