/*
    Migration Script: Data - [Cultures]
    Phase: 1000 - Data
    Script: pb_1000_55_Cultures.sql
    Description: Inserts seed data into [admin].[Cultures]
    
    Execution Order: 55
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[Cultures]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[Cultures])
BEGIN
    SET IDENTITY_INSERT [admin].[Cultures] ON;

    INSERT [admin].[Cultures] ([CultureID], [CultureKey], [CultureName], [DisplayOrder]) VALUES 
    (1, N'south-asian', N'South Asian', 1),
    (2, N'chinese', N'Chinese', 2),
    (3, N'filipino', N'Filipino', 3),
    (4, N'vietnamese', N'Vietnamese', 4),
    (5, N'korean', N'Korean', 5),
    (6, N'japanese', N'Japanese', 6),
    (7, N'middle-eastern', N'Middle Eastern', 7),
    (8, N'african', N'African', 8),
    (9, N'caribbean', N'Caribbean', 9),
    (10, N'latin-american', N'Latin American', 10),
    (11, N'european', N'European', 11),
    (12, N'jewish', N'Jewish', 12),
    (13, N'greek', N'Greek', 13),
    (14, N'italian', N'Italian', 14),
    (15, N'portuguese', N'Portuguese', 15),
    (16, N'polish', N'Polish', 16),
    (17, N'ukrainian', N'Ukrainian', 17),
    (18, N'russian', N'Russian', 18),
    (19, N'indigenous', N'Indigenous', 19),
    (20, N'multicultural', N'Multicultural / Fusion', 20);

    SET IDENTITY_INSERT [admin].[Cultures] OFF;

    PRINT 'Inserted 20 records into [admin].[Cultures].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[Cultures] already contains data. Skipping.';
END
GO
