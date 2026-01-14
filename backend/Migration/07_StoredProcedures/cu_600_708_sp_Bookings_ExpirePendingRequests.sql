/*
    Migration Script: Create Stored Procedure [bookings].[sp_ExpirePendingRequests]
    Description: Expires pending booking requests that have passed their expiry date
    
    Execution Order: 708
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_ExpirePendingRequests]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_ExpirePendingRequests]'))
    DROP PROCEDURE [bookings].[sp_ExpirePendingRequests];
GO

CREATE PROCEDURE [bookings].[sp_ExpirePendingRequests]
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE bookings.Bookings 
    SET Status = 'expired', ExpiredAt = GETDATE(), UpdatedAt = GETDATE() 
    WHERE Status = 'pending' AND ExpiresAt IS NOT NULL AND ExpiresAt < GETDATE();
    SELECT @@ROWCOUNT AS ExpiredCount;
END;
GO

PRINT 'Stored procedure [bookings].[sp_ExpirePendingRequests] created successfully.';
GO
