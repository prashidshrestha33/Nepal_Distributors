using Marketpalce.Repository.Repositories.FeedbackRepo;
using Marketplace.Model.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Marketplace.Api.Services.FeedbackService
{
    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackRepository _feedbackRepository;

        public FeedbackService(IFeedbackRepository feedbackRepository)
        {
            _feedbackRepository = feedbackRepository;
        }

        public async Task<long> CreateFeedbackAsync(Feedback feedback)
        {
            return await _feedbackRepository.CreateAsync(feedback);
        }

        public async Task<IEnumerable<Feedback>> GetAllFeedbacksAsync()
        {
            return await _feedbackRepository.GetAllAsync();
        }

        public async Task<Feedback> GetFeedbackByIdAsync(long id)
        {
            return await _feedbackRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<StaticValue>> GetCategoriesAsync()
        {
            return await _feedbackRepository.GetCategoriesAsync();
        }
    }
}
