/*
    ROLLBACK Script: Data - [CategoryQuestions]
    Description: Reverts CategoryQuestions to previous YesNo format
    
    Run this script to undo the checkbox-style changes and restore
    the original YesNo questions format.
*/

SET NOCOUNT ON;
GO

PRINT 'Rolling back [admin].[CategoryQuestions] to previous state...';
GO

-- First delete answers (foreign key constraint)
DELETE FROM [vendors].[VendorCategoryAnswers];
GO

-- Then clear the new checkbox-style data
DELETE FROM [admin].[CategoryQuestions];
GO

SET IDENTITY_INSERT [admin].[CategoryQuestions] ON;

-- =============================================
-- RESTORE ORIGINAL YESNO QUESTIONS
-- =============================================

-- VENUE CATEGORY (Original YesNo format)
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (1, N'venue', N'Indoor venue?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (2, N'venue', N'Outdoor venue?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (3, N'venue', N'Wheelchair accessible?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (4, N'venue', N'On-site parking available?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (5, N'venue', N'Catering available on-site?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (6, N'venue', N'Alcohol service allowed?', N'YesNo', NULL, 1, 6, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (7, N'venue', N'Sound restrictions?', N'YesNo', NULL, 1, 7, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (8, N'venue', N'Décor restrictions?', N'YesNo', NULL, 1, 8, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (9, N'venue', N'Tables/chairs included?', N'YesNo', NULL, 1, 9, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (10, N'venue', N'AV equipment included?', N'YesNo', NULL, 1, 10, 1, GETDATE(), GETDATE());

-- MUSIC CATEGORY
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (11, N'music', N'DJ service available?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (12, N'music', N'Live music available?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (13, N'music', N'MC services included?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (14, N'music', N'Sound equipment provided?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (15, N'music', N'Lighting included?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- PHOTO CATEGORY
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (16, N'photo', N'Photography services?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (17, N'photo', N'Videography services?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (18, N'photo', N'Drone coverage available?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (19, N'photo', N'Second shooter available?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (20, N'photo', N'Same-day edits available?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- CATERING CATEGORY
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (21, N'catering', N'On-site catering?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (22, N'catering', N'Off-premise catering?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (23, N'catering', N'Kosher options available?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (24, N'catering', N'Halal options available?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (25, N'catering', N'Vegan options available?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- DECOR CATEGORY
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (26, N'decor', N'Floral arrangements?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (27, N'decor', N'Centerpieces included?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (28, N'decor', N'Setup and breakdown included?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (29, N'decor', N'Rentals available?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (30, N'decor', N'Custom designs available?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- BEAUTY CATEGORY
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (31, N'beauty', N'Bridal makeup?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (32, N'beauty', N'Bridal hair styling?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (33, N'beauty', N'Trial session included?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (34, N'beauty', N'On-location service?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (35, N'beauty', N'Bridesmaid services?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- CAKE CATEGORY
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (36, N'cake', N'Custom cake designs?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (37, N'cake', N'Cupcakes available?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (38, N'cake', N'Gluten-free options?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (39, N'cake', N'Vegan options?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (40, N'cake', N'Delivery included?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- PLANNER CATEGORY
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (41, N'planner', N'Full planning services?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (42, N'planner', N'Day-of coordination?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (43, N'planner', N'Vendor management?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (44, N'planner', N'Budget management?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (45, N'planner', N'Destination weddings?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

-- TRANSPORT CATEGORY
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (46, N'transport', N'Limousine service?', N'YesNo', NULL, 1, 1, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (47, N'transport', N'Classic cars available?', N'YesNo', NULL, 1, 2, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (48, N'transport', N'Party bus available?', N'YesNo', NULL, 1, 3, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (49, N'transport', N'Shuttle service?', N'YesNo', NULL, 1, 4, 1, GETDATE(), GETDATE());
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (50, N'transport', N'Chauffeur included?', N'YesNo', NULL, 1, 5, 1, GETDATE(), GETDATE());

SET IDENTITY_INSERT [admin].[CategoryQuestions] OFF;

PRINT 'Rollback complete. Restored 50 YesNo questions.';
GO
