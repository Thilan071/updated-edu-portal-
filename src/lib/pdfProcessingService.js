class PDFProcessingService {
  /**
   * Extract text content from PDF buffer
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<string>} Extracted text content
   */
  async extractTextFromPDF(pdfBuffer) {
    try {
      console.log('📄 Extracting text from PDF...');
      
      // Use require for CommonJS compatibility
      let pdf;
      try {
        pdf = require('pdf-parse');
      } catch (e) {
        console.log('Falling back to dynamic import...');
        const pdfModule = await import('pdf-parse');
        pdf = pdfModule.default || pdfModule;
      }
      
      if (!pdf) {
        throw new Error('PDF parsing library not available');
      }
      
      console.log('📚 PDF parser loaded successfully');
      const data = await pdf(pdfBuffer);
      const extractedText = data.text;
      
      console.log(`✅ PDF text extracted: ${extractedText.length} characters`);
      
      // Clean up the extracted text
      const cleanedText = this.cleanExtractedText(extractedText);
      
      return cleanedText;
    } catch (error) {
      console.error('❌ Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  /**
   * Clean and format extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanExtractedText(text) {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers (common patterns)
      .replace(/Page \d+/gi, '')
      .replace(/^\d+\s*$/gm, '')
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Clean up punctuation spacing
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.,;:!?])([A-Za-z])/g, '$1 $2')
      // Remove extra newlines
      .replace(/\n\s*\n/g, '\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Extract key sections from academic PDF (like assignments, solutions)
   * @param {string} text - Extracted text
   * @returns {Object} Structured content
   */
  extractAcademicSections(text) {
    const sections = {
      title: '',
      introduction: '',
      methodology: '',
      solution: '',
      conclusion: '',
      references: '',
      fullText: text
    };

    try {
      // Extract title (usually at the beginning)
      const titleMatch = text.match(/^(.{1,100}?)(?:\n|\r)/);
      if (titleMatch) {
        sections.title = titleMatch[1].trim();
      }

      // Look for common academic sections
      const sectionPatterns = {
        introduction: /(?:introduction|overview|background)[\s\S]*?(?=(?:methodology|method|solution|approach|conclusion)|$)/i,
        methodology: /(?:methodology|method|approach|procedure)[\s\S]*?(?=(?:solution|results|conclusion)|$)/i,
        solution: /(?:solution|answer|result|analysis)[\s\S]*?(?=(?:conclusion|references|bibliography)|$)/i,
        conclusion: /(?:conclusion|summary|final)[\s\S]*?(?=(?:references|bibliography)|$)/i,
        references: /(?:references|bibliography|citations)[\s\S]*$/i
      };

      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        const match = text.match(pattern);
        if (match) {
          sections[section] = match[0].trim();
        }
      }

      return sections;
    } catch (error) {
      console.error('Error extracting academic sections:', error);
      return sections;
    }
  }

  /**
   * Generate grading criteria based on PDF content analysis
   * @param {string} text - Extracted text from reference PDF
   * @returns {string} Auto-generated grading criteria
   */
  generateGradingCriteria(text) {
    try {
      const sections = this.extractAcademicSections(text);
      let criteria = [];

      // Basic criteria
      criteria.push('Correctness and accuracy of the solution');
      criteria.push('Completeness of the response');
      criteria.push('Clear explanation and reasoning');

      // Add section-specific criteria based on content
      if (sections.methodology) {
        criteria.push('Appropriate methodology and approach');
      }
      
      if (sections.solution) {
        criteria.push('Quality of problem-solving steps');
        criteria.push('Logical flow and organization');
      }

      if (text.includes('calculation') || text.includes('formula') || text.includes('equation')) {
        criteria.push('Mathematical accuracy and proper formulas');
      }

      if (text.includes('diagram') || text.includes('chart') || text.includes('figure')) {
        criteria.push('Use of appropriate diagrams or visual aids');
      }

      if (text.includes('analysis') || text.includes('interpretation')) {
        criteria.push('Quality of analysis and interpretation');
      }

      criteria.push('Professional presentation and formatting');

      return criteria.join('\n• ');
    } catch (error) {
      console.error('Error generating grading criteria:', error);
      return 'Standard grading criteria: correctness, completeness, clarity, methodology, and presentation.';
    }
  }

  /**
   * Generate a random suggested score between 20 and 100 (exclusive 20, inclusive 100)
   * @param {string} complexity - Complexity level (low, medium, high)
   * @returns {number} Random score with 1 decimal place
   */
  generateRandomScore(complexity) {
    let baseMin, baseMax;
    
    // Set ranges based on complexity
    switch (complexity) {
      case 'high':
        baseMin = 75;
        baseMax = 100;
        break;
      case 'medium':
        baseMin = 50;
        baseMax = 85;
        break;
      case 'low':
        baseMin = 30;
        baseMax = 70;
        break;
      default:
        baseMin = 40;
        baseMax = 80;
    }
    
    // Ensure minimum is above 20
    baseMin = Math.max(baseMin, 20.1);
    
    // Generate random number with 1 decimal place
    const randomScore = Math.random() * (baseMax - baseMin) + baseMin;
    
    // Round to 1 decimal place and ensure it's > 20 and <= 100
    const finalScore = Math.round(randomScore * 10) / 10;
    
    return Math.min(Math.max(finalScore, 20.1), 100);
  }

  /**
   * Analyze PDF content type and suggest grading approach
   * @param {string} text - Extracted text
   * @returns {Object} Analysis results
   */
  analyzePDFContent(text) {
    const analysis = {
      contentType: 'general',
      hasFormulas: false,
      hasDiagrams: false,
      hasCode: false,
      hasReferences: false,
      complexity: 'medium',
      suggestedMaxScore: 100,
      keyTopics: []
    };

    try {
      const textLower = text.toLowerCase();

      // Detect content type
      if (textLower.includes('algorithm') || textLower.includes('programming') || textLower.includes('code')) {
        analysis.contentType = 'programming';
        analysis.hasCode = true;
      } else if (textLower.includes('equation') || textLower.includes('formula') || textLower.includes('calculation')) {
        analysis.contentType = 'mathematical';
        analysis.hasFormulas = true;
      } else if (textLower.includes('analysis') || textLower.includes('research') || textLower.includes('study')) {
        analysis.contentType = 'analytical';
      }

      // Check for various elements
      analysis.hasDiagrams = /(?:diagram|chart|figure|graph|illustration)/i.test(text);
      analysis.hasReferences = /(?:references|bibliography|citations)/i.test(text);

      // Estimate complexity based on length and content
      if (text.length > 2000 && (analysis.hasFormulas || analysis.hasCode || analysis.hasDiagrams)) {
        analysis.complexity = 'high';
      } else if (text.length > 1000) {
        analysis.complexity = 'medium';
      } else {
        analysis.complexity = 'low';
      }
      
      // Generate random suggested score based on complexity
      analysis.suggestedMaxScore = this.generateRandomScore(analysis.complexity);

      // Extract key topics (simple keyword extraction)
      const keywords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
      analysis.keyTopics = [...new Set(keywords)]
        .filter(topic => topic.length > 3 && topic.length < 30)
        .slice(0, 10);

      return analysis;
    } catch (error) {
      console.error('Error analyzing PDF content:', error);
      return analysis;
    }
  }
}

export default new PDFProcessingService();
