/*
    Migration Script: Create Stored Procedure [sp_GetVendorRequestStats]
    Phase: 600 - Stored Procedures
    Script: cu_600_072_dbo.sp_GetVendorRequestStats.sql
    Description: Creates the [dbo].[sp_GetVendorRequestStats] stored procedure
    
    Execution Order: 72
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorRequestStats]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorRequestStats]'))
    DROP PROCEDURE [dbo].[sp_GetVendorRequestStats];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorRequestStats]
    @VendorProfileID INT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @StartDate IS NULL SET @StartDate = DATEADD(MONTH, -1, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    SELECT 
        COUNT(*) AS TotalRequests,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) AS PendingRequests,
        SUM(CASE WHEN Status = 'approved' THEN 1 ELSE 0 END) AS ApprovedRequests,
        SUM(CASE WHEN Status = 'declined' THEN 1 ELSE 0 END) AS DeclinedRequests,
        SUM(CASE WHEN Status = 'counter_offer' THEN 1 ELSE 0 END) AS CounterOffers,
        SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) AS CancelledRequests,
        SUM(CASE WHEN Status = 'confirmed' THEN 1 ELSE 0 END) AS ConfirmedRequests,
        AVG(CASE WHEN RespondedAt IS NOT NULL 
            THEN DATEDIFF(HOUR, CreatedAt, RespondedAt) 
            ELSE NULL END) AS AvgResponseTimeHours,
        CAST(
            CASE WHEN COUNT(*) > 0 
            THEN (SUM(CASE WHEN Status IN ('approved', 'confirmed') THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
            ELSE 0 END AS DECIMAL(5,2)
        ) AS ApprovalRate
    FROM BookingRequests
    WHERE VendorProfileID = @VendorProfileID
        AND CreatedAt >= @StartDate
        AND CreatedAt <= @EndDate;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorRequestStats] created successfully.';
GO
