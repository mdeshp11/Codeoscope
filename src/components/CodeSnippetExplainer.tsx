import React, { useState, useEffect } from 'react';
import { Copy, Download, ChevronDown, ChevronUp, Lightbulb, Code, FileText, AlertTriangle, CheckCircle, Zap, BookOpen, Eye, EyeOff, Target, Cpu, Globe } from 'lucide-react';
import { CodeSnippetAnalyzer, CodeAnalysis } from '../services/CodeSnippetAnalyzer';
import { ButtonVisibilityManager } from '../services/ButtonVisibilityManager';

interface CodeSnippetExplainerProps {
  code: string;
  language: string;
  isVisible: boolean;
  onToggle: () => void;
}

const CodeSnippetExplainer: React.FC<CodeSnippetExplainerProps> = ({
  code,
  language,
  isVisible,
  onToggle
}) => {
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'detailed']));
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState<number | null>(null);
  const analyzer = new CodeSnippetAnalyzer();
  const buttonManager = ButtonVisibilityManager.getInstance();

  useEffect(() => {
    if (code.trim() && isVisible) {
      analyzeCode();
    }
  }, [code, language, isVisible]);

  // Track user interaction for review completion
  useEffect(() => {
    if (analysis && !reviewStartTime) {
      setReviewStartTime(Date.now());
    }
  }, [analysis]);

  // Monitor user scrolling and section expansion to determine review completion
  useEffect(() => {
    if (analysis && reviewStartTime && !hasUserReviewed) {
      const checkReviewCompletion = () => {
        const timeSpent = Date.now() - reviewStartTime;
        const sectionsExpanded = expandedSections.size;
        const hasScrolled = window.scrollY > 100;
        
        // Consider review complete if user has spent time and interacted
        if (timeSpent > 10000 || (sectionsExpanded >= 3 && timeSpent > 5000) || hasScrolled) {
          setHasUserReviewed(true);
          buttonManager.triggerReviewComplete();
          
          // Dispatch custom event for other components
          document.dispatchEvent(new CustomEvent('analysisReviewComplete', {
            detail: { 
              timeSpent, 
              sectionsExpanded, 
              hasScrolled,
              analysisId: analysis.id 
            }
          }));
        }
      };

      const timer = setInterval(checkReviewCompletion, 2000);
      return () => clearInterval(timer);
    }
  }, [analysis, reviewStartTime, hasUserReviewed, expandedSections, buttonManager]);

  const analyzeCode = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    try {
      const result = await analyzer.analyzeCodeSnippet(code, language);
      setAnalysis(result);
      
      // Trigger analysis complete event
      setTimeout(() => {
        buttonManager.triggerAnalysisComplete();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('codeAnalysisComplete', {
          detail: { 
            analysisId: result.id,
            complexity: result.complexity,
            elementCount: result.elements.length
          }
        }));
      }, 1000); // Small delay to show completion
      
    } catch (error) {
      console.error('Failed to analyze code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
    
    // Track user interaction
    document.dispatchEvent(new CustomEvent('userInteraction', {
      detail: { action: 'section_toggle', sectionId }
    }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
      
      // Track user interaction
      document.dispatchEvent(new CustomEvent('userInteraction', {
        detail: { action: 'copy', type }
      }));
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportExplanation = () => {
    if (!analysis) return;

    const exportText = `
Code Snippet Analysis Report
============================

Language: ${analysis.language}
Complexity: ${analysis.complexity}
Generated: ${new Date(analysis.timestamp).toLocaleString()}

Main Purpose
------------
${analysis.mainPurpose}

Detailed Summary
----------------
${analysis.detailedSummary}

Key Elements
------------
${analysis.keyElements.map(el => `• ${el.name} (${el.type}): ${el.role}`).join('\n')}

Technical Implementation
------------------------
${analysis.technicalDetails.map(detail => `• ${detail}`).join('\n')}

Control Flow Analysis
---------------------
${analysis.controlFlows.map(flow => `• ${flow}`).join('\n')}

External Interactions
---------------------
${analysis.externalInteractions.map(interaction => `• ${interaction}`).join('\n')}

Line-by-Line Explanation
-------------------------
${analysis.lineByLineExplanation.map(exp => `Line ${exp.line}: ${exp.explanation}`).join('\n')}

Suggestions for Improvement
---------------------------
${analysis.suggestions.map(suggestion => `• ${suggestion}`).join('\n')}
    `.trim();

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code-analysis-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Track user interaction
    document.dispatchEvent(new CustomEvent('userInteraction', {
      detail: { action: 'export' }
    }));
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900 dark:border-green-700';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900 dark:border-yellow-700';
      case 'high': return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900 dark:border-red-700';
      default: return 'text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <Zap className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const Section: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    badge?: string;
  }> = ({ id, title, icon, children, defaultExpanded = false, badge }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="text-blue-600 dark:text-blue-400">
              {icon}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{title}</span>
            {badge && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full font-medium">
                {badge}
              </span>
            )}
          </div>
          {isExpanded ? 
            <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" /> : 
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          }
        </button>
        {isExpanded && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {children}
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Code Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Advanced code explanation and insights</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Review Progress Indicator */}
          {analysis && !hasUserReviewed && (
            <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>Review in progress...</span>
            </div>
          )}
          
          {hasUserReviewed && (
            <div className="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="w-3 h-3" />
              <span>Review complete</span>
            </div>
          )}
          
          {analysis && (
            <>
              <button
                onClick={() => copyToClipboard(analysis.detailedSummary, 'detailed')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Copy detailed summary"
              >
                {copySuccess === 'detailed' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={exportExplanation}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Export full analysis"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isVisible ? "Hide explanation" : "Show explanation"}
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Analyzing code with AI...</p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Analysis Complete Banner */}
            {analysis && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Analysis Complete!</span>
                  <span className="text-xs">Review the results below, then click "New Project" to continue.</span>
                </div>
              </div>
            )}

            {/* Basic Summary Section */}
            <Section
              id="summary"
              title="Quick Summary"
              icon={<BookOpen className="w-4 h-4" />}
              defaultExpanded={true}
            >
              <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {analysis.summary}
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Language:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full font-medium">
                      {analysis.language}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Complexity:</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium border flex items-center space-x-1 ${getComplexityColor(analysis.complexity)}`}>
                      {getComplexityIcon(analysis.complexity)}
                      <span className="capitalize">{analysis.complexity}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Detailed Summary Section */}
            <Section
              id="detailed"
              title="Detailed Functionality Analysis"
              icon={<Target className="w-4 h-4" />}
              badge="Enhanced"
              defaultExpanded={true}
            >
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Main Purpose</span>
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                    {analysis.mainPurpose}
                  </p>
                </div>
                
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {analysis.detailedSummary}
                  </p>
                </div>

                {/* Technical Implementation Details */}
                {analysis.technicalDetails.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center space-x-2">
                      <Cpu className="w-4 h-4" />
                      <span>Technical Implementation</span>
                    </h4>
                    <ul className="space-y-1">
                      {analysis.technicalDetails.map((detail, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Control Flow and External Interactions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.controlFlows.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2 text-sm">Control Flow</h4>
                      <ul className="space-y-1">
                        {analysis.controlFlows.map((flow, index) => (
                          <li key={index} className="text-xs text-yellow-800 dark:text-yellow-200">
                            • {flow}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.externalInteractions.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 text-sm flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>External Interactions</span>
                      </h4>
                      <ul className="space-y-1">
                        {analysis.externalInteractions.map((interaction, index) => (
                          <li key={index} className="text-xs text-green-800 dark:text-green-200">
                            • {interaction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* Key Elements Section */}
            {analysis.keyElements.length > 0 && (
              <Section
                id="elements"
                title="Key Elements"
                icon={<Code className="w-4 h-4" />}
                badge={`${analysis.keyElements.length} items`}
              >
                <div className="space-y-3">
                  {analysis.keyElements.map((element, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start space-x-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs rounded font-medium">
                          {element.type}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{element.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{element.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Line-by-Line Explanation */}
            {analysis.lineByLineExplanation.length > 0 && (
              <Section
                id="linebyline"
                title="Line-by-Line Explanation"
                icon={<FileText className="w-4 h-4" />}
                badge={`${analysis.lineByLineExplanation.length} lines`}
              >
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysis.lineByLineExplanation.map((exp, index) => (
                    <div key={index} className="flex items-start space-x-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 transition-colors">
                      <span className="flex-shrink-0 w-8 h-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded flex items-center justify-center font-mono">
                        {exp.line}
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {exp.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Suggestions Section */}
            {analysis.suggestions.length > 0 && (
              <Section
                id="suggestions"
                title="Improvement Suggestions"
                icon={<Lightbulb className="w-4 h-4" />}
                badge={`${analysis.suggestions.length} tips`}
              >
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready for Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">Paste some code to see detailed AI-powered explanations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSnippetExplainer;