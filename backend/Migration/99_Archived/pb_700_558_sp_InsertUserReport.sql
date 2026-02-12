-- =============================================
-- Stored Procedure: users.sp_InsertUserReport
-- Description: Insert a user report
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_InsertUserReport]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_InsertUserReport]
GO

CREATE PROCEDURE [users].[sp_InsertUserReport]
    @ReportedUserID INT,
    @Reason NVARCHAR(100),
    @Details NVARCHAR(MAX) = NULL,
    @ReportedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO users.UserReports (ReportedUserID, Reason, Details, ReportedBy, CreatedAt, Status)
    VALUES (@ReportedUserID, @Reason, @Details, @ReportedBy, GETDATE(), 'pending')
END
GO
