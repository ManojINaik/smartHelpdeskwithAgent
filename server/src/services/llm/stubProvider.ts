import { IArticle, IClassificationResult, IDraftResult } from '../../types/models.js';
import RAGService from '../rag.service.js';

const BILLING_KEYWORDS = ['refund', 'invoice', 'charge', 'payment', 'billing', 'credit', 'card', 'subscription', 'plan', 'cost', 'fee', 'price'];
const TECH_KEYWORDS = ['error', 'bug', 'stack', 'crash', 'exception', '500', '404', 'not working', 'issue', 'broken', 'malfunction', 'glitch', 'problem', 'fail'];
const SHIPPING_KEYWORDS = ['delivery', 'shipment', 'shipping', 'tracking', 'package', 'courier', 'address', 'delayed', 'lost', 'damaged'];
const OTHER_KEYWORDS = ['account', 'login', 'password', 'profile', 'settings', 'general', 'question', 'inquiry'];

function keywordMatchScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  let weightedScore = 0;
  
  for (const k of keywords) {
    if (lower.includes(k)) {
      hits += 1;
      // Give more weight to exact word matches
      const wordRegex = new RegExp(`\\b${k}\\b`, 'i');
      if (wordRegex.test(text)) {
        weightedScore += 2;
      } else {
        weightedScore += 1;
      }
    }
  }
  
  return weightedScore;
}

function computeConfidence(maxScore: number, totalWords: number): number {
  // More sophisticated confidence calculation with higher base scores
  let baseConfidence = 0.5; // Start higher
  
  if (maxScore >= 3) baseConfidence = 0.85;
  else if (maxScore >= 2) baseConfidence = 0.75;
  else if (maxScore >= 1) baseConfidence = 0.65;
  
  const lengthBonus = Math.min(0.15, totalWords / 80); // More generous length bonus
  const finalConfidence = Math.min(0.95, baseConfidence + lengthBonus);
  
  console.log(`🎯 Stub confidence calculation:`, {
    maxScore,
    totalWords,
    baseConfidence,
    lengthBonus,
    finalConfidence
  });
  
  return finalConfidence;
}

function getResponseTemplate(category: string): string {
  const templates = {
    billing: [
      "Dear Valued Customer,\n\nThank you for reaching out regarding your billing inquiry. I've carefully reviewed your account and am here to help resolve this matter promptly.",
      "Hello,\n\nI understand you have a billing concern, and I want to ensure we address this properly. Let me guide you through the resolution process.",
      "Dear Customer,\n\nThank you for contacting us about your payment inquiry. I'm committed to helping you resolve this billing matter efficiently."
    ],
    tech: [
      "Hello,\n\nI've reviewed the technical issue you're experiencing. Our technical team has identified the best approach to resolve this problem.",
      "Dear User,\n\nThank you for reporting this technical concern. I'll walk you through the recommended solution to get everything working smoothly again.",
      "Hi there,\n\nI understand the technical difficulty you're facing. Let me provide you with a step-by-step solution to resolve this issue."
    ],
    shipping: [
      "Dear Customer,\n\nThank you for your shipping inquiry. I've checked your order status and have important information to share with you.",
      "Hello,\n\nI understand your concern about your delivery. Let me provide you with a comprehensive update on your shipment status.",
      "Dear Valued Customer,\n\nThank you for contacting us about your package. I'm here to help track down your shipment and provide next steps."
    ],
    other: [
      "Dear Customer,\n\nThank you for reaching out to our support team. I'm here to assist you with your inquiry and provide the best possible solution.",
      "Hello,\n\nI've carefully reviewed your request and am ready to help you resolve this matter. Here's how we can proceed.",
      "Dear Valued Customer,\n\nThank you for contacting our support team. I'm committed to providing you with excellent service and a prompt resolution."
    ]
  };
  
  const categoryTemplates = templates[category as keyof typeof templates] || templates.other;
  if (!categoryTemplates || categoryTemplates.length === 0) {
    return "Dear Customer,\n\nThank you for contacting us. I'm here to assist you with your inquiry and provide the best possible solution.";
  }
  
  const selectedTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
  return selectedTemplate || "Dear Customer,\n\nThank you for contacting us. I'm here to assist you with your inquiry and provide the best possible solution.";
}

function generateActionSteps(category: string, articles: IArticle[]): string[] {
  const baseSteps = {
    billing: [
      "Verify your account details and ensure all information is current and accurate",
      "Review recent transactions and billing statements for any discrepancies",
      "Check your payment method status and update if necessary",
      "Contact our billing department if you notice any unauthorized charges"
    ],
    tech: [
      "Clear your browser cache and cookies, then restart your browser",
      "Verify your internet connection stability and try a different network if available",
      "Try accessing the service from a different device or browser",
      "Document any error messages or codes for our technical team"
    ],
    shipping: [
      "Verify the shipping address provided matches your current location",
      "Check the latest tracking information for real-time updates",
      "Contact the shipping carrier directly for delivery-specific inquiries",
      "Reach out to us if the package shows as delivered but you haven't received it"
    ],
    other: [
      "Review our comprehensive FAQ section for immediate answers",
      "Check your account settings and preferences in your dashboard",
      "Gather any relevant documentation or screenshots that might help",
      "Contact our specialized support team for personalized assistance"
    ]
  };
  
  let steps = [...(baseSteps[category as keyof typeof baseSteps] || baseSteps.other)];
  
  // Extract actionable steps from articles using RAG-enhanced processing
  if (articles.length > 0) {
    const articleSteps = extractActionableStepsFromArticles(articles, category);
    
    // Replace generic steps with article-specific ones if available
    if (articleSteps.length > 0) {
      steps = [...articleSteps, ...steps.slice(articleSteps.length)];
    }
    
    // Add reference to helpful resources
    const topArticles = articles.slice(0, 2);
    steps.push(`Review the following helpful resources: ${topArticles.map(a => a.title).join(' and ')}`);
  }
  
  return steps.slice(0, 4); // Limit to 4 steps for clarity and focus
}

/**
 * Extract actionable steps from articles using RAG techniques
 */
function extractActionableStepsFromArticles(articles: IArticle[], category: string): string[] {
  const steps: string[] = [];
  
  for (const article of articles.slice(0, 2)) { // Process top 2 articles
    // Look for numbered lists, bullet points, or step-by-step instructions
    const content = `${article.title}\n${article.body}`.toLowerCase();
    
    // Extract numbered steps
    const numberedSteps = content.match(/\d+\.[^\n]+/g);
    if (numberedSteps && numberedSteps.length > 0) {
      steps.push(...numberedSteps.slice(0, 2).map(step => 
        step.replace(/^\d+\.\s*/, '').trim().charAt(0).toUpperCase() + 
        step.replace(/^\d+\.\s*/, '').trim().slice(1)
      ));
    }
    
    // Extract bullet points
    const bulletPoints = content.match(/[•\-\*]\s*[^\n]+/g);
    if (bulletPoints && bulletPoints.length > 0 && steps.length < 2) {
      steps.push(...bulletPoints.slice(0, 2 - steps.length).map(point => 
        point.replace(/^[•\-\*]\s*/, '').trim().charAt(0).toUpperCase() + 
        point.replace(/^[•\-\*]\s*/, '').trim().slice(1)
      ));
    }
    
    // Extract sentences with action words for the specific category
    if (steps.length < 2) {
      const actionWords = {
        billing: ['contact', 'check', 'verify', 'update', 'review', 'submit'],
        tech: ['restart', 'clear', 'update', 'reinstall', 'try', 'check'],
        shipping: ['track', 'contact', 'verify', 'check', 'call', 'confirm'],
        other: ['review', 'contact', 'check', 'verify', 'visit', 'try']
      };
      
      const categoryActions = actionWords[category as keyof typeof actionWords] || actionWords.other;
      const sentences = content.split(/[.!?]+/);
      
      for (const sentence of sentences) {
        if (steps.length >= 2) break;
        
        for (const action of categoryActions) {
          if (sentence.includes(action) && sentence.length > 10 && sentence.length < 100) {
            const cleanSentence = sentence.trim().charAt(0).toUpperCase() + sentence.trim().slice(1);
            if (!steps.some(step => step.toLowerCase().includes(sentence.toLowerCase().substring(0, 20)))) {
              steps.push(cleanSentence);
              break;
            }
          }
        }
      }
    }
  }
  
  return steps.slice(0, 2); // Return max 2 article-derived steps
}

export class StubLLMProvider {
  isStubMode(): boolean { return true; }

  async classify(text: string): Promise<IClassificationResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
    
    const words = text.split(/\s+/).length;
    const b = keywordMatchScore(text, BILLING_KEYWORDS);
    const t = keywordMatchScore(text, TECH_KEYWORDS);
    const s = keywordMatchScore(text, SHIPPING_KEYWORDS);
    const o = keywordMatchScore(text, OTHER_KEYWORDS);

    let predictedCategory: 'billing' | 'tech' | 'shipping' | 'other' = 'other';
    let maxScore = Math.max(b, t, s, o);
    
    if (b === maxScore && b > 0) predictedCategory = 'billing';
    else if (t === maxScore && t > 0) predictedCategory = 'tech';
    else if (s === maxScore && s > 0) predictedCategory = 'shipping';
    else predictedCategory = 'other';
    
    // If multiple categories tie, prefer in order: tech, billing, shipping, other
    if (t === maxScore && t > 0) predictedCategory = 'tech';
    else if (b === maxScore && b > 0) predictedCategory = 'billing';

    const confidence = computeConfidence(maxScore, words);
    
    console.log(`🏷️ Stub classification result:`, {
      text: text.substring(0, 100) + '...',
      wordCount: words,
      scores: { billing: b, tech: t, shipping: s, other: o },
      predictedCategory,
      confidence
    });
    
    return { predictedCategory, confidence };
  }

  async draft(text: string, articles: IArticle[]): Promise<IDraftResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
    
    // Determine category for appropriate response
    const classification = await this.classify(text);
    const category = classification.predictedCategory;
    
    console.log(`🤖 RAG-Enhanced Stub Draft Generation:`, {
      query: text.substring(0, 100) + '...',
      category,
      confidence: classification.confidence,
      articlesProvided: articles.length,
      articleTitles: articles.map(a => a.title)
    });
    
    const lines: string[] = [];
    
    // Professional greeting based on category
    lines.push(getResponseTemplate(category));
    lines.push('');
    
    // Add structured solution based on category and articles
    if (articles.length > 0) {
      // Enhanced article analysis for better responses
      const relevantContent = this.extractRelevantContent(text, articles, category);
      
      lines.push('**Recommended Solution:**');
      lines.push('');
      
      // Use RAG-enhanced action steps
      const actionSteps = generateActionSteps(category, articles);
      actionSteps.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`);
      });
      lines.push('');
      
      // Add specific insights from articles if found
      if (relevantContent.insights.length > 0) {
        lines.push('**Based on our knowledge base:**');
        lines.push('');
        relevantContent.insights.forEach(insight => {
          lines.push(`• ${insight}`);
        });
        lines.push('');
      }
      
      // Add relevant knowledge base articles with context
      lines.push('**Additional Resources:**');
      lines.push('');
      articles.slice(0, 3).forEach((article, idx) => {
        const relevanceNote = this.getArticleRelevanceNote(text, article, category);
        lines.push(`• [${article.title}](#kb-article-${article._id})${relevanceNote ? ` - ${relevanceNote}` : ''}`);
      });
      lines.push('');
    } else {
      // Fallback when no articles are available
      lines.push('**Next Steps:**');
      lines.push('');
      const basicSteps = generateActionSteps(category, []);
      basicSteps.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`);
      });
      lines.push('');
    }
    
    // Add category-specific guidance
    lines.push('**Important Notes:**');
    lines.push('');
    
    switch (category) {
      case 'billing':
        lines.push('• Please have your account information ready when contacting us');
        lines.push('• Billing inquiries are typically resolved within 1-2 business days');
        lines.push('• You can view your billing history in your account dashboard');
        break;
      case 'tech':
        lines.push('• Try clearing your browser cache if experiencing web-related issues');
        lines.push('• Include error messages or screenshots when reporting technical problems');
        lines.push('• Our technical team monitors system status 24/7');
        break;
      case 'shipping':
        lines.push('• Tracking updates may take 24-48 hours to reflect new information');
        lines.push('• Contact the carrier directly for delivery-specific questions');
        lines.push('• We can assist with replacement orders if packages are lost or damaged');
        break;
      default:
        lines.push('• Our support team is available Monday-Friday, 9 AM - 6 PM EST');
        lines.push('• For urgent matters, please use our priority support channel');
        lines.push('• You can track the status of your request in your account dashboard');
    }
    
    lines.push('');
    
    // Professional closing based on confidence
    lines.push('**Follow-up:**');
    lines.push('');
    
    if (classification.confidence > 0.8) {
      lines.push('This solution should resolve your issue completely. If you have any questions about these steps or need further clarification, please don\'t hesitate to reach out.');
    } else if (classification.confidence > 0.6) {
      lines.push('Please try these recommended steps and let us know if the issue persists. We\'re here to provide additional assistance if needed.');
    } else {
      lines.push('I\'ve provided some initial guidance based on your inquiry. If these suggestions don\'t address your specific situation, please provide more details so we can offer more targeted assistance.');
    }
    
    lines.push('');
    lines.push('Thank you for choosing our service!');
    lines.push('');
    lines.push('Best regards,');
    lines.push('**Customer Support Team**');
    
    const draftReply = lines.join('\n');
    const citations = articles.slice(0, 3).map(article => String(article._id));

    // Enhanced confidence calculation based on multiple factors
    const baseConfidence = classification.confidence;
    const articleBonus = Math.min(0.15, articles.length * 0.05);
    const lengthPenalty = text.length < 20 ? -0.1 : 0; // Penalize very short descriptions
    const ragBonus = articles.length > 0 ? 0.1 : 0; // Bonus for having relevant articles
    
    const confidence = Math.max(0.3, Math.min(0.95, baseConfidence + articleBonus + lengthPenalty + ragBonus));
    
    console.log(`✨ Enhanced confidence calculation:`, {
      baseConfidence,
      articleBonus,
      lengthPenalty,
      ragBonus,
      finalConfidence: confidence
    });
    
    return { draftReply, citations, confidence };
  }
  
  /**
   * Extract relevant content and insights from articles
   */
  private extractRelevantContent(query: string, articles: IArticle[], category: string) {
    const insights: string[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 3);
    
    for (const article of articles.slice(0, 2)) {
      const content = `${article.title} ${article.body}`.toLowerCase();
      
      // Look for sentences that contain query keywords
      const sentences = content.split(/[.!?]+/);
      
      for (const sentence of sentences) {
        const sentenceTrimmed = sentence.trim();
        if (sentenceTrimmed.length < 20 || sentenceTrimmed.length > 150) continue;
        
        // Check if sentence contains relevant keywords
        const relevantWords = queryWords.filter(word => sentenceTrimmed.includes(word));
        
        if (relevantWords.length >= 1 && insights.length < 3) {
          // Clean up and format the insight
          const insight = sentenceTrimmed
            .charAt(0).toUpperCase() + sentenceTrimmed.slice(1)
            .replace(/\s+/g, ' ')
            .trim();
          
          if (!insights.some(existing => existing.toLowerCase().includes(insight.toLowerCase().substring(0, 20)))) {
            insights.push(insight);
          }
        }
      }
    }
    
    return { insights };
  }
  
  /**
   * Get a relevance note for an article
   */
  private getArticleRelevanceNote(query: string, article: IArticle, category: string): string {
    const queryLower = query.toLowerCase();
    const titleLower = article.title.toLowerCase();
    
    // Check for direct keyword matches
    if (titleLower.includes('troubleshoot') || titleLower.includes('fix')) {
      return 'troubleshooting guide';
    }
    
    if (titleLower.includes('step') || titleLower.includes('how to')) {
      return 'step-by-step instructions';
    }
    
    if (titleLower.includes('policy') || titleLower.includes('terms')) {
      return 'policy information';
    }
    
    // Category-specific relevance
    switch (category) {
      case 'billing':
        if (titleLower.includes('refund') || titleLower.includes('payment')) {
          return 'payment guidance';
        }
        break;
      case 'tech':
        if (titleLower.includes('error') || titleLower.includes('problem')) {
          return 'technical solution';
        }
        break;
      case 'shipping':
        if (titleLower.includes('delivery') || titleLower.includes('track')) {
          return 'shipping information';
        }
        break;
    }
    
    return 'helpful resource';
  }
}

export default StubLLMProvider;



