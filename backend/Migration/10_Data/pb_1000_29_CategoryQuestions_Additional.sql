/*
    Migration Script: Additional CategoryQuestions with Filter Metadata
    Phase: 1000 - Data
    Script: pb_1000_29_CategoryQuestions_Additional.sql
    Description: Adds additional category questions and updates existing ones with IsFilterable metadata
    
    Execution Order: 29
*/

SET NOCOUNT ON;
GO

PRINT 'Adding additional CategoryQuestions and updating filter metadata...';
GO

-- Update existing questions to be filterable where appropriate
-- Photo/Video questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Photography' WHERE QuestionID = 1;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Videography' WHERE QuestionID = 2;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Drone Available' WHERE QuestionID = 3;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Editing Included' WHERE QuestionID = 4;

-- Venue questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Indoor Venue' WHERE QuestionID = 8;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Outdoor Venue' WHERE QuestionID = 9;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Wheelchair Accessible' WHERE QuestionID = 10;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'On-site Parking' WHERE QuestionID = 11;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Catering Available' WHERE QuestionID = 12;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Alcohol Allowed' WHERE QuestionID = 13;

-- Music/DJ questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'DJ Service' WHERE QuestionID = 18;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Live Music' WHERE QuestionID = 19;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'MC Services' WHERE QuestionID = 20;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Lighting Included' WHERE QuestionID = 21;

-- Catering questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Buffet Service' WHERE QuestionID = 25;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Plated Service' WHERE QuestionID = 26;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Vegan Options' WHERE QuestionID = 28;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Halal Options' WHERE QuestionID = 29;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Gluten-Free Options' WHERE QuestionID = 30;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Bar Service' WHERE QuestionID = 31;

-- Entertainment questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Family-Friendly' WHERE QuestionID = 33;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Indoor Performance' WHERE QuestionID = 37;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Outdoor Performance' WHERE QuestionID = 38;

-- Decor questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Custom Designs' WHERE QuestionID = 45;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Setup Included' WHERE QuestionID = 46;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Eco-Friendly' WHERE QuestionID = 49;

-- Beauty questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Mobile Service' WHERE QuestionID = 51;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Trial Available' WHERE QuestionID = 52;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Bridal Styling' WHERE QuestionID = 53;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Vegan Products' WHERE QuestionID = 55;

-- Cake questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Custom Designs' WHERE QuestionID = 56;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Vegan Options' WHERE QuestionID = 57;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Gluten-Free' WHERE QuestionID = 58;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Tasting Available' WHERE QuestionID = 61;

-- Transport questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Chauffeur Included' WHERE QuestionID = 62;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Alcohol Allowed' WHERE QuestionID = 64;

-- Planner questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Full Planning' WHERE QuestionID = 67;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Day-of Coordination' WHERE QuestionID = 69;

-- Fashion questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Rental Available' WHERE QuestionID = 72;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Custom Tailoring' WHERE QuestionID = 74;

-- Stationery questions
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Custom Designs' WHERE QuestionID = 77;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Rush Orders' WHERE QuestionID = 79;
UPDATE [admin].[CategoryQuestions] SET IsFilterable = 1, FilterType = 'boolean', FilterLabel = 'Eco-Friendly' WHERE QuestionID = 81;

GO

-- Add additional important questions for categories that need more coverage
-- These use the next available QuestionIDs

DECLARE @NextID INT;
SELECT @NextID = ISNULL(MAX(QuestionID), 0) + 1 FROM [admin].[CategoryQuestions];

-- Additional Photo/Video questions
IF NOT EXISTS (SELECT 1 FROM [admin].[CategoryQuestions] WHERE Category = 'photo' AND QuestionText LIKE '%second shooter%')
BEGIN
    INSERT INTO [admin].[CategoryQuestions] (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, IsFilterable, FilterType, FilterLabel)
    VALUES 
        ('photo', 'Second shooter available?', 'YesNo', NULL, 0, 8, 1, 1, 'boolean', 'Second Shooter'),
        ('photo', 'Same-day edits available?', 'YesNo', NULL, 0, 9, 1, 1, 'boolean', 'Same-Day Edits'),
        ('photo', 'Raw files provided?', 'YesNo', NULL, 0, 10, 1, 0, NULL, NULL);
END

-- Additional Venue questions  
IF NOT EXISTS (SELECT 1 FROM [admin].[CategoryQuestions] WHERE Category = 'venue' AND QuestionText LIKE '%guest capacity%')
BEGIN
    INSERT INTO [admin].[CategoryQuestions] (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, IsFilterable, FilterType, FilterLabel)
    VALUES 
        ('venue', 'Maximum guest capacity?', 'Select', '50,100,150,200,250,300,400,500+', 1, 11, 1, 1, 'select', 'Guest Capacity'),
        ('venue', 'Bridal suite available?', 'YesNo', NULL, 0, 12, 1, 1, 'boolean', 'Bridal Suite'),
        ('venue', 'Pet-friendly?', 'YesNo', NULL, 0, 13, 1, 1, 'boolean', 'Pet-Friendly'),
        ('venue', 'Overnight accommodations?', 'YesNo', NULL, 0, 14, 1, 1, 'boolean', 'Accommodations');
END

-- Additional Catering questions
IF NOT EXISTS (SELECT 1 FROM [admin].[CategoryQuestions] WHERE Category = 'catering' AND QuestionText LIKE '%kosher%')
BEGIN
    INSERT INTO [admin].[CategoryQuestions] (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, IsFilterable, FilterType, FilterLabel)
    VALUES 
        ('catering', 'Kosher options?', 'YesNo', NULL, 0, 9, 1, 1, 'boolean', 'Kosher Options'),
        ('catering', 'Nut-free options?', 'YesNo', NULL, 0, 10, 1, 1, 'boolean', 'Nut-Free'),
        ('catering', 'Cuisine type?', 'MultiSelect', 'American,Italian,Asian,Indian,Mexican,Mediterranean,French,Caribbean,African,Fusion', 0, 11, 1, 1, 'multiselect', 'Cuisine Type'),
        ('catering', 'Minimum guest count?', 'Select', '10,25,50,75,100,150,200', 0, 12, 1, 1, 'select', 'Minimum Guests');
END

-- Additional Music/DJ questions
IF NOT EXISTS (SELECT 1 FROM [admin].[CategoryQuestions] WHERE Category = 'music' AND QuestionText LIKE '%music genre%')
BEGIN
    INSERT INTO [admin].[CategoryQuestions] (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, IsFilterable, FilterType, FilterLabel)
    VALUES 
        ('music', 'Music genres?', 'MultiSelect', 'Top 40,R&B,Hip Hop,Latin,Bollywood,Country,Rock,Jazz,Classical,EDM,Reggae,Afrobeats', 0, 8, 1, 1, 'multiselect', 'Music Genres'),
        ('music', 'Wireless microphones included?', 'YesNo', NULL, 0, 9, 1, 0, NULL, NULL),
        ('music', 'Sound system provided?', 'YesNo', NULL, 0, 10, 1, 1, 'boolean', 'Sound System');
END

-- Additional Beauty questions
IF NOT EXISTS (SELECT 1 FROM [admin].[CategoryQuestions] WHERE Category = 'beauty' AND QuestionText LIKE '%group booking%')
BEGIN
    INSERT INTO [admin].[CategoryQuestions] (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, IsFilterable, FilterType, FilterLabel)
    VALUES 
        ('beauty', 'Group bookings available?', 'YesNo', NULL, 0, 6, 1, 1, 'boolean', 'Group Bookings'),
        ('beauty', 'Airbrush makeup?', 'YesNo', NULL, 0, 7, 1, 1, 'boolean', 'Airbrush Makeup'),
        ('beauty', 'Hair extensions available?', 'YesNo', NULL, 0, 8, 1, 0, NULL, NULL);
END

-- Additional Entertainment questions
IF NOT EXISTS (SELECT 1 FROM [admin].[CategoryQuestions] WHERE Category = 'entertainment' AND QuestionText LIKE '%performance duration%')
BEGIN
    INSERT INTO [admin].[CategoryQuestions] (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, IsFilterable, FilterType, FilterLabel)
    VALUES 
        ('entertainment', 'Minimum performance duration?', 'Select', '15 min,30 min,45 min,1 hour,2 hours,3+ hours', 0, 7, 1, 1, 'select', 'Min Duration'),
        ('entertainment', 'Multiple performers available?', 'YesNo', NULL, 0, 8, 1, 0, NULL, NULL);
END

-- Officiants questions (new category)
IF NOT EXISTS (SELECT 1 FROM [admin].[CategoryQuestions] WHERE Category = 'officiant')
BEGIN
    INSERT INTO [admin].[CategoryQuestions] (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, IsFilterable, FilterType, FilterLabel)
    VALUES 
        ('officiant', 'Religious ceremonies?', 'YesNo', NULL, 0, 1, 1, 1, 'boolean', 'Religious'),
        ('officiant', 'Non-denominational ceremonies?', 'YesNo', NULL, 0, 2, 1, 1, 'boolean', 'Non-Denominational'),
        ('officiant', 'Same-sex ceremonies?', 'YesNo', NULL, 0, 3, 1, 1, 'boolean', 'Same-Sex Friendly'),
        ('officiant', 'Bilingual ceremonies?', 'YesNo', NULL, 0, 4, 1, 1, 'boolean', 'Bilingual'),
        ('officiant', 'Custom vows assistance?', 'YesNo', NULL, 0, 5, 1, 0, NULL, NULL),
        ('officiant', 'Rehearsal included?', 'YesNo', NULL, 0, 6, 1, 1, 'boolean', 'Rehearsal Included');
END

GO

PRINT 'CategoryQuestions updates and additions completed successfully.';
GO
