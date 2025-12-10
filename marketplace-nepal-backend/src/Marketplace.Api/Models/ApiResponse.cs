namespace Marketplace.Api.Models
{
    public class Reasult
    {
        public int code { get; set; }
        public string Message { get; set; }
        public string details { get; set; }
    };
    public class ApiResponse
    {
        public int StatusCode { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
        public object Result { get; set; }
        public IEnumerable<string> Errors { get; set; }

        public static ApiResponse Create(int statusCode, object result = null, string message = null, IEnumerable<string> errors = null)
        {
            return new ApiResponse
            {
                StatusCode = statusCode,
                Success = statusCode >= 200 && statusCode < 300,
                Message = message,
                Result = result,
                Errors = errors
            };
        }

        public static ApiResponse Ok(object result = null, string message = "OK") => Create(200, result, message);
        public static ApiResponse Created(object result = null, string message = "Created") => Create(201, result, message);
        public static ApiResponse BadRequest(IEnumerable<string> errors = null, string message = "Bad Request") => Create(400, null, message, errors);
        public static ApiResponse NotFound(string message = "Not Found") => Create(404, null, message);
        public static ApiResponse Conflict(string message = "Conflict") => Create(409, null, message);
        public static ApiResponse Error(string message = "An error occurred", IEnumerable<string> errors = null) => Create(500, null, message, errors);

    }    // Generic wrapper
    public class ApiResponse<T>
    {
        public int StatusCode { get; set; }
        public bool Success => StatusCode >= 200 && StatusCode < 300;
        public string Message { get; set; }
        public T Result { get; set; }
        public IEnumerable<string> Errors { get; set; }

        public static ApiResponse<T> Create(int statusCode, T result = default, string message = null, IEnumerable<string> errors = null)
        {
            return new ApiResponse<T>
            {
                StatusCode = statusCode,
                Message = message,
                Result = result,
                Errors = errors
            };
        }

        public static ApiResponse<T> Ok(T result = default, string message = "OK") => Create(200, result, message);
        public static ApiResponse<T> Created(T result = default, string message = "Created") => Create(201, result, message);
        public static ApiResponse<T> BadRequest(IEnumerable<string> errors = null, string message = "Bad Request") => Create(400, default, message, errors);
        public static ApiResponse<T> NotFound(string message = "Not Found") => Create(404, default, message);
        public static ApiResponse<T> Conflict(string message = "Conflict") => Create(409, default, message);
        public static ApiResponse<T> Error(string message = "An error occurred", IEnumerable<string> errors = null) => Create(500, default, message, errors);
    }
}
