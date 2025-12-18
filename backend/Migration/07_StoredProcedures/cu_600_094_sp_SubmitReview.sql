/*
    Migration Script: Create Stored Procedure [sp_SubmitReview]
    Phase: 600 - Stored Procedures
    Script: cu_600_094_dbo.sp_SubmitReview.sql
    Description: Creates the [vendors].[sp_SubmitReview] stored procedure
    
    Execution Order: 94
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_SubmitReview]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_SubmitReview]'))
    DROP PROCEDURE [vendors].[sp_SubmitReview];
GO

CREATE   PROCEDURE [vendors].[sp_SubmitReview]
    @UserID INT,
    @VendorProfileID INT,
    @Rating INT,
    @Comment NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO vendors.Reviews (UserID, VendorProfileID, Rating, Comment, CreatedAt)
    VALUES (@UserID, @VendorProfileID, @Rating, @Comment, GETDATE());

    SELECT TOP 1 *
    FROM vendors.Reviews
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END

GO

PRINT 'Stored procedure [vendors].[sp_SubmitReview] created successfully.';
GO

