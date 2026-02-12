-- =============================================
-- Stored Procedure: users.sp_CompleteReferral
-- Description: Complete a referral and update status
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_CompleteReferral]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_CompleteReferral]
GO

CREATE PROCEDURE [users].[sp_CompleteReferral]
    @ReferralCode NVARCHAR(50),
    @RefereeUserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Referrals 
    SET Status = 'completed', 
        RefereeUserID = @RefereeUserID, 
        CompletedAt = GETDATE()
    WHERE ReferralCode = @ReferralCode
END
GO
