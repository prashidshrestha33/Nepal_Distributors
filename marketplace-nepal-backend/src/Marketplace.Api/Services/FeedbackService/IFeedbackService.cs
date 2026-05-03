using Marketplace.Model.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Marketplace.Api.Services.FeedbackService
{
    public interface IFeedbackService
    {
        Task<long> CreateFeedbackAsync(Feedback feedback);
        Task<IEnumerable<Feedback>> GetAllFeedbacksAsync();
        Task<Feedback> GetFeedbackByIdAsync(long id);
        Task<IEnumerable<StaticValue>> GetCategoriesAsync();
    }
}
