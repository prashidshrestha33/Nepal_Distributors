using System.Data;
using Dapper;
using Marketplace.Api.Models;
using System.Collections.Generic;

namespace Marketplace.Repository
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
                    GoogleMapLocation = "POINT(85.3240 27.7172)",
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
  google_map_location AS GoogleMapLocation,
  created_at AS CreatedAt,
  updated_at AS UpdatedAt,
  approve_dt AS ApproveDt,
  approve_ts AS ApproveTs
FROM dbo.companies
WHERE id = @Id;";

            return await _db.QueryFirstOrDefaultAsync<Company>(sql, new { Id = id });
        }

        public async Task<IEnumerable<Company>> ListAsync(int page = 1, int pageSize = 50)
        {
            const string sql = @"
SELECT id AS Id, name AS Name, company_type AS CompanyType, registration_document AS RegistrationDocument,
       location AS Location, google_map_location AS GoogleMapLocation, created_at AS CreatedAt, updated_at AS UpdatedAt
FROM dbo.companies
ORDER BY id
OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY;";

            return await _db.QueryAsync<Company>(sql, new { Skip = (page - 1) * pageSize, Take = pageSize });
        }
    }
}