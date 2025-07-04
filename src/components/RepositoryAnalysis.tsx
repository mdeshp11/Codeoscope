import React, { useState, useEffect } from 'react';
import { Github, Star, GitFork, AlertCircle, Users, Calendar, Code, FileText, ExternalLink, Shield, Zap, Cpu, Eye, Tag, GitBranch, HardDrive, Clock } from 'lucide-react';
import ScrollableContainer from './ScrollableContainer';

interface RepositoryAnalysisProps {
  repoUrl: string;
}

interface RepoData {
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string;
  size: number;
  open_issues_count: number;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  topics: string[];
}

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
}

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

interface LanguageStats {
  [key: string]: number;
}

const RepositoryAnalysis: React.FC<RepositoryAnalysisProps> = ({ repoUrl }) => {
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [languages, setLanguages] = useState<LanguageStats>({});
  const [latestRelease, setLatestRelease] = useState<Release | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [readme, setReadme] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchRepositoryData();
  }, [repoUrl]);

  const fetchRepositoryData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Check if it's a local project
      if (repoUrl.startsWith('local-project-')) {
        // For local projects, show a placeholder UI
        setRepoData({
          name: 'Local Project',
          full_name: 'Local Project',
          owner: {
            login: 'You',
            avatar_url: 'https://via.placeholder.com/150',
          },
          description: 'This is a local project uploaded from your computer',
          html_url: '#',
          stargazers_count: 0,
          forks_count: 0,
          watchers_count: 0,
          language: 'Mixed',
          size: 0,
          open_issues_count: 0,
          license: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pushed_at: new Date().toISOString(),
          default_branch: 'main',
          topics: ['local', 'project'],
        });
        
        setLanguages({
          JavaScript: 50,
          TypeScript: 30,
          CSS: 20,
        });
        
        setBranches([{ name: 'main' }]);
        setReadme('# Local Project\n\nThis is a local project uploaded from your computer. No GitHub data is available.');
        setIsLoading(false);
        return;
      }

      // Parse GitHub URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL');
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');
      
      // Use a CORS proxy for GitHub API requests from the deployed site
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'https://api.github.com' 
        : 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.github.com');
      
      const baseUrl = `${apiBaseUrl}/repos/${owner}/${cleanRepo}`;

      // Fetch all data in parallel
      const [
        repoResponse,
        languagesResponse,
        releasesResponse,
        contributorsResponse,
        readmeResponse,
        branchesResponse
      ] = await Promise.all([
        fetch(baseUrl, { mode: 'cors' }),
        fetch(`${baseUrl}/languages`, { mode: 'cors' }),
        fetch(`${baseUrl}/releases/latest`, { mode: 'cors' }).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/contributors?per_page=5`, { mode: 'cors' }).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/readme`, { mode: 'cors' }).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/branches`, { mode: 'cors' }).catch(() => ({ ok: false }))
      ]);

      // Process repository data
      if (!repoResponse.ok) {
        throw new Error('Failed to fetch repository data');
      }
      const repoInfo = await repoResponse.json();
      setRepoData(repoInfo);

      // Process languages
      if (languagesResponse.ok) {
        const languagesData = await languagesResponse.json();
        setLanguages(languagesData);
      }

      // Process latest release
      if (releasesResponse.ok) {
        const releaseData = await releasesResponse.json();
        setLatestRelease(releaseData);
      }

      // Process contributors
      if (contributorsResponse.ok) {
        const contributorsData = await contributorsResponse.json();
        setContributors(contributorsData.slice(0, 5));
      }

      // Process README
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        const readmeContent = atob(readmeData.content.replace(/\n/g, ''));
        setReadme(readmeContent.substring(0, 500));
      }

      // Process branches
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSize = (sizeKB: number) => {
    if (sizeKB < 1024) return `${sizeKB} KB`;
    if (sizeKB < 1024 * 1024) return `${(sizeKB / 1024).toFixed(1)} MB`;
    return `${(sizeKB / (1024 * 1024)).toFixed(1)} GB`;
  };

  const getLanguagePercentages = () => {
    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    return Object.entries(languages).map(([lang, bytes]) => ({
      language: lang,
      percentage: ((bytes / total) * 100).toFixed(1),
      bytes
    })).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-green-500',
      'Java': 'bg-red-500',
      'C++': 'bg-purple-500',
      'C': 'bg-gray-600',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-500',
      'PHP': 'bg-indigo-500',
      'Ruby': 'bg-red-600',
      'Swift': 'bg-orange-600',
      'Kotlin': 'bg-purple-600',
      'Shell': 'bg-gray-500',
      'HTML': 'bg-orange-400',
      'CSS': 'bg-blue-400',
      'Makefile': 'bg-green-600',
      'CMake': 'bg-blue-600'
    };
    return colors[language] || 'bg-gray-400';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Error Loading Repository</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!repoData) return null;

  const languagePercentages = getLanguagePercentages();

  return (
    <ScrollableContainer className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Repository Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <img 
                src={repoData.owner.avatar_url} 
                alt={repoData.owner.login}
                className="w-12 h-12 rounded-full border-2 border-white/20"
              />
              <div>
                <h1 className="text-3xl font-bold">{repoData.name}</h1>
                <p className="text-blue-200">
                  <span className="font-medium">{repoData.owner.login}</span> / {repoData.name}
                </p>
              </div>
              <a 
                href={repoData.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white transition-colors"
              >
                <ExternalLink className="w-6 h-6" />
              </a>
            </div>
            
            <p className="text-blue-100 text-lg leading-relaxed mb-6 max-w-4xl">
              {repoData.description || 'No description provided'}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-blue-200">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(repoData.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Updated {formatDate(repoData.updated_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>{repoData.license?.name || 'No license'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4" />
                <span>{formatSize(repoData.size)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{repoData.stargazers_count.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Stars</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <GitFork className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{repoData.forks_count.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Forks</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <Eye className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{repoData.watchers_count.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Watchers</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{repoData.open_issues_count.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Issues</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <Code className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">{repoData.language || 'Mixed'}</p>
            <p className="text-xs text-gray-600">Primary</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <Users className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{contributors.length}+</p>
            <p className="text-xs text-gray-600">Contributors</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <GitBranch className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
            <p className="text-xs text-gray-600">Branches</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <Tag className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{repoData.topics?.length || 0}</p>
            <p className="text-xs text-gray-600">Topics</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* README Preview */}
          {readme && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>README Preview</span>
              </h2>
              <ScrollableContainer className="bg-gray-50 rounded-lg p-4" maxHeight="300px">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {readme}
                  {readme.length >= 500 && '...'}
                </pre>
              </ScrollableContainer>
              <a 
                href={`${repoData.html_url}/blob/${repoData.default_branch}/README.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm mt-3"
              >
                <span>View full README</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Programming Languages */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Code className="w-5 h-5 text-purple-600" />
              <span>Programming Languages</span>
            </h2>
            <ScrollableContainer className="space-y-4" maxHeight="300px">
              {languagePercentages.slice(0, 8).map(({ language, percentage, bytes }) => (
                <div key={language} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getLanguageColor(language)}`}></div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{language}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getLanguageColor(language)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">{percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollableContainer>
          </div>

          {/* Topics/Tags */}
          {repoData.topics && repoData.topics.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Tag className="w-5 h-5 text-pink-600" />
                <span>Topics & Tags</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {repoData.topics.map((topic) => (
                  <span 
                    key={topic}
                    className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <ScrollableContainer className="space-y-6">
          {/* Latest Release */}
          {latestRelease && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Tag className="w-5 h-5 text-green-600" />
                <span>Latest Release</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <a 
                    href={latestRelease.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium text-blue-600 hover:text-blue-700"
                  >
                    {latestRelease.tag_name}
                  </a>
                  <p className="text-sm text-gray-600 mt-1">{latestRelease.name}</p>
                </div>
                <p className="text-sm text-gray-500">
                  Released {formatDate(latestRelease.published_at)}
                </p>
              </div>
            </div>
          )}

          {/* Branch Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-orange-600" />
              <span>Branch Information</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Default Branch</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  {repoData.default_branch}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Branches</span>
                <span className="text-sm font-medium text-gray-900">{branches.length}</span>
              </div>
              <ScrollableContainer maxHeight="100px">
                {branches.slice(0, 5).map((branch) => (
                  <div key={branch.name} className="text-xs text-gray-500 pl-4">
                    • {branch.name}
                  </div>
                ))}
                {branches.length > 5 && (
                  <div className="text-xs text-gray-400 pl-4">
                    ... and {branches.length - 5} more
                  </div>
                )}
              </ScrollableContainer>
            </div>
          </div>

          {/* Top Contributors */}
          {contributors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Top Contributors</span>
              </h3>
              <ScrollableContainer className="space-y-3" maxHeight="200px">
                {contributors.map((contributor) => (
                  <div key={contributor.login} className="flex items-center space-x-3">
                    <img 
                      src={contributor.avatar_url} 
                      alt={contributor.login}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <a 
                        href={contributor.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {contributor.login}
                      </a>
                      <p className="text-xs text-gray-500">
                        {contributor.contributions} contributions
                      </p>
                    </div>
                  </div>
                ))}
              </ScrollableContainer>
            </div>
          )}

          {/* Repository Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Owner</span>
                <span className="font-medium text-gray-900">{repoData.owner.login}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Repository Size</span>
                <span className="font-medium text-gray-900">{formatSize(repoData.size)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">License</span>
                <span className="font-medium text-gray-900">
                  {repoData.license?.spdx_id || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Commit</span>
                <span className="font-medium text-gray-900">
                  {formatDate(repoData.pushed_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a 
                href={`${repoData.html_url}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">Issues</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
              <a 
                href={`${repoData.html_url}/pulls`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">Pull Requests</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
              <a 
                href={`${repoData.html_url}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">Releases</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
              <a 
                href={`${repoData.html_url}/wiki`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">Wiki</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
            </div>
          </div>
        </ScrollableContainer>
      </div>
    </ScrollableContainer>
  );
};

export default RepositoryAnalysis;