using Marketplace.Model.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.FeedbackRepo
{
    public interface IFeedbackRepository
    {
        Task<long> CreateAsync(Feedback feedback);
        Task<IEnumerable<Feedback>> GetAllAsync();
        Task<Feedback> GetByIdAsync(long id);
        Task<IEnumerable<StaticValue>> GetCategoriesAsync();
    }
}
