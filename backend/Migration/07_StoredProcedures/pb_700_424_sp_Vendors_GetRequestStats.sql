/*
    Migration Script: Create Stored Procedure [vendors].[sp_GetRequestStats]
    Description: Gets booking request statistics for a vendor
    
    Execution Order: 712
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetRequestStats]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetRequestStats]'))
    DROP PROCEDURE [vendors].[sp_GetRequestStats];
GO

CREATE PROCEDURE [vendors].[sp_GetRequestStats]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(CASE WHEN Status = 'pending' THEN 1 END) AS PendingCount,
        COUNT(CASE WHEN Status = 'approved' THEN 1 END) AS ApprovedCount,
        COUNT(CASE WHEN Status = 'declined' THEN 1 END) AS DeclinedCount,
        COUNT(CASE WHEN Status = 'expired' THEN 1 END) AS ExpiredCount,
        COUNT(CASE WHEN Status = 'paid' THEN 1 END) AS PaidCount,
        COUNT(CASE WHEN Status = 'cancelled' OR Status LIKE 'cancelled_%' THEN 1 END) AS CancelledCount
    FROM bookings.Bookings WHERE VendorProfileID = @VendorProfileID;
END;
GO

PRINT 'Stored procedure [vendors].[sp_GetRequestStats] created successfully.';
GO
