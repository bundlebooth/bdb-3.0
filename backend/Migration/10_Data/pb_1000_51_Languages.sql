/*
    Migration Script: Insert Languages Data
    Phase: 1000 - Data
    Script: pb_1000_51_Languages.sql
    Description: Inserts common languages for user profile selection
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting languages data...';
GO

IF NOT EXISTS (SELECT 1 FROM [admin].[Languages])
BEGIN
    INSERT INTO [admin].[Languages] ([Code], [Name], [NativeName], [DisplayOrder]) VALUES
    ('en', 'English', 'English', 1),
    ('es', 'Spanish', 'Español', 2),
    ('fr', 'French', 'Français', 3),
    ('de', 'German', 'Deutsch', 4),
    ('it', 'Italian', 'Italiano', 5),
    ('pt', 'Portuguese', 'Português', 6),
    ('zh', 'Chinese', '中文', 7),
    ('ja', 'Japanese', '日本語', 8),
    ('ko', 'Korean', '한국어', 9),
    ('ar', 'Arabic', 'العربية', 10),
    ('hi', 'Hindi', 'हिन्दी', 11),
    ('ru', 'Russian', 'Русский', 12),
    ('nl', 'Dutch', 'Nederlands', 13),
    ('pl', 'Polish', 'Polski', 14),
    ('tr', 'Turkish', 'Türkçe', 15),
    ('vi', 'Vietnamese', 'Tiếng Việt', 16),
    ('th', 'Thai', 'ไทย', 17),
    ('sv', 'Swedish', 'Svenska', 18),
    ('da', 'Danish', 'Dansk', 19),
    ('no', 'Norwegian', 'Norsk', 20),
    ('fi', 'Finnish', 'Suomi', 21),
    ('el', 'Greek', 'Ελληνικά', 22),
    ('he', 'Hebrew', 'עברית', 23),
    ('id', 'Indonesian', 'Bahasa Indonesia', 24),
    ('ms', 'Malay', 'Bahasa Melayu', 25),
    ('tl', 'Filipino', 'Filipino', 26),
    ('uk', 'Ukrainian', 'Українська', 27),
    ('cs', 'Czech', 'Čeština', 28),
    ('ro', 'Romanian', 'Română', 29),
    ('hu', 'Hungarian', 'Magyar', 30);
    
    PRINT 'Inserted languages successfully.';
END
ELSE
BEGIN
    PRINT 'Languages already exist. Skipping.';
END
GO
