// Background service worker for handling API requests
class GeminiAPIHandler {
    constructor() {
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
        this.rateLimitDelay = 1000; // 1 second between requests
        this.dailyLimit = 1000; // Conservative daily limit
        this.lastRequestTime = 0;
        
        this.init();
    }
    
    init() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'analyzeContent') {
                this.handleAnalysisRequest(request.content, request.apiKey, sendResponse);
                return true; // Keep message channel open for async response
            }
        });
    }
    
    async handleAnalysisRequest(content, apiKey, sendResponse) {
        try {
            // Rate limiting
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.rateLimitDelay) {
                await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
            }
            this.lastRequestTime = Date.now();
            
            // Check daily usage
            const today = new Date().toDateString();
            const usage = await this.getDailyUsage(today);
            if (usage >= this.dailyLimit) {
                throw new Error('Daily usage limit exceeded. Please try again tomorrow.');
            }
            
            // Prepare the analysis request
            const analysisResult = await this.callGeminiAPI(content, apiKey);
            
            // Update usage counter
            await this.updateDailyUsage(today);
            
            sendResponse({
                success: true,
                result: analysisResult,
                usage: usage + 1
            });
            
        } catch (error) {
            console.error('Analysis failed:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    async callGeminiAPI(content, apiKey) {
        const prompt = this.createAnalysisPrompt(content);
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
        
        const response = await fetch(`${this.apiEndpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid API response format');
        }
        
        return data.candidates[0].content.parts[0].text;
    }
    
    createAnalysisPrompt(content) {
        return `You are a legal document analyzer. Please analyze the following Terms of Service, Privacy Policy, or legal document and provide a comprehensive analysis in the following structured format:

**EXECUTIVE SUMMARY:**
[Provide a 2-3 sentence overview of what this document is and its main purpose]

**DOCUMENT TYPE:**
[Identify the type of legal document - Terms of Service, Privacy Policy, etc.]

**KEY POINTS:**
[List 4-6 main points or clauses that users should be aware of]

**PRIVACY CONCERNS:**
[Highlight any significant privacy-related issues or data collection practices]

**USER OBLIGATIONS:**
[Summarize what users are required to do or not do]

**CONCERNING CLAUSES:**
[Identify any clauses that might be problematic or heavily favor the company]

**RISK ASSESSMENT:**
[Provide a risk level (Low/Medium/High) and explain the reasoning]

**NOTABLE FEATURES:**
[Any unusual or noteworthy aspects of this document]

**RECOMMENDATIONS:**
[Brief advice for users considering this service]

Please make your analysis clear, concise, and accessible to non-lawyers. Focus on practical implications for users.

DOCUMENT TO ANALYZE:
---
${content.content}
---

Title: ${content.title}
URL: ${content.url}
Analysis Date: ${content.extractedAt}`;
    }
    
    async getDailyUsage(date) {
        const result = await chrome.storage.local.get([`usage_${date}`]);
        return result[`usage_${date}`] || 0;
    }
    
    async updateDailyUsage(date) {
        const currentUsage = await this.getDailyUsage(date);
        await chrome.storage.local.set({
            [`usage_${date}`]: currentUsage + 1
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the API handler
new GeminiAPIHandler();