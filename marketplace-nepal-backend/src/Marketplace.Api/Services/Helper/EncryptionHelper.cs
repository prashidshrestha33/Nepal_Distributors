
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
namespace Marketplace.Api.Services.EmailService
{
    public static class EncryptionHelper
    {
        // STORE THESE IN appsettings.json (IMPORTANT)
        private static readonly string Key = "9FvA8kZ1Wm4R2T0YpE6HnLJxqB5CSDU7";
        private static readonly string IV = "A9xT3QW2L7KZ8M0P";

        public static string Encrypt<T>(T data)
        {
            var json = JsonSerializer.Serialize(data);
            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(Key);
            aes.IV = Encoding.UTF8.GetBytes(IV);

            var encryptor = aes.CreateEncryptor();
            var bytes = Encoding.UTF8.GetBytes(json);
            var encrypted = encryptor.TransformFinalBlock(bytes, 0, bytes.Length);

            return Convert.ToBase64String(encrypted);
        }

        public static T Decrypt<T>(string encryptedText)
        {
            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(Key);
            aes.IV = Encoding.UTF8.GetBytes(IV);

            var decryptor = aes.CreateDecryptor();
            var bytes = Convert.FromBase64String(encryptedText);
            var decrypted = decryptor.TransformFinalBlock(bytes, 0, bytes.Length);

            var json = Encoding.UTF8.GetString(decrypted);
            // Handle plain string or JSON
            if (typeof(T) == typeof(string))
            {
                return (T)(object)json; // raw string
            }

            // If T is something else, try JSON deserialization
            try
            {
                return JsonSerializer.Deserialize<T>(json);
            }
            catch (JsonException)
            {
                // If it fails, maybe T is a primitive type like int
                return (T)Convert.ChangeType(json, typeof(T));
            }
        }
    }
}