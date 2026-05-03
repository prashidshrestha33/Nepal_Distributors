IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[feedbacks]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[feedbacks](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NULL,
	[company_id] [bigint] NULL,
	[subject] [nvarchar](400) NULL,
	[message] [nvarchar](max) NULL,
	[File_name] [nvarchar](max) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO
