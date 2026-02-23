using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketpalce.Repository.Repositories.ProductRepo;
using Marketpalce.Repository.Repositories.StaticValueReop;
using Marketpalce.Repository.Repositories.UserReop;
using Marketplace.Api.Services.Company;
using Marketplace.Api.Services.EmailService;
using Marketplace.Api.Services.FacebookToken;
using Marketplace.Api.Services.FcmNotificationService;
using Marketplace.Api.Services.GoogleTokenVerifier;
using Marketplace.Api.Services.Hassing;
using Marketplace.Api.Services.Helper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.Data;
using System.Reflection;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

// --- DB Connection (SCOPED so same connection + transaction can be shared per request) ---
var connectionString = configuration.GetConnectionString("DefaultConnection")
                       ?? throw new InvalidOperationException("DefaultConnection not configured");
builder.Services.AddScoped<IDbConnection>(_ => new SqlConnection(connectionString));

// --- Password hasher: register custom PBKDF2+SHA256 hasher (or swap to default if desired) ---
builder.Services.AddSingleton(typeof(IPasswordHasher<>), typeof(CustomPasswordHasher<>));

// --- Repositories ---
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IStaticValueRepository, StaticValueRepository>();
builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICompanyTypeRepository, CompanyTypeRepository>();

// --- Services ---
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IGoogleTokenVerifier, GoogleTokenVerifier>();
// Register Facebook verifier
builder.Services.AddScoped<IFcmNotificationService, FcmNotificationService>();
builder.Services.AddScoped<IFacebookTokenVerifier, FacebookTokenVerifier>();
builder.Services.AddScoped<ICompanyTypeService, CompanyTypeService>();
builder.Services.AddTransient<IEmailService, EmailService>();

// --- HttpClient for Facebook Graph API ---
builder.Services.AddHttpClient("facebook", client =>
{
    client.BaseAddress = new Uri("https://graph.facebook.com/");
    client.Timeout = TimeSpan.FromSeconds(10);
});

// --- Authentication (JWT) configuration ---
var jwtSection = configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key") ?? throw new InvalidOperationException("Jwt:Key not configured");
var jwtIssuer = jwtSection.GetValue<string>("Issuer");
var jwtAudience = jwtSection.GetValue<string>("Audience");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = !string.IsNullOrEmpty(jwtIssuer),
        ValidIssuer = jwtIssuer,
        ValidateAudience = !string.IsNullOrEmpty(jwtAudience),
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true,
        RoleClaimType = ClaimTypes.Role,
    };
});

// --- Require authentication globally by default (AuthController endpoints should use [AllowAnonymous]) ---
var requireAuthenticatedPolicy = new AuthorizationPolicyBuilder()
    .RequireAuthenticatedUser()
    .Build();

if (FirebaseApp.DefaultInstance == null)
{
    FirebaseApp.Create(new AppOptions()
    {
        Credential = GoogleCredential.FromFile("nepaldist-3c2b5-firebase-adminsdk-fbsvc-c3d02a4065.json")
    });
}
builder.Services.AddControllers(options =>
{
    // Apply global authorize filter - controllers can opt-out using [AllowAnonymous]
    options.Filters.Add(new AuthorizeFilter(requireAuthenticatedPolicy));
});

// --- Swagger/OpenAPI with JWT support ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Marketplace API", Version = "v1" });

    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Enter 'Bearer {token}'",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    c.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });

    // Include XML comments if available
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (System.IO.File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
});

// --- CORS (adjust for production origins) ---
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// Developer exception page (only in Development)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Add DelegateHaldelerMiddleware early so it wraps the rest of the pipeline.
// This middleware captures response and can wrap into ApiResponse or log, timing, etc.
app.UseMiddleware<DelegateHaldelerMiddleware>();

// Redirect root to swagger UI
app.MapGet("/", () => Results.Redirect("/swagger"));

// Expose swagger UI and JSON (place Swagger middleware before auth so the UI and JSON are accessible without JWT)
// If you want swagger protected, move these calls after UseAuthentication/UseAuthorization.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Marketplace API v1");
    c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.None);
});

// CORS, Routing, Auth
app.UseCors();

app.UseRouting();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers (controllers can use [AllowAnonymous] for endpoints that don't require auth)
app.MapControllers();

app.Run();