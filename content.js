// Content script for detecting and extracting legal document content
class LegalDocumentDetector {
    constructor() {
        this.legalKeywords = [
            'terms of service', 'terms of use', 'privacy policy', 'user agreement',
            'license agreement', 'end user license', 'acceptable use policy',
            'cookie policy', 'data processing', 'terms and conditions',
            'user terms', 'service terms', 'legal notice', 'disclaimer',
            'data policy', 'privacy notice', 'community guidelines'
        ];
        
        this.legalPhrases = [
            'by using this service', 'by accessing this website', 'you agree to',
            'these terms constitute', 'this agreement is entered into',
            'we collect information', 'personal data', 'cookies and tracking',
            'your rights', 'data retention', 'third party services',
            'liability limitation', 'governing law', 'dispute resolution',
            'termination of service', 'intellectual property', 'user content'
        ];
        
        this.init();
    }
    
    init() {
        this.analyzeCurrentPage();
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getPageAnalysis') {
                const analysis = this.analyzeCurrentPage();
                sendResponse(analysis);
            } else if (request.action === 'extractContent') {
                const content = this.extractLegalContent();
                sendResponse({ content });
            }
        });
    }
    
    analyzeCurrentPage() {
        const pageText = this.getPageText();
        const title = document.title.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        // Calculate confidence score
        let confidence = 0;
        let reasons = [];
        
        // Check URL patterns
        const urlPatterns = [
            'terms', 'privacy', 'policy', 'legal', 'agreement', 'tos', 'eula',
            'conditions', 'guidelines', 'disclaimer', 'cookies'
        ];
        
        for (const pattern of urlPatterns) {
            if (url.includes(pattern)) {
                confidence += 25;
                reasons.push(`URL contains "${pattern}"`);
                break;
            }
        }
        
        // Check title
        for (const keyword of this.legalKeywords) {
            if (title.includes(keyword)) {
                confidence += 30;
                reasons.push(`Title contains "${keyword}"`);
                break;
            }
        }
        
        // Check content keywords
        const lowerPageText = pageText.toLowerCase();
        let keywordMatches = 0;
        
        for (const keyword of this.legalKeywords) {
            if (lowerPageText.includes(keyword)) {
                keywordMatches++;
            }
        }
        
        if (keywordMatches > 0) {
            confidence += Math.min(keywordMatches * 10, 30);
            reasons.push(`Found ${keywordMatches} legal keywords`);
        }
        
        // Check for legal phrases
        let phraseMatches = 0;
        for (const phrase of this.legalPhrases) {
            if (lowerPageText.includes(phrase)) {
                phraseMatches++;
            }
        }
        
        if (phraseMatches > 0) {
            confidence += Math.min(phraseMatches * 5, 25);
            reasons.push(`Found ${phraseMatches} legal phrases`);
        }
        
        // Check document structure
        const hasStructure = this.hasLegalDocumentStructure();
        if (hasStructure) {
            confidence += 20;
            reasons.push('Document has legal structure');
        }
        
        // Cap confidence at 100
        confidence = Math.min(confidence, 100);
        
        const analysis = {
            isLegalDocument: confidence > 50,
            confidence: confidence,
            reasons: reasons,
            pageTitle: document.title,
            pageUrl: window.location.href,
            wordCount: pageText.split(/\s+/).length,
            documentType: this.detectDocumentType(title, lowerPageText)
        };
        
        return analysis;
    }
    
    detectDocumentType(title, content) {
        const types = {
            'Privacy Policy': ['privacy policy', 'privacy notice', 'data policy'],
            'Terms of Service': ['terms of service', 'terms of use', 'user agreement'],
            'Cookie Policy': ['cookie policy', 'cookies notice'],
            'License Agreement': ['license agreement', 'eula', 'end user license'],
            'Acceptable Use Policy': ['acceptable use', 'community guidelines'],
            'Legal Notice': ['legal notice', 'disclaimer', 'legal information']
        };
        
        for (const [type, keywords] of Object.entries(types)) {
            for (const keyword of keywords) {
                if (title.includes(keyword) || content.includes(keyword)) {
                    return type;
                }
            }
        }
        
        return 'Legal Document';
    }
    
    hasLegalDocumentStructure() {
        // Look for typical legal document structure
        const selectors = [
            'h1, h2, h3, h4, h5, h6',
            '[class*="section"]',
            '[class*="clause"]',
            '[class*="term"]',
            'ol, ul',
            'p'
        ];
        
        let structureScore = 0;
        
        // Check for numbered sections
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length > 3) {
            structureScore++;
        }
        
        // Check for lists (common in legal docs)
        const lists = document.querySelectorAll('ol, ul');
        if (lists.length > 2) {
            structureScore++;
        }
        
        // Check for paragraphs
        const paragraphs = document.querySelectorAll('p');
        if (paragraphs.length > 5) {
            structureScore++;
        }
        
        return structureScore >= 2;
    }
    
    getPageText() {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
        scripts.forEach(el => el.remove());
        
        // Get main content
        const mainContent = document.querySelector('main') || 
                           document.querySelector('[role="main"]') || 
                           document.querySelector('.main-content') || 
                           document.querySelector('#main-content') || 
                           document.querySelector('.content') || 
                           document.body;
        
        return mainContent ? mainContent.innerText : document.body.innerText;
    }
    
    extractLegalContent() {
        const content = this.getPageText();
        const analysis = this.analyzeCurrentPage();
        
        // Clean and prepare content
        const cleanContent = content
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n')  // Remove empty lines
            .trim();
        
        // Truncate if too long (for API efficiency)
        const maxLength = 15000; // Adjust based on API limits
        const truncatedContent = cleanContent.length > maxLength ? 
            cleanContent.substring(0, maxLength) + '...' : cleanContent;
        
        return {
            content: truncatedContent,
            title: document.title,
            url: window.location.href,
            analysis: analysis,
            extractedAt: new Date().toISOString()
        };
    }
}

// Initialize the detector
new LegalDocumentDetector();