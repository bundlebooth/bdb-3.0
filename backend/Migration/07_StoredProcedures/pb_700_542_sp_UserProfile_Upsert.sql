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
    @LifeMotto NVARCHAR(100) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @ProfileImageURL NVARCHAR(500) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(100) = NULL,
    @Country NVARCHAR(100) = NULL,
    @Occupation NVARCHAR(200) = NULL,
    @Education NVARCHAR(200) = NULL,
    @Languages NVARCHAR(500) = NULL,
    @Generation NVARCHAR(20) = NULL,
    @CurrentPassion NVARCHAR(200) = NULL,
    @FurryFriends NVARCHAR(200) = NULL,
    @FreeTimeActivity NVARCHAR(200) = NULL,
    @InterestingTidbit NVARCHAR(300) = NULL,
    @HiddenTalent NVARCHAR(200) = NULL,
    @DreamDestination NVARCHAR(500) = NULL
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
            LifeMotto = @LifeMotto,
            Bio = @Bio,
            ProfileImageURL = COALESCE(@ProfileImageURL, ProfileImageURL),
            City = @City,
            State = @State,
            Country = @Country,
            Occupation = @Occupation,
            Education = @Education,
            Languages = @Languages,
            Generation = @Generation,
            CurrentPassion = @CurrentPassion,
            FurryFriends = @FurryFriends,
            FreeTimeActivity = @FreeTimeActivity,
            InterestingTidbit = @InterestingTidbit,
            HiddenTalent = @HiddenTalent,
            DreamDestination = @DreamDestination,
            UpdatedAt = GETDATE()
        WHERE UserProfileID = @UserProfileID;
    END
    ELSE
    BEGIN
        -- Create new profile
        INSERT INTO users.UserProfiles (
            UserID, DisplayName, LifeMotto, Bio, ProfileImageURL,
            City, State, Country, Occupation, Education, Languages, Generation,
            CurrentPassion, FurryFriends, FreeTimeActivity, InterestingTidbit, HiddenTalent, DreamDestination
        ) VALUES (
            @UserID, @DisplayName, @LifeMotto, @Bio, @ProfileImageURL,
            @City, @State, @Country, @Occupation, @Education, @Languages, @Generation,
            @CurrentPassion, @FurryFriends, @FreeTimeActivity, @InterestingTidbit, @HiddenTalent, @DreamDestination
        );
        
        SET @UserProfileID = SCOPE_IDENTITY();
    END
    
    -- Calculate profile completeness
    SELECT @Completeness = 
        CASE WHEN DisplayName IS NOT NULL AND DisplayName != '' THEN 10 ELSE 0 END +
        CASE WHEN Bio IS NOT NULL AND Bio != '' THEN 15 ELSE 0 END +
        CASE WHEN ProfileImageURL IS NOT NULL AND ProfileImageURL != '' THEN 15 ELSE 0 END +
        CASE WHEN Occupation IS NOT NULL AND Occupation != '' THEN 10 ELSE 0 END +
        CASE WHEN City IS NOT NULL AND City != '' THEN 10 ELSE 0 END +
        CASE WHEN Languages IS NOT NULL AND Languages != '' THEN 10 ELSE 0 END +
        CASE WHEN Education IS NOT NULL AND Education != '' THEN 5 ELSE 0 END +
        CASE WHEN CurrentPassion IS NOT NULL AND CurrentPassion != '' THEN 5 ELSE 0 END +
        CASE WHEN InterestingTidbit IS NOT NULL AND InterestingTidbit != '' THEN 5 ELSE 0 END +
        CASE WHEN LifeMotto IS NOT NULL AND LifeMotto != '' THEN 5 ELSE 0 END +
        CASE WHEN DreamDestination IS NOT NULL AND DreamDestination != '' THEN 5 ELSE 0 END +
        CASE WHEN FurryFriends IS NOT NULL AND FurryFriends != '' THEN 5 ELSE 0 END
    FROM users.UserProfiles WHERE UserProfileID = @UserProfileID;
    
    IF @Completeness > 100 SET @Completeness = 100;
    
    UPDATE users.UserProfiles SET ProfileCompleteness = @Completeness WHERE UserProfileID = @UserProfileID;
    
    -- Return result
    SELECT @UserProfileID as UserProfileID, @Completeness as ProfileCompleteness;
END
GO

PRINT 'Created stored procedure [users].[sp_UpsertUserProfile]';
GO
