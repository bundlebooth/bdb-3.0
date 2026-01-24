/*
    Migration Script: Create Stored Procedure [sp_UpsertUserProfile]
    Phase: 700 - Stored Procedures
    Script: pb_700_542_sp_UserProfile_Upsert.sql
    Description: Creates or updates user profile with completeness calculation
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_UpsertUserProfile]') AND type in (N'P'))
    DROP PROCEDURE [users].[sp_UpsertUserProfile];
GO

CREATE PROCEDURE [users].[sp_UpsertUserProfile]
    @UserID INT,
    @DisplayName NVARCHAR(100) = NULL,
    @BiographyTitle NVARCHAR(100) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @ProfileImageURL NVARCHAR(500) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(100) = NULL,
    @Country NVARCHAR(100) = NULL,
    @Work NVARCHAR(200) = NULL,
    @School NVARCHAR(200) = NULL,
    @Languages NVARCHAR(500) = NULL,
    @DecadeBorn NVARCHAR(20) = NULL,
    @ObsessedWith NVARCHAR(200) = NULL,
    @Pets NVARCHAR(200) = NULL,
    @SpendTimeDoing NVARCHAR(200) = NULL,
    @FunFact NVARCHAR(300) = NULL,
    @UselessSkill NVARCHAR(200) = NULL,
    @FavoriteQuote NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserProfileID INT;
    DECLARE @Completeness INT;
    
    -- Check if profile exists
    SELECT @UserProfileID = UserProfileID FROM users.UserProfiles WHERE UserID = @UserID;
    
    IF @UserProfileID IS NOT NULL
    BEGIN
        -- Update existing profile
        UPDATE users.UserProfiles SET
            DisplayName = @DisplayName,
            BiographyTitle = @BiographyTitle,
            Bio = @Bio,
            ProfileImageURL = COALESCE(@ProfileImageURL, ProfileImageURL),
            City = @City,
            State = @State,
            Country = @Country,
            Work = @Work,
            School = @School,
            Languages = @Languages,
            DecadeBorn = @DecadeBorn,
            ObsessedWith = @ObsessedWith,
            Pets = @Pets,
            SpendTimeDoing = @SpendTimeDoing,
            FunFact = @FunFact,
            UselessSkill = @UselessSkill,
            FavoriteQuote = @FavoriteQuote,
            UpdatedAt = GETDATE()
        WHERE UserProfileID = @UserProfileID;
    END
    ELSE
    BEGIN
        -- Create new profile
        INSERT INTO users.UserProfiles (
            UserID, DisplayName, BiographyTitle, Bio, ProfileImageURL,
            City, State, Country, Work, School, Languages, DecadeBorn,
            ObsessedWith, Pets, SpendTimeDoing, FunFact, UselessSkill, FavoriteQuote
        ) VALUES (
            @UserID, @DisplayName, @BiographyTitle, @Bio, @ProfileImageURL,
            @City, @State, @Country, @Work, @School, @Languages, @DecadeBorn,
            @ObsessedWith, @Pets, @SpendTimeDoing, @FunFact, @UselessSkill, @FavoriteQuote
        );
        
        SET @UserProfileID = SCOPE_IDENTITY();
    END
    
    -- Calculate profile completeness
    SELECT @Completeness = 
        CASE WHEN DisplayName IS NOT NULL AND DisplayName != '' THEN 10 ELSE 0 END +
        CASE WHEN Bio IS NOT NULL AND Bio != '' THEN 15 ELSE 0 END +
        CASE WHEN ProfileImageURL IS NOT NULL AND ProfileImageURL != '' THEN 15 ELSE 0 END +
        CASE WHEN Work IS NOT NULL AND Work != '' THEN 10 ELSE 0 END +
        CASE WHEN City IS NOT NULL AND City != '' THEN 10 ELSE 0 END +
        CASE WHEN Languages IS NOT NULL AND Languages != '' THEN 10 ELSE 0 END +
        CASE WHEN School IS NOT NULL AND School != '' THEN 5 ELSE 0 END +
        CASE WHEN ObsessedWith IS NOT NULL AND ObsessedWith != '' THEN 5 ELSE 0 END +
        CASE WHEN FunFact IS NOT NULL AND FunFact != '' THEN 5 ELSE 0 END +
        CASE WHEN BiographyTitle IS NOT NULL AND BiographyTitle != '' THEN 5 ELSE 0 END +
        CASE WHEN FavoriteQuote IS NOT NULL AND FavoriteQuote != '' THEN 5 ELSE 0 END +
        CASE WHEN Pets IS NOT NULL AND Pets != '' THEN 5 ELSE 0 END
    FROM users.UserProfiles WHERE UserProfileID = @UserProfileID;
    
    IF @Completeness > 100 SET @Completeness = 100;
    
    UPDATE users.UserProfiles SET ProfileCompleteness = @Completeness WHERE UserProfileID = @UserProfileID;
    
    -- Return result
    SELECT @UserProfileID as UserProfileID, @Completeness as ProfileCompleteness;
END
GO

PRINT 'Created stored procedure [users].[sp_UpsertUserProfile]';
GO
