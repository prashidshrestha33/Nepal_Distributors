using System.Security.Claims;

namespace Marketplace.Api.Services.Helper
{
    public static class ClaimsHelper
    {
        /// <summary>
        /// Gets the value of a claim by name from the given ClaimsPrincipal.
        /// </summary>
        /// <param name="user">The ClaimsPrincipal (e.g., HttpContext.User).</param>
        /// <param name="claimName">The name of the claim to retrieve.</param>
        /// <returns>The claim value if found; otherwise, null.</returns>
        public static string? GetClaimValue(this ClaimsPrincipal user, string claimName)
        {
            if (user == null || string.IsNullOrWhiteSpace(claimName))
                return null;

            var claim = user.FindFirst(claimName);
            return claim?.Value;
        }
    }
}
