CREATE TABLE [dbo].[ReviewMedia] (
    [MediaID]      INT            IDENTITY (1, 1) NOT NULL,
    [ReviewID]     INT            NULL,
    [ImageURL]     NVARCHAR (255) NOT NULL,
    [DisplayOrder] INT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([MediaID] ASC),
    FOREIGN KEY ([ReviewID]) REFERENCES [dbo].[Reviews] ([ReviewID])
);


GO

