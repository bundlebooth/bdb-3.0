/*
    Migration Script: Insert Interest Options Data
    Phase: 1000 - Data
    Script: pb_1000_50_InterestOptions.sql
    Description: Inserts predefined interest options for user profiles
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting interest options data...';
GO

-- Only insert if table is empty
IF NOT EXISTS (SELECT 1 FROM [users].[InterestOptions])
BEGIN
    INSERT INTO [users].[InterestOptions] ([Interest], [Category], [Icon]) VALUES
    -- Events & Celebrations
    (N'Weddings', N'Events', N'ring'),
    (N'Birthday Parties', N'Events', N'birthday-cake'),
    (N'Corporate Events', N'Events', N'briefcase'),
    (N'Baby Showers', N'Events', N'baby'),
    (N'Anniversaries', N'Events', N'heart'),
    (N'Graduation Parties', N'Events', N'graduation-cap'),
    (N'Holiday Celebrations', N'Events', N'gift'),
    
    -- Creative
    (N'Photography', N'Creative', N'camera'),
    (N'Videography', N'Creative', N'video'),
    (N'Floral Design', N'Creative', N'leaf'),
    (N'Interior Design', N'Creative', N'couch'),
    (N'DIY Crafts', N'Creative', N'scissors'),
    (N'Calligraphy', N'Creative', N'pen'),
    
    -- Food & Drink
    (N'Cooking', N'Food & Drink', N'utensils'),
    (N'Baking', N'Food & Drink', N'cookie'),
    (N'Wine Tasting', N'Food & Drink', N'wine-glass'),
    (N'Cocktails', N'Food & Drink', N'cocktail'),
    (N'Food Photography', N'Food & Drink', N'camera'),
    
    -- Music & Entertainment
    (N'Live Music', N'Entertainment', N'music'),
    (N'DJing', N'Entertainment', N'headphones'),
    (N'Dancing', N'Entertainment', N'music'),
    (N'Karaoke', N'Entertainment', N'microphone'),
    
    -- Lifestyle
    (N'Travel', N'Lifestyle', N'plane'),
    (N'Outdoor Adventures', N'Lifestyle', N'mountain'),
    (N'Fitness', N'Lifestyle', N'dumbbell'),
    (N'Yoga', N'Lifestyle', N'spa'),
    (N'Reading', N'Lifestyle', N'book'),
    (N'Art & Museums', N'Lifestyle', N'palette'),
    
    -- Social
    (N'Networking', N'Social', N'users'),
    (N'Community Service', N'Social', N'hands-helping'),
    (N'Mentoring', N'Social', N'chalkboard-teacher'),
    (N'Team Building', N'Social', N'users');
    
    PRINT 'Inserted predefined interest options successfully.';
END
ELSE
BEGIN
    PRINT 'Interest options already exist. Skipping.';
END
GO
