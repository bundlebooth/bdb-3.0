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

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_SubmitReview]'))
    DROP PROCEDURE [vendors].[sp_SubmitReview];
GO

CREATE   PROCEDURE [vendors].[sp_SubmitReview]
    @UserID INT,
    @VendorProfileID INT,
    @BookingID INT = NULL,
    @Rating INT,
    @Title NVARCHAR(100) = NULL,
    @Comment NVARCHAR(MAX),
    @QualityRating TINYINT = NULL,
    @CommunicationRating TINYINT = NULL,
    @ValueRating TINYINT = NULL,
    @PunctualityRating TINYINT = NULL,
    @ProfessionalismRating TINYINT = NULL,
    @WouldRecommend BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if user already reviewed this booking
    IF @BookingID IS NOT NULL AND EXISTS (
        SELECT 1 FROM vendors.Reviews 
        WHERE UserID = @UserID AND BookingID = @BookingID
    )
    BEGIN
        -- Return error - already reviewed
        SELECT NULL AS ReviewID, 'You have already reviewed this booking' AS ErrorMessage;
        RETURN;
    END

    INSERT INTO vendors.Reviews (
        UserID, VendorProfileID, BookingID, Rating, Title, Comment,
        QualityRating, CommunicationRating, ValueRating, 
        PunctualityRating, ProfessionalismRating, WouldRecommend,
        IsApproved, CreatedAt
    )
    VALUES (
        @UserID, @VendorProfileID, @BookingID, @Rating, @Title, @Comment,
        @QualityRating, @CommunicationRating, @ValueRating,
        @PunctualityRating, @ProfessionalismRating, @WouldRecommend,
        1, GETDATE()
    );

    -- Update vendor's average rating and total reviews
    UPDATE vendors.VendorProfiles
    SET 
        AvgRating = (SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM vendors.Reviews WHERE VendorProfileID = @VendorProfileID AND IsApproved = 1),
        TotalReviews = (SELECT COUNT(*) FROM vendors.Reviews WHERE VendorProfileID = @VendorProfileID AND IsApproved = 1),
        LastReviewDate = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;

    SELECT TOP 1 *
    FROM vendors.Reviews
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END

GO

PRINT 'Stored procedure [vendors].[sp_SubmitReview] created successfully.';
GO

