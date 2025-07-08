// Popup interface controller
class PopupController {
    constructor() {
        this.currentAnalysis = null;
        this.currentResults = null;
        this.init();
    }
    
    async init() {
        // Load saved API key
        await this.loadAPIKey();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Analyze current page
        await this.analyzeCurrentPage();
    }
    
    setupEventListeners() {
        // API key input
        const apiKeyInput = document.getElementById('apiKeyInput');
        apiKeyInput.addEventListener('input', (e) => {
            this.saveAPIKey(e.target.value);
            this.updateAnalyzeButton();
        });
        
        // Analyze button
        const analyzeButton = document.getElementById('analyzeButton');
        analyzeButton.addEventListener('click', () => {
            this.performAnalysis();
        });
        
        // Export buttons
        const copyButton = document.getElementById('copyButton');
        copyButton.addEventListener('click', () => {
            this.copyResults();
        });
        
        const downloadButton = document.getElementById('downloadButton');
        downloadButton.addEventListener('click', () => {
            this.downloadResults();
        });
    }
    
    async loadAPIKey() {
        const result = await chrome.storage.local.get(['gemini_api_key']);
        if (result.gemini_api_key) {
            document.getElementById('apiKeyInput').value = result.gemini_api_key;
        }
    }
    
    async saveAPIKey(apiKey) {
        await chrome.storage.local.set({ gemini_api_key: apiKey });
    }
    
    async analyzeCurrentPage() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'getPageAnalysis'
            });
            
            this.currentAnalysis = response;
            this.updatePageStatus(response);
            
        } catch (error) {
            console.error('Failed to analyze page:', error);
            this.updatePageStatus({
                isLegalDocument: false,
                confidence: 0,
                reasons: ['Unable to analyze page'],
                pageTitle: 'Unknown',
                documentType: 'Unknown'
            });
        }
    }
    
    updatePageStatus(analysis) {
        const statusIndicator = document.getElementById('statusIndicator');
        const pageStatus = document.getElementById('pageStatus');
        const confidenceScore = document.getElementById('confidenceScore');
        
        if (analysis.isLegalDocument) {
            statusIndicator.classList.add('detected');
            pageStatus.textContent = `${analysis.documentType} detected`;
            confidenceScore.textContent = `Confidence: ${analysis.confidence}% (${analysis.reasons.join(', ')})`;
        } else {
            statusIndicator.classList.remove('detected');
            pageStatus.textContent = 'No legal document detected';
            confidenceScore.textContent = `Confidence: ${analysis.confidence}% - This doesn't appear to be a legal document`;
        }
        
        this.updateAnalyzeButton();
    }
    
    updateAnalyzeButton() {
        const analyzeButton = document.getElementById('analyzeButton');
        const apiKey = document.getElementById('apiKeyInput').value;
        
        const hasApiKey = apiKey && apiKey.trim().length > 0;
        const hasLegalContent = this.currentAnalysis && this.currentAnalysis.isLegalDocument;
        
        if (!hasApiKey) {
            analyzeButton.disabled = true;
            analyzeButton.textContent = 'Enter API Key to Continue';
        } else if (!hasLegalContent) {
            analyzeButton.disabled = true;
            analyzeButton.textContent = 'No Legal Document Detected';
        } else {
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze This Page';
        }
    }
    
    async performAnalysis() {
        const apiKey = document.getElementById('apiKeyInput').value;
        const analyzeButton = document.getElementById('analyzeButton');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        
        // Reset UI
        errorMessage.style.display = 'none';
        resultsSection.style.display = 'none';
        
        // Show loading
        analyzeButton.disabled = true;
        analyzeButton.textContent = 'Analyzing...';
        loadingSpinner.style.display = 'block';
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Extract content
            const contentResponse = await chrome.tabs.sendMessage(tab.id, {
                action: 'extractContent'
            });
            
            if (!contentResponse || !contentResponse.content) {
                throw new Error('Unable to extract content from page');
            }
            
            // Send to background for analysis
            const analysisResponse = await chrome.runtime.sendMessage({
                action: 'analyzeContent',
                content: contentResponse.content,
                apiKey: apiKey
            });
            
            if (!analysisResponse.success) {
                throw new Error(analysisResponse.error || 'Analysis failed');
            }
            
            // Display results
            this.displayResults(analysisResponse.result);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(error.message);
        } finally {
            // Reset UI
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze This Page';
            loadingSpinner.style.display = 'none';
        }
    }
    
    displayResults(results) {
        const resultsSection = document.getElementById('resultsSection');
        const resultContent = document.getElementById('resultContent');
        const exportButtons = document.getElementById('exportButtons');
        
        this.currentResults = results;
        
        // Format and display results
        resultContent.textContent = results;
        resultsSection.style.display = 'block';
        exportButtons.style.display = 'flex';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    copyResults() {
        if (!this.currentResults) return;
        
        const textArea = document.createElement('textarea');
        textArea.value = this.formatResultsForExport();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show feedback
        const copyButton = document.getElementById('copyButton');
        const originalText = copyButton.textContent;
        copyButton.textContent = '✓ Copied';
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
    }
    
    downloadResults() {
        if (!this.currentResults) return;
        
        const content = this.formatResultsForExport();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tc-analysis-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show feedback
        const downloadButton = document.getElementById('downloadButton');
        const originalText = downloadButton.textContent;
        downloadButton.textContent = '✓ Downloaded';
        setTimeout(() => {
            downloadButton.textContent = originalText;
        }, 2000);
    }
    
    formatResultsForExport() {
        const header = `T&C ANALYZER - AI ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
Page: ${this.currentAnalysis?.pageTitle || 'Unknown'}
URL: ${this.currentAnalysis?.pageUrl || 'Unknown'}
Document Type: ${this.currentAnalysis?.documentType || 'Unknown'}
Confidence: ${this.currentAnalysis?.confidence || 0}%

========================================

`;
        
        return header + this.currentResults;
    }
}

// Initialize popup controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});