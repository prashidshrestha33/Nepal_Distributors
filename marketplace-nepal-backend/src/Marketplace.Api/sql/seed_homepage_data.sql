-- Check and insert AboutUs Catalog
IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'AboutUs')
BEGIN
    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
    VALUES ('AboutUs', 'Homepage', 'Company introduction on the homepage', 'About Us', 'Image URL', 'Description');
END

-- Check and insert HeroBanners Catalog
IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'HeroBanners')
BEGIN
    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
    VALUES ('HeroBanners', 'Homepage', 'Banners sliding at the top of the homepage', 'Hero Banners', 'Image URL', 'Caption');
END

-- Check and insert Services Catalog
IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'Services')
BEGIN
    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
    VALUES ('Services', 'Homepage', 'Our specialized B2B services', 'Why Choose Us', 'Service Title', 'Service Details');
END

-- Check and insert ContactInfo Catalog
IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'ContactInfo')
BEGIN
    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
    VALUES ('ContactInfo', 'Homepage', 'Contact and social media details', 'Contact Info', 'Platform/Field', 'Value');
END

-- Now insert values for each
DECLARE @AboutUsId INT = (SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'AboutUs');
DECLARE @HeroId INT = (SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'HeroBanners');
DECLARE @ServicesId INT = (SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'Services');
DECLARE @ContactId INT = (SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'ContactInfo');

-- AboutUs default values
IF NOT EXISTS (SELECT 1 FROM dbo.static_value WHERE Catalog_id = @AboutUsId)
BEGIN
    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
    VALUES (@AboutUsId, 'https://images.unsplash.com/photo-1573164713988-8695df143605?q=80&w=1200', 'Nepal Distributors is the premier B2B trading directory and wholesale marketplace in Nepal. We empower importers, manufacturers, wholesalers, and retailers to establish digital presence, discover validated leads, trade without intermediaries, and expand nationwide.', 1);
END

-- Hero Banners default values
IF NOT EXISTS (SELECT 1 FROM dbo.static_value WHERE Catalog_id = @HeroId)
BEGIN
    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
    VALUES 
    (@HeroId, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1920', 'Connect Directly with Nepal''s Top Wholesale Distributors', 1),
    (@HeroId, 'https://images.unsplash.com/photo-1521791136368-1a46827d531a?q=80&w=1920', 'Empowering Importers & Manufacturers with Digital Catalogs', 2);
END

-- Services default values
IF NOT EXISTS (SELECT 1 FROM dbo.static_value WHERE Catalog_id = @ServicesId)
BEGIN
    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
    VALUES 
    (@ServicesId, 'Verified Business Directory', 'Browse verified businesses, manufacturers, and bulk trade partners in Kathmandu and across Nepal.', 1),
    (@ServicesId, 'Zero Commission Trading', 'We do not take a cut from your wholesale orders. Communicate and finalize payments directly with suppliers.', 2),
    (@ServicesId, 'Direct Lead Generation', 'Submit buying requests and receive tailored quotes from validated distributors in minutes.', 3);
END

-- ContactInfo default values
IF NOT EXISTS (SELECT 1 FROM dbo.static_value WHERE Catalog_id = @ContactId)
BEGIN
    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
    VALUES 
    (@ContactId, 'Address', 'Lalitpur & Kathmandu, Nepal', 1),
    (@ContactId, 'Phone', '+977 1-5908221 / 9851234567', 2),
    (@ContactId, 'Email', 'info@nepaldistributors.com', 3),
    (@ContactId, 'Facebook', 'https://facebook.com/nepaldistributors', 4);
END
