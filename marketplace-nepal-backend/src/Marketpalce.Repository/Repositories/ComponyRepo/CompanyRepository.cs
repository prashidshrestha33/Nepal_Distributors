using Dapper;
using Marketplace.Models;
using System.Collections.Generic;
using System.ComponentModel.Design;
using System.Data;
using System.Transactions;

namespace Marketpalce.Repository.Repositories.ComponyRepo
{
    public class CompanyRepository : ICompanyRepository
    {
        private readonly IDbConnection _db;
        public CompanyRepository(IDbConnection db) => _db = db;

        public async Task<long> CreateAsync(Company company, IDbTransaction? transaction = null)
        {
            try
            {
                const string sql = @"
                INSERT INTO dbo.companies (name, contact_person, mobile_phone, landline_phone, registration_document, company_type, status, user_type, credits, tier, location, google_map_location, created_at, updated_at, approve_dt, approve_ts)
                OUTPUT INSERTED.id
                VALUES (@Name, @ContactPerson, @MobilePhone, @LandlinePhone, @RegistrationDocument, @CompanyType, @Status, @UserType, @Credits, @Tier, @Location, @GoogleMapLocation, SYSUTCDATETIME(), SYSUTCDATETIME(), @ApproveDt, SYSUTCDATETIME());";

                var id = await _db.QuerySingleAsync<long>(sql, new
                {
                    company.Name,
                    ContactPerson = company.ContactPerson,
                    MobilePhone = company.MobilePhone,
                    LandlinePhone = company.LandlinePhone,
                    RegistrationDocument = company.RegistrationDocument,
                    CompanyType = company.CompanyType,
                    Status = company.Status ?? "active",
                    UserType = company.UserType,
                    Credits = company.Credits,
                    Tier = company.Tier,
                    Location = company.Location,
                    // Pass WKT string for geography column
                    GoogleMapLocation = company.GoogleMapLocationpoint != null
                        ? $"POINT({company.GoogleMapLocationpoint.Lng} {company.GoogleMapLocationpoint.Lat})"
                        : null,
                    ApproveDt = company.ApproveDt
                }, transaction: transaction);

                return id;
            }
            catch (Exception ex)
            {
                string message = ex.Message;
                // Log the exception (you can use any logging framework you prefer)
                Console.WriteLine($"Error creating company: {ex.Message}");
                throw; // Re-throw the exception after logging it
            }
        }
        public async Task<Company?> GetByIdAsync(long id)
        {
            const string sql = @"
SELECT TOP (1)
  id AS Id,
  name AS Name,
  contact_person AS ContactPerson,
  mobile_phone AS MobilePhone,
  landline_phone AS LandlinePhone,
  registration_document AS RegistrationDocument,
  company_type AS CompanyType,
  status AS Status,
  user_type AS UserType,
  credits AS Credits,
  tier AS Tier,
  location AS Location,
   CAST(google_map_location AS NVARCHAR(MAX)) AS GoogleMapLocation,
  created_at AS CreatedAt,
  updated_at AS UpdatedAt
FROM dbo.companies
WHERE id = @Id;";

            return await _db.QueryFirstOrDefaultAsync<Company>(sql, new { Id = id });
        }

        public async Task<IEnumerable<Company>> ListAsync(int page = 1, int pageSize = 50)
        {
            try
            {
                const string sql = @"SELECT id AS Id, name AS Name,Contact_Person as ContactPerson,Mobile_Phone as MobilePhone,Landline_Phone as LandlinePhone,
        company_type AS CompanyType, registration_document AS RegistrationDocument,user_type as UserType,Credits,
       location AS Location, status AS status, created_at AS CreatedAt, updated_at AS UpdatedAt
FROM dbo.companies
ORDER BY id 
OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY;";

                return await _db.QueryAsync<Company>(sql, new { Skip = (page - 1) * pageSize, Take = pageSize });
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public async Task<bool> ApprovecompaniesAsync(long companieId, string approvedBy, string details, IDbTransaction? transaction = null)
        {
            try
            {
                const string approveSql = @"
                UPDATE dbo.companies
                SET
                    approve_dt = SYSUTCDATETIME(),
                    approve_fg = 1,
                    updated_at = SYSUTCDATETIME()
                WHERE
                    id = @Id;
                ";

                var approveRows = await _db.ExecuteAsync(approveSql, new { Id = companieId }, transaction);

                if (approveRows > 0)
                {
                    await UserLogRepository.LogUserActionAsync(_db, companieId, "approve", details, approvedBy, transaction);
                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }
        public async Task<long> AssignCategoryAsync(long CategoryId, long companyId)
        {
            try
            {
                const string sql = @"
        INSERT INTO dbo.companies_category_assigned
            (category_id, company_id, created_at, updated_at, push_notificaion)
        OUTPUT INSERTED.id
        VALUES
            (@CategoryId, @CompanyId, SYSUTCDATETIME(), SYSUTCDATETIME(), @PushNotification);";

                var id = await _db.ExecuteAsync(sql, new
                {
                    CategoryId = CategoryId,
                    CompanyId = companyId,
                    PushNotification = "N"
                });

                return id;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error assigning category: {ex.Message}");
                throw;
            }
        }
        public async Task<(int totalRows, List<string> emails)> ApproveCompanyAsync(
     long companyId,
     string approveFg,
     string rejectComment)
        {
            try
            {
                // 1️⃣ Update companies table
                const string sqlCompany = @"
        UPDATE dbo.companies
        SET 
            approve_ts = SYSDATETIME(),
            approve_fg = @ApproveFg,
            updated_at = SYSDATETIME(),
            reject_comment = @RejectComment
        WHERE id = @CompanyId;";

                var companyRows = await _db.ExecuteAsync(sqlCompany, new
                {
                    CompanyId = companyId,
                    ApproveFg = approveFg,
                    RejectComment = rejectComment
                });
                // 2️⃣ Update users table
                const string sqlUsers = @"
        UPDATE dbo.users
        SET 
            approve_dt = SYSDATETIME(),
            approve_fg = @ApproveFg,
            updated_at = SYSDATETIME()
        WHERE company_id = @CompanyId;";

                var userRows = await _db.ExecuteAsync(sqlUsers, new
                {
                    CompanyId = companyId,
                    ApproveFg = approveFg
                });

                // 3️⃣ Select emails of users with role 'Cadmin'
                const string sqlEmails = @"
        SELECT email 
        FROM dbo.users
        WHERE company_id = @CompanyId
          AND role = 'Cadmin';";

                var emails = (await _db.QueryAsync<string>(sqlEmails, new { CompanyId = companyId })).ToList();

                // Return total affected rows and emails
                return (companyRows + userRows, emails);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error approving company and users: {ex.Message}");
                throw;
            }
        }

        public async Task<CompanyDetailDto?> GetCompanyDetailAsync(long companyId)
        {
            const string sql = @"
    SELECT 
        id AS Id,
        name AS Name,
        contact_person AS ContactPerson,
        mobile_phone AS MobilePhone,
        landline_phone AS LandlinePhone,
        company_type AS CompanyType,
        status AS Status,
        user_type AS UserType,
        credits AS Credits,
        tier AS Tier,
        location AS Location,
        CAST(google_map_location AS NVARCHAR(MAX)) AS GoogleMapLocation
    FROM dbo.companies
    WHERE id = @CompanyId;";

            return await _db.QueryFirstOrDefaultAsync<CompanyDetailDto>(
                sql,
                new { CompanyId = companyId }
            );
        }
        public async Task<bool> UpdateCompanyFieldAsync(UpdateCompanyFieldRequest request)
        {
            string sql = request.FieldName switch
            {
                "Name" => "UPDATE dbo.companies SET name = @Value, updated_at = SYSUTCDATETIME() WHERE id = @Id",
                "ContactPerson" => "UPDATE dbo.companies SET contact_person = @Value, updated_at = SYSUTCDATETIME() WHERE id = @Id",
                "MobilePhone" => "UPDATE dbo.companies SET mobile_phone = @Value, updated_at = SYSUTCDATETIME() WHERE id = @Id",
                "LandlinePhone" => "UPDATE dbo.companies SET landline_phone = @Value, updated_at = SYSUTCDATETIME() WHERE id = @Id",
                "Tier" => "UPDATE dbo.companies SET tier = @Value, updated_at = SYSUTCDATETIME() WHERE id = @Id",
                "Location" => "UPDATE dbo.companies SET location = @Value, updated_at = SYSUTCDATETIME() WHERE id = @Id",
                "Status" => "UPDATE dbo.companies SET status = @Value, updated_at = SYSUTCDATETIME() WHERE id = @Id",
                _ => null
            };

            if (sql == null)
                return false;

            var rows = await _db.ExecuteAsync(sql, new
            {
                Value = request.FieldValue,
                Id = request.CompanyId
            });

            if (rows > 0)
            {
                await UserLogRepository.LogUserActionAsync(
                    _db,
                    request.CompanyId,
                    "update-company-field",
                    $"{request.FieldName} updated",
                    request.UpdatedBy
                );
                return true;
            }

            return false;
        }

        public Task<bool> UpdateAsync(UpdateCompanyFieldRequest request)
        {
            throw new NotImplementedException();
        }

        public async Task<long> UpdateCompanyAsync(Company company)
        {
            try
            {
                const string sql = @"
UPDATE dbo.companies
SET
    name = ISNULL(@Name, name),
    contact_person = ISNULL(@ContactPerson, contact_person),
    mobile_phone = ISNULL(@MobilePhone, mobile_phone),
    landline_phone = ISNULL(@LandlinePhone, landline_phone),
    registration_document = ISNULL(@RegistrationDocument, registration_document),
    company_type = ISNULL(@CompanyType, company_type),
    status = ISNULL(@Status, status),
    credits = ISNULL(@Credits, credits),
    tier = ISNULL(@Tier, tier),
    location = ISNULL(@Location, location),
    google_map_location = CASE 
        WHEN @GoogleMapLocation IS NOT NULL THEN geography::STGeomFromText(@GoogleMapLocation, 4326) 
        ELSE google_map_location 
    END,
    updated_at = SYSUTCDATETIME(),
    approve_dt = ISNULL(@ApproveDt, approve_dt),
    approve_ts = SYSUTCDATETIME()
WHERE id = @CompanyId;
";

                // Generate WKT string safely
                string googleMapWKT = null;
                if (company.GoogleMapLocationpoint != null)
                {
                    googleMapWKT = $"POINT({company.GoogleMapLocationpoint.Lng.ToString(System.Globalization.CultureInfo.InvariantCulture)} {company.GoogleMapLocationpoint.Lat.ToString(System.Globalization.CultureInfo.InvariantCulture)})";
                }

                return await _db.ExecuteAsync(sql, new
                {
                    Name = company.Name,
                    CompanyId = company.Componeyid,
                    ContactPerson = company.ContactPerson,
                    MobilePhone = company.MobilePhone,
                    LandlinePhone = company.LandlinePhone,
                    RegistrationDocument = company.RegistrationDocument,
                    CompanyType = company.CompanyType,
                    Status = company.Status ?? "active",
                    UserType = company.UserType,
                    Credits = company.Credits,
                    Tier = company.Tier,
                    Location = company.Location,
                    GoogleMapLocation = googleMapWKT, // <-- properly formatted
                    ApproveDt = company.ApproveDt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating company: {ex.Message}");
                throw;
            }
        }


    }
}