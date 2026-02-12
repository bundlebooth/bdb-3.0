-- =============================================
-- Stored Procedure: users.sp_GetReferralByCode
-- Description: Get referral details by referral code
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_GetReferralByCode]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_GetReferralByCode]
GO

CREATE PROCEDURE [users].[sp_GetReferralByCode]
    @ReferralCode NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.ReferralID,
        r.ReferrerUserID,
        r.RefereeEmail,
        r.RefereeName,
        r.ReferralCode,
        r.CustomMessage,
        r.Status,
        r.RefereeUserID,
        r.CreatedAt,
        r.CompletedAt,
        u.FirstName, 
        u.LastName, 
        u.Email AS ReferrerEmail
    FROM users.Referrals r
    JOIN users.Users u ON r.ReferrerUserID = u.UserID
    WHERE r.ReferralCode = @ReferralCode AND r.Status = 'pending'
END
GO
