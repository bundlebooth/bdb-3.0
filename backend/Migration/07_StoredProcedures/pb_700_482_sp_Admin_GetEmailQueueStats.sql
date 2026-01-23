/*
    Stored Procedure: admin.sp_GetEmailQueueStats
    Description: Gets email queue statistics
*/
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_GetEmailQueueStats'))
    DROP PROCEDURE admin.sp_GetEmailQueueStats
GO

CREATE PROCEDURE admin.sp_GetEmailQueueStats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Status, COUNT(*) AS Count FROM admin.EmailQueue GROUP BY Status;
END
GO
