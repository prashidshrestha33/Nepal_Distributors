using Marketplace.Models;
using System;
using System.Text.RegularExpressions;

namespace Marketplace.Helpers
{
    public static class GeoHelper
    {
        /// <summary>
        /// Converts a WKT "POINT(lng lat)" string to a GeoPoint object.
        /// Returns null if the string is invalid.
        /// </summary>
        public static GeoPoints? ParseGeoPoint(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return null;

            // 1️⃣ Try WKT format first
            var wktMatch = Regex.Match(input, @"POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)", RegexOptions.IgnoreCase);

            if (wktMatch.Success)
            {
                return new GeoPoints
                {
                    Lng = double.Parse(wktMatch.Groups[1].Value),
                    Lat = double.Parse(wktMatch.Groups[2].Value)
                };
            }

            // 2️⃣ Try comma separated format
            var parts = input.Split(',');

            if (parts.Length == 2 &&
                double.TryParse(parts[0], out double lat) &&
                double.TryParse(parts[1], out double lng))
            {
                return new GeoPoints
                {
                    Lat = lat,
                    Lng = lng
                };
            }

            return null;
        }

    }


}
