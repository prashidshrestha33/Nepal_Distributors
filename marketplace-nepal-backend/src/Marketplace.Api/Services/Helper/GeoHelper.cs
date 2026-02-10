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
        public static GeoPoints? ParseGeoPoint(string wkt)
        {
            if (string.IsNullOrWhiteSpace(wkt)) return null;

            var match = Regex.Match(wkt, @"POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)", RegexOptions.IgnoreCase);
            if (!match.Success) return null;

            return new GeoPoints
            {
                Lng = double.Parse(match.Groups[1].Value),
                Lat = double.Parse(match.Groups[2].Value)
            };
        }
    }

 
}
