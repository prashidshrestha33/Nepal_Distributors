USE [NepalDistributers]
GO
/****** Object:  Table [dbo].[audit_logs]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[audit_logs](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[actor_user_id] [bigint] NULL,
	[actor_company_id] [bigint] NULL,
	[action] [nvarchar](400) NOT NULL,
	[resource_type] [nvarchar](200) NULL,
	[resource_id] [bigint] NULL,
	[details] [nvarchar](max) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[banners]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[banners](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[title] [nvarchar](400) NULL,
	[image_key] [nvarchar](1000) NULL,
	[link_url] [nvarchar](1000) NULL,
	[target_type] [nvarchar](100) NULL,
	[target_id] [bigint] NULL,
	[start_date] [datetimeoffset](3) NULL,
	[end_date] [datetimeoffset](3) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[brands]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[brands](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](400) NOT NULL,
	[slug] [nvarchar](400) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[categories]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[categories](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](400) NOT NULL,
	[slug] [nvarchar](400) NOT NULL,
	[parent_id] [bigint] NULL,
	[depth] [smallint] NOT NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[updated_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[chats]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[chats](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[from_user_id] [bigint] NULL,
	[to_user_id] [bigint] NULL,
	[company_id] [bigint] NULL,
	[message] [nvarchar](max) NULL,
	[metadata] [nvarchar](max) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[companies]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[companies](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](400) NOT NULL,
	[contact_person] [nvarchar](400) NULL,
	[mobile_phone] [nvarchar](50) NULL,
	[landline_phone] [nvarchar](50) NULL,
	[registration_document] [nvarchar](max) NULL,
	[company_type] [nvarchar](200) NULL,
	[status] [nvarchar](50) NOT NULL,
	[user_type] [nvarchar](100) NULL,
	[credits] [bigint] NOT NULL,
	[tier] [nvarchar](100) NULL,
	[location] [nvarchar](max) NULL,
	[google_map_location] [geography] NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[updated_at] [datetimeoffset](3) NOT NULL,
	[approve_dt] [char](1) NULL,
	[approve_ts] [datetimeoffset](3) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[companies_category]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[companies_category](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[company_type] [nvarchar](50) NULL,
	[description] [nvarchar](max) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[updated_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[companies_category_assigned]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[companies_category_assigned](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[companies_category_id] [bigint] NULL,
	[company_id] [bigint] NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[updated_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[credits_transactions]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credits_transactions](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NULL,
	[company_id] [bigint] NULL,
	[delta] [bigint] NOT NULL,
	[reason] [nvarchar](max) NULL,
	[related_order_id] [bigint] NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[csv_imports]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[csv_imports](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[company_id] [bigint] NULL,
	[uploaded_by] [bigint] NULL,
	[filename] [nvarchar](1000) NULL,
	[status] [nvarchar](100) NULL,
	[report] [nvarchar](max) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[feedbacks]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[feedbacks](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NULL,
	[company_id] [bigint] NULL,
	[subject] [nvarchar](400) NULL,
	[message] [nvarchar](max) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[manufacturers]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[manufacturers](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[company_id] [bigint] NULL,
	[name] [nvarchar](400) NOT NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[notification_mutes]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[notification_mutes](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NULL,
	[product_id] [bigint] NULL,
	[category_id] [bigint] NULL,
	[start_date] [datetimeoffset](3) NULL,
	[end_date] [datetimeoffset](3) NULL,
	[mute_until_next] [bit] NOT NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[approve_dt] [char](1) NULL,
	[approve_ts] [datetimeoffset](3) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[notifications]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[notifications](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NULL,
	[company_id] [bigint] NULL,
	[type] [nvarchar](100) NULL,
	[payload] [nvarchar](max) NULL,
	[is_read] [bit] NOT NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[order_items]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[order_items](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[order_id] [bigint] NOT NULL,
	[product_id] [bigint] NULL,
	[product_name] [nvarchar](800) NULL,
	[quantity] [decimal](18, 3) NOT NULL,
	[unit_rate] [decimal](12, 2) NOT NULL,
	[total_amount] [decimal](14, 2) NOT NULL,
	[remarks] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[orders]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[orders](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[order_number] [nvarchar](200) NOT NULL,
	[buyer_company_id] [bigint] NULL,
	[seller_company_id] [bigint] NULL,
	[created_by] [bigint] NULL,
	[status] [nvarchar](50) NOT NULL,
	[required_by_date] [date] NULL,
	[shipping_address] [nvarchar](max) NULL,
	[shipping_charge] [decimal](12, 2) NOT NULL,
	[vat_amount] [decimal](12, 2) NOT NULL,
	[grand_total] [decimal](14, 2) NOT NULL,
	[remarks] [nvarchar](max) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[updated_at] [datetimeoffset](3) NOT NULL,
	[approve_dt] [char](1) NULL,
	[approve_ts] [datetimeoffset](3) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[order_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payments]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payments](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[company_id] [bigint] NULL,
	[user_id] [bigint] NULL,
	[provider] [nvarchar](200) NULL,
	[provider_reference] [nvarchar](1000) NULL,
	[amount] [decimal](12, 2) NULL,
	[status] [nvarchar](50) NOT NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[permissions]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[permissions](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](200) NOT NULL,
	[description] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Product_Categories]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Product_Categories](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](400) NOT NULL,
	[slug] [nvarchar](400) NOT NULL,
	[parent_id] [bigint] NULL,
	[depth] [smallint] NOT NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[updated_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[product_images]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[product_images](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[product_id] [bigint] NOT NULL,
	[s3_key] [nvarchar](1000) NOT NULL,
	[alt_text] [nvarchar](400) NULL,
	[sort_order] [int] NOT NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[products]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[products](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[sku] [nvarchar](200) NULL,
	[name] [nvarchar](800) NOT NULL,
	[description] [nvarchar](max) NULL,
	[short_description] [nvarchar](max) NULL,
	[category_id] [bigint] NULL,
	[brand_id] [bigint] NULL,
	[manufacturer_id] [bigint] NULL,
	[rate] [decimal](12, 2) NOT NULL,
	[hs_code] [nvarchar](100) NULL,
	[status] [nvarchar](50) NOT NULL,
	[is_featured] [bit] NOT NULL,
	[seo_title] [nvarchar](400) NULL,
	[seo_description] [nvarchar](max) NULL,
	[attributes] [nvarchar](max) NULL,
	[ImageName] [nvarchar](max) NULL,
	[created_by] [bigint] NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[updated_at] [datetimeoffset](3) NOT NULL,
	[approve_fg] [char](1) NULL,
	[approve_ts] [datetimeoffset](3) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[quote_items]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[quote_items](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[quote_id] [bigint] NOT NULL,
	[product_id] [bigint] NULL,
	[quantity] [decimal](18, 3) NULL,
	[unit_rate] [decimal](12, 2) NULL,
	[total_amount] [decimal](14, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[quotes]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[quotes](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[quote_number] [nvarchar](200) NULL,
	[order_id] [bigint] NULL,
	[quoted_by] [bigint] NULL,
	[expires_at] [datetimeoffset](3) NULL,
	[shipping_charge] [decimal](12, 2) NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[approve_dt] [char](1) NULL,
	[approve_ts] [datetimeoffset](3) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[quote_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[role_permissions]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[role_permissions](
	[role_id] [int] NOT NULL,
	[permission_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[role_id] ASC,
	[permission_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[roles]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[roles](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](200) NOT NULL,
	[description] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[seo_pages]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[seo_pages](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[slug] [nvarchar](400) NULL,
	[title] [nvarchar](400) NULL,
	[content] [nvarchar](max) NULL,
	[type] [nvarchar](100) NULL,
	[target_id] [bigint] NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[static_value]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[static_value](
	[static_id] [bigint] IDENTITY(1,1) NOT NULL,
	[Catalog_id] [bigint] NOT NULL,
	[static_value] [nvarchar](100) NOT NULL,
	[static_data] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_static_value_static_id] PRIMARY KEY CLUSTERED 
(
	[static_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[static_value_cataglog]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[static_value_cataglog](
	[Catalog_id] [bigint] IDENTITY(1,1) NOT NULL,
	[Catalog_Name] [nvarchar](100) NOT NULL,
	[Catalog_Type] [nvarchar](max) NULL,
	[Catalog_Description] [nvarchar](max) NULL,
	[Display_Order] [INT] NULL,
 CONSTRAINT [PK_static_value_cataglog_Catalog_id] PRIMARY KEY CLUSTERED 
(
	[Catalog_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_roles]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_roles](
	[user_id] [bigint] NOT NULL,
	[role_id] [int] NOT NULL,
	[assigned_at] [datetimeoffset](3) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC,
	[role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[users]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[company_id] [bigint] NULL,
	[email] [nvarchar](320) NOT NULL,
	[password_hash] [nvarchar](200) NULL,
	[full_name] [nvarchar](400) NULL,
	[phone] [nvarchar](50) NULL,
	[role] [nvarchar](50) NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[credits] [bigint] NOT NULL,
	[tier] [nvarchar](100) NULL,
	[created_at] [datetimeoffset](3) NOT NULL,
	[updated_at] [datetimeoffset](3) NOT NULL,
	[approve_dt] [datetimeoffset](3) NULL,
	[approve_fg] [char](1) NULL,
	[last_login_at] [datetimeoffset](3) NULL,
	[google_id] [nvarchar](200) NULL,
	[facebook_id] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[audit_logs] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[banners] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[brands] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[categories] ADD  DEFAULT ((1)) FOR [depth]
GO
ALTER TABLE [dbo].[categories] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[categories] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[chats] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT ('active') FOR [status]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT ((0)) FOR [credits]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT (sysutcdatetime()) FOR [approve_ts]
GO
ALTER TABLE [dbo].[companies_category] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[companies_category] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[companies_category_assigned] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[companies_category_assigned] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[credits_transactions] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[csv_imports] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[feedbacks] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[manufacturers] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[notification_mutes] ADD  DEFAULT ((0)) FOR [mute_until_next]
GO
ALTER TABLE [dbo].[notification_mutes] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[notification_mutes] ADD  DEFAULT (sysdatetimeoffset()) FOR [approve_ts]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT ((0)) FOR [is_read]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[order_items] ADD  DEFAULT ((0)) FOR [quantity]
GO
ALTER TABLE [dbo].[order_items] ADD  DEFAULT ((0)) FOR [unit_rate]
GO
ALTER TABLE [dbo].[order_items] ADD  DEFAULT ((0)) FOR [total_amount]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT ((0)) FOR [shipping_charge]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT ((0)) FOR [vat_amount]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT ((0)) FOR [grand_total]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT (sysdatetimeoffset()) FOR [approve_ts]
GO
ALTER TABLE [dbo].[payments] ADD  DEFAULT ('pending') FOR [status]
GO
ALTER TABLE [dbo].[payments] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[Product_Categories] ADD  DEFAULT ((0)) FOR [depth]
GO
ALTER TABLE [dbo].[Product_Categories] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[Product_Categories] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[product_images] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[product_images] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[quotes] ADD  DEFAULT ((0)) FOR [shipping_charge]
GO
ALTER TABLE [dbo].[quotes] ADD  DEFAULT ('open') FOR [status]
GO
ALTER TABLE [dbo].[quotes] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[quotes] ADD  DEFAULT (sysdatetimeoffset()) FOR [approve_ts]
GO
ALTER TABLE [dbo].[seo_pages] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[user_roles] ADD  DEFAULT (sysdatetimeoffset()) FOR [assigned_at]
GO
ALTER TABLE [dbo].[static_value]  WITH CHECK ADD  CONSTRAINT [FK_static_value_catalog] FOREIGN KEY([Catalog_id])
REFERENCES [dbo].[static_value_cataglog] ([Catalog_id])
GO
ALTER TABLE [dbo].[static_value] CHECK CONSTRAINT [FK_static_value_catalog]
GO
/****** Object:  StoredProcedure [dbo].[sp_AddCategory]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_AddCategory]
    @name NVARCHAR(400),
    @slug NVARCHAR(400),
    @parent_id BIGINT = NULL,
    @new_id BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- validate slug uniqueness
    IF EXISTS (SELECT 1 FROM dbo.Product_Categories WHERE slug = @slug)
    BEGIN
        RAISERROR('Slug already exists', 16, 1);
        RETURN;
    END

    DECLARE @depth SMALLINT = 0;

    IF @parent_id IS NOT NULL
    BEGIN
        SELECT @depth = depth + 1 FROM dbo.Product_Categories WHERE id = @parent_id;
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Parent category not found', 16, 1);
            RETURN;
        END
    END

    INSERT INTO dbo.Product_Categories (name, slug, parent_id, depth, created_at, updated_at)
    VALUES (@name, @slug, @parent_id, @depth, SYSUTCDATETIME(), SYSUTCDATETIME());

    SET @new_id = SCOPE_IDENTITY();
END
GO
/****** Object:  StoredProcedure [dbo].[sp_GetCategoriesTreeJson]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_GetCategoriesTreeJson]
AS
BEGIN
  SET NOCOUNT ON;

  ;WITH cte AS (
    SELECT id, name, slug, parent_id, depth
    FROM dbo.Product_Categories
  ), recurse AS (
    SELECT id, name, slug, parent_id, depth, CAST(name AS NVARCHAR(MAX)) AS path
    FROM cte WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.slug, c.parent_id, c.depth, CAST(r.path + '/' + c.name AS NVARCHAR(MAX))
    FROM cte c INNER JOIN recurse r ON c.parent_id = r.id
  )
  SELECT id, name, slug, parent_id, depth
  FROM recurse
  ORDER BY path
  FOR JSON PATH, ROOT('categories');
END
GO
/****** Object:  StoredProcedure [dbo].[sp_MoveCategory]    Script Date: 12/10/2025 11:40:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_MoveCategory]
    @category_id BIGINT,
    @new_parent_id BIGINT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  -- Basic validations
  IF NOT EXISTS (SELECT 1 FROM dbo.Product_Categories WHERE id = @category_id)
  BEGIN
    RAISERROR('Category to move not found (id=%d).', 16, 1, @category_id);
    RETURN;
  END

  IF @new_parent_id IS NOT NULL AND @new_parent_id = @category_id
  BEGIN
    RAISERROR('Invalid move: new parent cannot be the category itself.', 16, 1);
    RETURN;
  END

  IF @new_parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Product_Categories WHERE id = @new_parent_id)
  BEGIN
    RAISERROR('New parent not found (id=%d).', 16, 1, @new_parent_id);
    RETURN;
  END

  BEGIN TRAN;
  BEGIN TRY
    ----------------------------------------------------------------
    -- Build the subtree of the moved node into a transient CTE and
    -- capture whether the proposed new_parent is inside that subtree.
    -- We cannot write "WITH ... IF EXISTS(...)" directly because a CTE
    -- must be immediately followed by a single statement that consumes it.
    ----------------------------------------------------------------
    DECLARE @isDescendant BIT = 0;

    ;WITH descendants AS (
      SELECT id, parent_id, depth
      FROM dbo.Product_Categories
      WHERE id = @category_id

      UNION ALL

      SELECT c.id, c.parent_id, c.depth
      FROM dbo.Product_Categories c
      INNER JOIN descendants d ON c.parent_id = d.id
    )
    -- consume the CTE by selecting into a variable
    SELECT TOP (1) @isDescendant = 1
    FROM descendants
    WHERE id = @new_parent_id;

    IF @new_parent_id IS NOT NULL AND @isDescendant = 1
    BEGIN
      RAISERROR('Invalid move: new parent is inside the category subtree (would create a cycle).', 16, 1);
      ROLLBACK TRAN;
      RETURN;
    END

    ----------------------------------------------------------------
    -- Compute depths and update node + subtree depths
    ----------------------------------------------------------------
    DECLARE @new_depth SMALLINT = 0;
    IF @new_parent_id IS NOT NULL
    BEGIN
      SELECT @new_depth = depth + 1 FROM dbo.Product_Categories WHERE id = @new_parent_id;
    END

    DECLARE @old_depth SMALLINT;
    SELECT @old_depth = depth FROM dbo.Product_Categories WHERE id = @category_id;

    DECLARE @delta INT = @new_depth - @old_depth;

    -- Update the moved node
    UPDATE dbo.Product_Categories
    SET parent_id = @new_parent_id,
        depth = @new_depth,
        updated_at = SYSUTCDATETIME()
    WHERE id = @category_id;

    -- Update depths for all descendants (starting from direct children)
    ;WITH subtree AS (
      SELECT id, depth FROM dbo.Product_Categories WHERE parent_id = @category_id
      UNION ALL
      SELECT c.id, c.depth
      FROM dbo.Product_Categories c
      INNER JOIN subtree s ON c.parent_id = s.id
    )
    UPDATE pc
    SET depth = pc.depth + @delta,
        updated_at = SYSUTCDATETIME()
    FROM dbo.Product_Categories pc
    INNER JOIN subtree s ON pc.id = s.id;

    COMMIT TRAN;

    -- Return summary
    SELECT @category_id AS moved_id, @new_parent_id AS new_parent_id, @new_depth AS new_depth;

  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0
      ROLLBACK TRAN;

    DECLARE @errnum INT = ERROR_NUMBER();
    DECLARE @errmsg NVARCHAR(4000) = ERROR_MESSAGE();

    RAISERROR('Move failed: %s (Err %d)', 16, 1, @errmsg, @errnum);
    RETURN;
  END CATCH
END
GO
