using System;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;

namespace Marketplace.Api.Services.Hassing
{
    // PBKDF2 (Rfc2898) using HMAC-SHA256
    // Format: v1.{iter}.{salt-base64}.{subkey-base64}
    public class CustomPasswordHasher<TUser> : IPasswordHasher<TUser> where TUser : class
    {
        private const int SaltSize = 16; // 128-bit salt
        private const int SubkeySize = 32; // 256-bit subkey
        private const int DefaultIter = 100_000; // recommended starting iteration count

        private readonly int _iterationCount;

        public CustomPasswordHasher(int iterationCount = DefaultIter)
        {
            if (iterationCount <= 0) throw new ArgumentOutOfRangeException(nameof(iterationCount));
            _iterationCount = iterationCount;
        }

        public string HashPassword(TUser user, string password)
        {
            if (password == null) throw new ArgumentNullException(nameof(password));

            var salt = new byte[SaltSize];
            RandomNumberGenerator.Fill(salt);

            byte[] subkey;
            using (var deriveBytes = new Rfc2898DeriveBytes(password, salt, _iterationCount, HashAlgorithmName.SHA256))
            {
                subkey = deriveBytes.GetBytes(SubkeySize);
            }

            var saltB64 = Convert.ToBase64String(salt);
            var subkeyB64 = Convert.ToBase64String(subkey);

            // versioned format
            return $"v1.{_iterationCount}.{saltB64}.{subkeyB64}";
        }

        public PasswordVerificationResult VerifyHashedPassword(TUser user, string hashedPassword, string providedPassword)
        {
            if (hashedPassword == null) throw new ArgumentNullException(nameof(hashedPassword));
            if (providedPassword == null) throw new ArgumentNullException(nameof(providedPassword));

            // Expected format: v1.iter.salt.subkey
            var parts = hashedPassword.Split('.');
            if (parts.Length != 4 || parts[0] != "v1")
            {
                // Unknown format - can't verify
                return PasswordVerificationResult.Failed;
            }

            if (!int.TryParse(parts[1], out var iter))
            {
                return PasswordVerificationResult.Failed;
            }

            byte[] salt, expectedSubkey;
            try
            {
                salt = Convert.FromBase64String(parts[2]);
                expectedSubkey = Convert.FromBase64String(parts[3]);
            }
            catch
            {
                return PasswordVerificationResult.Failed;
            }

            byte[] actualSubkey;
            using (var deriveBytes = new Rfc2898DeriveBytes(providedPassword, salt, iter, HashAlgorithmName.SHA256))
            {
                actualSubkey = deriveBytes.GetBytes(expectedSubkey.Length);
            }

            // Constant time comparison
            if (!FixedTimeEquals(actualSubkey, expectedSubkey))
                return PasswordVerificationResult.Failed;

            // If iteration count is less than configured, signal rehash needed
            if (iter < _iterationCount)
                return PasswordVerificationResult.SuccessRehashNeeded;

            return PasswordVerificationResult.Success;
        }

        private static bool FixedTimeEquals(byte[] a, byte[] b)
        {
            if (a.Length != b.Length) return false;
            int diff = 0;
            for (int i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
            return diff == 0;
        }
    }
}