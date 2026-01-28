/*
    Migration Script: Data - [EventTypes]
    Phase: 1000 - Data
    Script: pb_1000_54_EventTypes.sql
    Description: Inserts seed data into [admin].[EventTypes]
    
    Execution Order: 54
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[EventTypes]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[EventTypes])
BEGIN
    SET IDENTITY_INSERT [admin].[EventTypes] ON;

    INSERT [admin].[EventTypes] ([EventTypeID], [EventTypeKey], [EventTypeName], [DisplayOrder]) VALUES 
    (1, N'wedding', N'Weddings', 1),
    (2, N'corporate', N'Corporate Events', 2),
    (3, N'private', N'Private Parties', 3),
    (4, N'festival', N'Festivals', 4),
    (5, N'birthday', N'Birthday Parties', 5),
    (6, N'anniversary', N'Anniversaries', 6),
    (7, N'engagement', N'Engagement Parties', 7),
    (8, N'baby-shower', N'Baby Showers', 8),
    (9, N'bridal-shower', N'Bridal Showers', 9),
    (10, N'graduation', N'Graduation Parties', 10),
    (11, N'religious', N'Religious Ceremonies', 11),
    (12, N'cultural', N'Cultural Events', 12),
    (13, N'charity', N'Charity / Fundraising', 13),
    (14, N'conference', N'Conferences', 14),
    (15, N'trade-show', N'Trade Shows', 15);

    SET IDENTITY_INSERT [admin].[EventTypes] OFF;

    PRINT 'Inserted 15 records into [admin].[EventTypes].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EventTypes] already contains data. Skipping.';
END
GO
