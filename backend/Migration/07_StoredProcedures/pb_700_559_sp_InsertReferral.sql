-- =============================================
-- Stored Procedure: users.sp_InsertReferral
-- Description: Insert a new referral invitation
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_InsertReferral]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_InsertReferral]
GO

CREATE PROCEDURE [users].[sp_InsertReferral]
    @ReferrerUserID INT,
    @RefereeEmail NVARCHAR(255),
    @RefereeName NVARCHAR(255) = NULL,
    @ReferralCode NVARCHAR(50),
    @CustomMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO users.Referrals (ReferrerUserID, RefereeEmail, RefereeName, ReferralCode, CustomMessage, Status, CreatedAt)
    VALUES (@ReferrerUserID, @RefereeEmail, @RefereeName, @ReferralCode, @CustomMessage, 'pending', GETDATE())
END
GO
