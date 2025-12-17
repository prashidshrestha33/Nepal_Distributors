import { Injectable } from '@angular/core';

/**
 * RegistrationDocumentService
 * Manages the registration document content (e.g., Terms & Conditions, Guidelines)
 * Provides scalable solution for document management
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationDocumentService {
  
  /**
   * Get the registration guidelines/terms document content
   * Returns HTML string for display
   * Can be extended to fetch from API or external source
   */
  getDocumentContent(): string {
    return `
      <div class="registration-document-content">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Registration Guidelines</h3>
        
        <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <section>
            <h4 class="font-semibold mb-2 text-gray-800 dark:text-white">1. Company Information</h4>
            <p>Please ensure that all company information provided is accurate and up-to-date. This information will be used to identify your company in our system.</p>
            <ul class="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Company name should match your official registration documents</li>
              <li>Contact person must be an authorized representative</li>
              <li>Phone numbers should be verified and active</li>
            </ul>
          </section>

          <section>
            <h4 class="font-semibold mb-2 text-gray-800 dark:text-white">2. Documentation Requirements</h4>
            <p>You must provide a valid registration document from your company. Accepted formats include:</p>
            <ul class="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Certificate of Registration</li>
              <li>Business License</li>
              <li>Articles of Association</li>
              <li>Other official government documents</li>
            </ul>
          </section>

          <section>
            <h4 class="font-semibold mb-2 text-gray-800 dark:text-white">3. Location Information</h4>
            <p>The Google Map location must accurately represent your company's operational address. This helps our system locate and verify your business.</p>
          </section>

          <section>
            <h4 class="font-semibold mb-2 text-gray-800 dark:text-white">4. Terms & Conditions</h4>
            <p>By registering your company with Nepal Distributors, you agree to:</p>
            <ul class="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Provide accurate and truthful information</li>
              <li>Maintain the confidentiality of your account</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Update your information promptly if changes occur</li>
            </ul>
          </section>

          <section>
            <h4 class="font-semibold mb-2 text-gray-800 dark:text-white">5. Data Privacy</h4>
            <p>Your company information will be stored securely and used only for operational purposes. We are committed to protecting your data in accordance with applicable privacy laws.</p>
          </section>

          <section>
            <h4 class="font-semibold mb-2 text-gray-800 dark:text-white">6. Verification Process</h4>
            <p>After submission, our team will verify your company information. This process typically takes 1-3 business days. You will be notified via email once verification is complete.</p>
          </section>

          <section>
            <h4 class="font-semibold mb-2 text-gray-800 dark:text-white">7. Support & Assistance</h4>
            <p>If you have any questions or need assistance during the registration process, please contact our support team at support@nepaldistributors.com</p>
          </section>
        </div>

        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-900 dark:text-blue-200">
            <strong>Note:</strong> This is Step 1 of 3. After completing company registration, you will proceed to user registration and document upload.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get document title
   */
  getDocumentTitle(): string {
    return 'Registration Guidelines & Terms';
  }

  /**
   * Alternative method to get document as plain text
   */
  getDocumentAsText(): string {
    return `
REGISTRATION GUIDELINES

1. Company Information
   - Ensure all company information is accurate and up-to-date
   - Company name should match official registration documents
   - Contact person must be an authorized representative
   - Phone numbers should be verified and active

2. Documentation Requirements
   - Certificate of Registration
   - Business License
   - Articles of Association
   - Other official government documents

3. Location Information
   - Google Map location must accurately represent your company's operational address

4. Terms & Conditions
   - Provide accurate and truthful information
   - Maintain confidentiality of your account
   - Comply with all applicable laws and regulations
   - Update information promptly if changes occur

5. Data Privacy
   - Information stored securely and used only for operational purposes
   - Committed to protecting your data in accordance with privacy laws

6. Verification Process
   - Typically takes 1-3 business days
   - Will be notified via email once verification is complete

7. Support & Assistance
   - Contact support@nepaldistributors.com for help
    `;
  }
}
