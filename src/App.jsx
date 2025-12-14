import React, { useState } from 'react';
import { Search, Star, GitFork, Eye, Calendar, FileText, Folder, File, AlertCircle, Award, Target, CheckCircle, TrendingUp, Code, Layers, ChevronRight, ChevronDown } from 'lucide-react';

export default function GitGrader() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repoData, setRepoData] = useState(null);
  const [commits, setCommits] = useState([]);
  const [fileStructure, setFileStructure] = useState([]);
  const [readme, setReadme] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [gradeData, setGradeData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Check backend status on component mount
  React.useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/health');
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackendStatus();
  }, []);

  const parseGitHubUrl = (url) => {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(regex);
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    return null;
  };

  // Tech stack detection function
  const detectTechStack = (files) => {
    const techStack = [];
    const fileExtensions = files.map(f => f.path.split('.').pop()?.toLowerCase()).filter(Boolean);
    const filePaths = files.map(f => f.path.toLowerCase());

    // Frontend Technologies
    if (fileExtensions.includes('js') || fileExtensions.includes('jsx')) techStack.push('JavaScript');
    if (fileExtensions.includes('ts') || fileExtensions.includes('tsx')) techStack.push('TypeScript');
    if (fileExtensions.includes('vue')) techStack.push('Vue.js');
    if (fileExtensions.includes('svelte')) techStack.push('Svelte');
    if (filePaths.some(p => p.includes('react') || p.includes('package.json'))) {
      // Check if it's actually React by looking for React-specific patterns
      if (fileExtensions.includes('jsx') || fileExtensions.includes('tsx')) techStack.push('React');
    }
    if (filePaths.some(p => p.includes('angular'))) techStack.push('Angular');
    if (fileExtensions.includes('html')) techStack.push('HTML');
    if (fileExtensions.includes('css') || fileExtensions.includes('scss') || fileExtensions.includes('sass')) techStack.push('CSS');

    // Backend Technologies
    if (fileExtensions.includes('py')) techStack.push('Python');
    if (fileExtensions.includes('java')) techStack.push('Java');
    if (fileExtensions.includes('php')) techStack.push('PHP');
    if (fileExtensions.includes('rb')) techStack.push('Ruby');
    if (fileExtensions.includes('go')) techStack.push('Go');
    if (fileExtensions.includes('rs')) techStack.push('Rust');
    if (fileExtensions.includes('cpp') || fileExtensions.includes('c')) techStack.push('C/C++');
    if (fileExtensions.includes('cs')) techStack.push('C#');
    if (fileExtensions.includes('swift')) techStack.push('Swift');
    if (fileExtensions.includes('kt')) techStack.push('Kotlin');

    // Frameworks and Tools
    if (filePaths.some(p => p.includes('package.json'))) techStack.push('Node.js');
    if (filePaths.some(p => p.includes('requirements.txt') || p.includes('pyproject.toml'))) techStack.push('Python Package');
    if (filePaths.some(p => p.includes('dockerfile'))) techStack.push('Docker');
    if (filePaths.some(p => p.includes('docker-compose'))) techStack.push('Docker Compose');
    if (filePaths.some(p => p.includes('.github/workflows'))) techStack.push('GitHub Actions');
    if (filePaths.some(p => p.includes('cargo.toml'))) techStack.push('Cargo');
    if (filePaths.some(p => p.includes('pom.xml'))) techStack.push('Maven');
    if (filePaths.some(p => p.includes('build.gradle'))) techStack.push('Gradle');

    return [...new Set(techStack)]; // Remove duplicates
  };

  // AI-powered repository analysis using Groq SDK via backend
  const analyzeRepositoryWithAI = async (repoInfo, commits, files, readme) => {
    try {
      const detectedTechStack = detectTechStack(files);

      const repoSummary = {
        name: repoInfo.full_name,
        description: repoInfo.description || 'No description',
        language: repoInfo.language,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        size: repoInfo.size,
        created: repoInfo.created_at,
        updated: repoInfo.updated_at,
        openIssues: repoInfo.open_issues_count,
        totalFiles: files.length,
        totalCommits: commits.length,
        techStack: detectedTechStack
      };

      const fileAnalysis = {
        codeFiles: files.filter(f => f.type === 'blob' && /\.(js|jsx|ts|tsx|py|java|cpp|c|go|rs|php|rb|swift|kt|html|css|scss|sass|vue|svelte)$/i.test(f.path)).length,
        testFiles: files.filter(f => /test|spec|__tests__/i.test(f.path) || /\.(test|spec)\.(js|jsx|ts|tsx|py)$/i.test(f.path)).length,
        configFiles: files.filter(f => /^(package\.json|requirements\.txt|Cargo\.toml|pom\.xml|build\.gradle|Dockerfile|docker-compose|\.env|\.gitignore|LICENSE|README)$/i.test(f.path)).length,
        hasSourceFolder: files.some(f => /^(src|lib|app|source|components|pages|views)/i.test(f.path)),
        hasDocsFolder: files.some(f => /^(docs|documentation|wiki)/i.test(f.path)),
        hasCICD: files.some(f => f.path.startsWith('.github/workflows/') || f.path === '.travis.yml' || f.path === 'Jenkinsfile'),
        hasLinting: files.some(f => /^(\.eslintrc|\.prettierrc|pyproject\.toml|\.flake8|tslint\.json)/.test(f.path))
      };

      const commitAnalysis = {
        recentCommits: commits.slice(0, 10).map(c => ({
          message: c.commit.message,
          author: c.commit.author.name,
          date: c.commit.author.date
        })),
        avgCommitMessageLength: commits.reduce((sum, c) => sum + c.commit.message.length, 0) / commits.length,
        uniqueAuthors: [...new Set(commits.map(c => c.commit.author.name))].length
      };

      const readmeAnalysis = {
        hasReadme: readme !== 'No README found',
        length: readme.length,
        hasInstallation: readme.toLowerCase().includes('install'),
        hasUsage: readme.toLowerCase().includes('usage') || readme.toLowerCase().includes('how to use'),
        hasExamples: readme.toLowerCase().includes('example'),
        hasLicense: readme.toLowerCase().includes('license'),
        hasBadges: readme.includes('![') || readme.includes('https://img.shields.io'),
        hasTableOfContents: readme.toLowerCase().includes('table of contents') || readme.includes('- [')
      };

      // Call our Python backend service that uses Groq SDK
      const response = await fetch('http://localhost:5000/analyze-repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoSummary,
          fileAnalysis,
          commitAnalysis,
          readmeAnalysis,
          readmeContent: readme
        })
      });

      if (!response.ok) {
        throw new Error(`Backend service error: ${response.status}`);
      }

      const aiResponse = await response.json();

      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }

      return {
        ...aiResponse,
        techStack: detectedTechStack
      };

    } catch (error) {
      console.error('AI Analysis failed:', error);
      return analyzeRepositoryFallback(repoInfo, commits, files, readme);
    }
  };

  // Fallback rule-based analysis
  const analyzeRepositoryFallback = (repoInfo, commits, files, readme) => {
    const detectedTechStack = detectTechStack(files);
    let score = 0;
    const analysis = {
      codeQuality: 0,
      documentation: 0,
      structure: 0,
      activity: 0,
      bestPractices: 0
    };

    // Code Quality Analysis (25 points)
    const codeFiles = files.filter(f =>
      f.type === 'blob' &&
      /\.(js|jsx|ts|tsx|py|java|cpp|c|go|rs|php|rb|swift|kt)$/i.test(f.path)
    );

    if (codeFiles.length > 0) {
      analysis.codeQuality += 10;
      const hasSourceFolder = files.some(f => /^(src|lib|app|source)/i.test(f.path));
      if (hasSourceFolder) analysis.codeQuality += 5;
      const hasConfig = files.some(f =>
        /^(package\.json|requirements\.txt|Cargo\.toml|pom\.xml|build\.gradle)$/i.test(f.path)
      );
      if (hasConfig) analysis.codeQuality += 5;
      const hasLinting = files.some(f =>
        /^(\.eslintrc|\.prettierrc|pyproject\.toml|\.flake8)/.test(f.path)
      );
      if (hasLinting) analysis.codeQuality += 5;
    }

    // Documentation Analysis (20 points)
    if (readme && readme !== 'No README found') {
      const readmeLength = readme.length;
      if (readmeLength > 100) analysis.documentation += 5;
      if (readmeLength > 500) analysis.documentation += 5;
      if (readme.toLowerCase().includes('installation')) analysis.documentation += 3;
      if (readme.toLowerCase().includes('usage')) analysis.documentation += 3;
      if (readme.toLowerCase().includes('example')) analysis.documentation += 2;
      if (readme.toLowerCase().includes('license')) analysis.documentation += 2;
    }

    // Project Structure Analysis (20 points)
    const totalFiles = files.length;
    if (totalFiles > 5) analysis.structure += 5;
    if (totalFiles > 15) analysis.structure += 5;
    const hasTests = files.some(f =>
      /test|spec|__tests__/i.test(f.path) ||
      /\.(test|spec)\.(js|jsx|ts|tsx|py)$/i.test(f.path)
    );
    if (hasTests) analysis.structure += 10;

    // Development Activity Analysis (20 points)
    if (commits.length > 0) {
      analysis.activity += 5;
      if (commits.length >= 10) analysis.activity += 5;
      if (commits.length >= 25) analysis.activity += 5;
      const goodCommits = commits.filter(c =>
        c.commit.message.length > 10 &&
        !c.commit.message.toLowerCase().startsWith('update') &&
        !c.commit.message.toLowerCase().startsWith('fix')
      ).length;
      if (goodCommits / commits.length > 0.5) analysis.activity += 5;
    }

    // Best Practices Analysis (15 points)
    const hasGitignore = files.some(f => f.path === '.gitignore');
    if (hasGitignore) analysis.bestPractices += 5;
    const hasLicense = files.some(f => /^LICENSE/i.test(f.path));
    if (hasLicense) analysis.bestPractices += 3;
    const hasCICD = files.some(f =>
      f.path.startsWith('.github/workflows/') ||
      f.path === '.travis.yml' ||
      f.path === 'Jenkinsfile'
    );
    if (hasCICD) analysis.bestPractices += 7;

    score = analysis.codeQuality + analysis.documentation + analysis.structure +
      analysis.activity + analysis.bestPractices;

    let rating, color;
    if (score >= 85) { rating = 'Gold'; color = 'text-yellow-600'; }
    else if (score >= 70) { rating = 'Silver'; color = 'text-gray-600'; }
    else if (score >= 50) { rating = 'Bronze'; color = 'text-orange-600'; }
    else { rating = 'Beginner'; color = 'text-red-600'; }

    const strengths = [];
    const weaknesses = [];

    if (analysis.codeQuality >= 20) strengths.push('excellent code organization');
    else if (analysis.codeQuality < 10) weaknesses.push('code structure needs improvement');

    if (analysis.documentation >= 15) strengths.push('comprehensive documentation');
    else if (analysis.documentation < 8) weaknesses.push('documentation is lacking');

    if (analysis.structure >= 15) strengths.push('well-structured project');
    else if (analysis.structure < 8) weaknesses.push('project structure needs work');

    if (analysis.activity >= 15) strengths.push('consistent development activity');
    else if (analysis.activity < 8) weaknesses.push('irregular commit patterns');

    if (analysis.bestPractices >= 10) strengths.push('follows best practices');
    else weaknesses.push('missing development best practices');

    // Generate detailed summary
    let summary = `This ${repoInfo.language || 'multi-language'} project `;

    if (repoInfo.description) {
      summary += `focuses on ${repoInfo.description.toLowerCase()}. `;
    } else {
      summary += `appears to be a software development project. `;
    }

    if (strengths.length > 0) {
      summary += `The repository demonstrates ${strengths.join(', ')}. `;
    }

    if (weaknesses.length > 0) {
      summary += `However, there are opportunities for improvement in ${weaknesses.join(', ')}. `;
    }

    summary += `With ${commits.length} commits and ${files.length} files, this project shows ${commits.length > 20 ? 'active' : 'moderate'} development activity. `;

    if (score >= 70) {
      summary += `Overall, this is a well-maintained project that follows good development practices.`;
    } else if (score >= 50) {
      summary += `The project has a solid foundation but would benefit from additional improvements.`;
    } else {
      summary += `This project has potential but requires significant improvements to meet industry standards.`;
    }

    const roadmap = [
      'Improve README with comprehensive project documentation and setup instructions',
      'Add comprehensive test coverage with unit and integration tests',
      'Set up CI/CD pipeline using GitHub Actions for automated testing and deployment',
      'Add code linting and formatting tools (ESLint, Prettier) for consistent code style',
      'Implement proper error handling and logging throughout the application'
    ];

    // Add specific improvements based on analysis
    if (analysis.documentation < 15) {
      roadmap.push('Create detailed API documentation and usage examples');
    }
    if (analysis.structure < 15) {
      roadmap.push('Organize code into proper folder structure (src/, tests/, docs/)');
    }
    if (analysis.bestPractices < 10) {
      roadmap.push('Add .gitignore file and LICENSE for better project management');
    }
    if (analysis.codeQuality < 20) {
      roadmap.push('Refactor code for better maintainability and readability');
    }
    if (analysis.activity < 15) {
      roadmap.push('Establish consistent commit patterns and branching strategy');
    }

    if (score >= 70) {
      roadmap.push('Add performance monitoring and optimization');
      roadmap.push('Consider contributing to open-source community');
    }

    return {
      score,
      rating,
      color,
      summary,
      projectDescription: repoInfo.description || `This ${repoInfo.language || 'software'} project appears to be a development repository. The project structure suggests it's designed for ${detectedTechStack.length > 0 ? detectedTechStack.join(', ') + ' development' : 'general software development'}. More specific details about the project's purpose and functionality would be available with a comprehensive README file.`,
      techStackAnalysis: `This project utilizes ${repoInfo.language || 'multiple technologies'} as the primary language${detectedTechStack.length > 1 ? `, along with ${detectedTechStack.slice(1).join(', ')}` : ''}. The technology stack appears ${detectedTechStack.length > 2 ? 'diverse and well-rounded' : 'focused and appropriate'} for the project's scope and requirements.`,
      feedback: `Based on repository structure analysis: The project shows ${analysis.codeQuality >= 15 ? 'good' : 'basic'} code organization, ${analysis.documentation >= 10 ? 'adequate' : 'limited'} documentation, and ${analysis.bestPractices >= 8 ? 'follows several' : 'lacks many'} development best practices. ${analysis.structure >= 15 ? 'The project structure is well-organized.' : 'Consider improving the project structure.'} For more detailed AI-powered feedback, set up a Groq API key.`,
      roadmap: roadmap.slice(0, Math.max(5, roadmap.length)),
      breakdown: analysis,
      isAIGenerated: false,
      techStack: detectedTechStack
    };
  };

  const fetchRepoDetails = async () => {
    setError('');
    setLoading(true);

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setError('Invalid GitHub URL. Format: https://github.com/owner/repo');
      setLoading(false);
      return;
    }

    try {
      // Fetch repository info
      const repoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
      if (!repoRes.ok) throw new Error('Repository not found');
      const repoInfo = await repoRes.json();
      setRepoData(repoInfo);

      // Fetch commits
      const commitsRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=20`);
      const commitsData = await commitsRes.json();
      setCommits(commitsData);

      // Fetch file structure
      const treeRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${repoInfo.default_branch}?recursive=1`);
      const treeData = await treeRes.json();
      setFileStructure(treeData.tree || []);

      // Fetch README
      let readmeContent = 'No README found';
      try {
        const readmeRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`);
        const readmeData = await readmeRes.json();
        readmeContent = atob(readmeData.content);
      } catch (e) {
        console.log('No README found');
      }
      setReadme(readmeContent);

      // Analyze repository with AI
      setAnalyzing(true);
      const analysis = await analyzeRepositoryWithAI(repoInfo, commitsData, treeData.tree || [], readmeContent);
      setGradeData(analysis);
      setAnalyzing(false);

      setActiveTab('grade');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const buildFileTree = (files) => {
    const tree = {};

    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            type: index === parts.length - 1 ? file.type : 'tree',
            children: {},
            path: file.path,
            size: file.size || 0
          };
        }
        current = current[part].children;
      });
    });

    return tree;
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTreeNode = (name, node, depth = 0, parentPath = '') => {
    const currentPath = parentPath ? `${parentPath}/${name}` : name;
    const isFolder = node.type === 'tree';
    const isExpanded = expandedFolders.has(currentPath);
    const hasChildren = Object.keys(node.children).length > 0;

    return (
      <div key={currentPath} className="select-none">
        <div
          className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => isFolder && toggleFolder(currentPath)}
        >
          {isFolder && hasChildren && (
            isExpanded ?
              <ChevronDown className="w-4 h-4 text-gray-400" /> :
              <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          {isFolder && !hasChildren && <div className="w-4 h-4" />}
          {!isFolder && <div className="w-4 h-4" />}

          {isFolder ? (
            <Folder className="w-4 h-4 text-blue-500" />
          ) : (
            <File className="w-4 h-4 text-gray-400" />
          )}

          <span className="text-sm font-mono text-gray-700">{name}</span>

          {!isFolder && node.size > 0 && (
            <span className="text-xs text-gray-400 ml-auto">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>

        {isFolder && isExpanded && hasChildren && (
          <div>
            {Object.entries(node.children)
              .sort(([, a], [, b]) => {
                if (a.type === 'tree' && b.type !== 'tree') return -1;
                if (a.type !== 'tree' && b.type === 'tree') return 1;
                return 0;
              })
              .map(([childName, childNode]) =>
                renderTreeNode(childName, childNode, depth + 1, currentPath)
              )}
          </div>
        )}
      </div>
    );
  };

  const renderFileTree = () => {
    if (fileStructure.length === 0) return null;

    const tree = buildFileTree(fileStructure);

    return (
      <div className="space-y-1">
        <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Repository Structure ({fileStructure.length} items)
        </div>
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
          {Object.entries(tree)
            .sort(([, a], [, b]) => {
              if (a.type === 'tree' && b.type !== 'tree') return -1;
              if (a.type !== 'tree' && b.type === 'tree') return 1;
              return 0;
            })
            .map(([name, node]) => renderTreeNode(name, node))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              GitGrade - AI Repository Analyzer
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100">
              <div className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-green-500' : backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-600">
                {backendStatus === 'online' ? '🤖 AI Ready' : backendStatus === 'offline' ? '📊 Rule-Based' : '⏳ Checking...'}
              </span>
            </div>
          </div>

          {backendStatus === 'offline' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">AI Backend Service</h3>
              <p className="text-sm text-amber-700 mb-3">
                The AI analysis backend is not running. Start the Python backend service to enable AI-powered analysis:
              </p>
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                <div>cd backend</div>
                <div>pip install -r requirements.txt</div>
                <div>python app.py</div>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                Using rule-based analysis until backend service is available.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Enter GitHub repo URL (e.g., https://github.com/facebook/react)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && fetchRepoDetails()}
            />
            <button
              onClick={fetchRepoDetails}
              disabled={loading || analyzing}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Fetching...' : analyzing ? 'Analyzing...' : 'Grade Repository'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {repoData && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">{repoData.full_name}</h2>
              <p className="text-indigo-100 mb-4">{repoData.description || 'No description'}</p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {repoData.stargazers_count.toLocaleString()} stars
                </div>
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4" />
                  {repoData.forks_count.toLocaleString()} forks
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {repoData.watchers_count.toLocaleString()} watchers
                </div>
                {repoData.language && (
                  <div className="px-3 py-1 bg-white/20 rounded-full">
                    {repoData.language}
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-gray-200">
              <div className="flex gap-1 p-2">
                {['grade', 'overview', 'commits', 'files', 'readme'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${activeTab === tab
                      ? 'bg-indigo-100 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'grade' && gradeData && (
                <div className="space-y-6">
                  {/* Score Section */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-indigo-100">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative text-center">
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="p-3 bg-white rounded-full shadow-lg">
                          <Award className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-5xl font-bold text-gray-800 mb-1">{gradeData.score}<span className="text-2xl text-gray-500">/100</span></div>
                          <div className={`text-2xl font-bold ${gradeData.color} mb-2`}>{gradeData.rating}</div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 rounded-full text-sm text-gray-600">
                            {gradeData.isAIGenerated ? (
                              <>🤖 AI-Powered Analysis</>
                            ) : (
                              <>📊 Rule-Based Analysis</>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-blue-700">Code Quality</div>
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                          <Code className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{gradeData.breakdown.codeQuality}<span className="text-lg text-blue-400">/25</span></div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(gradeData.breakdown.codeQuality / 25) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-green-700">Documentation</div>
                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-green-600">{gradeData.breakdown.documentation}<span className="text-lg text-green-400">/20</span></div>
                      <div className="w-full bg-green-200 rounded-full h-2 mt-3">
                        <div className="bg-green-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(gradeData.breakdown.documentation / 20) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-purple-700">Project Structure</div>
                        <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                          <Layers className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-purple-600">{gradeData.breakdown.structure}<span className="text-lg text-purple-400">/20</span></div>
                      <div className="w-full bg-purple-200 rounded-full h-2 mt-3">
                        <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(gradeData.breakdown.structure / 20) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-orange-700">Development Activity</div>
                        <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-orange-600">{gradeData.breakdown.activity}<span className="text-lg text-orange-400">/20</span></div>
                      <div className="w-full bg-orange-200 rounded-full h-2 mt-3">
                        <div className="bg-orange-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(gradeData.breakdown.activity / 20) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="group p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-red-700">Best Practices</div>
                        <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-red-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-red-600">{gradeData.breakdown.bestPractices}<span className="text-lg text-red-400">/15</span></div>
                      <div className="w-full bg-red-200 rounded-full h-2 mt-3">
                        <div className="bg-red-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(gradeData.breakdown.bestPractices / 15) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Repository Tree Structure */}
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Layers className="w-5 h-5 text-purple-600" />
                      </div>
                      Repository Structure
                    </h3>
                    {renderFileTree()}
                  </div>

                  {/* Tech Stack */}
                  {gradeData.techStack && gradeData.techStack.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Code className="w-5 h-5 text-purple-600" />
                        </div>
                        Technology Stack
                      </h3>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {gradeData.techStack.map((tech, idx) => (
                          <span key={idx} className="px-4 py-2 bg-white/70 backdrop-blur-sm text-purple-700 rounded-full text-sm font-medium border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                            {tech}
                          </span>
                        ))}
                      </div>
                      {gradeData.techStackAnalysis && (
                        <div className="p-4 bg-white/50 rounded-lg border border-purple-100">
                          <p className="text-gray-700 leading-relaxed">{gradeData.techStackAnalysis}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Project Description */}
                  {gradeData.projectDescription && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 shadow-sm">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        What This Project Does
                      </h3>
                      <div className="p-4 bg-white/50 rounded-lg border border-blue-100">
                        <p className="text-gray-700 leading-relaxed text-lg">{gradeData.projectDescription}</p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 shadow-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      Detailed Analysis Summary
                    </h3>
                    <div className="p-4 bg-white/50 rounded-lg border border-emerald-100">
                      <p className="text-gray-700 leading-relaxed text-lg">{gradeData.summary}</p>
                    </div>
                  </div>

                  {/* Detailed Feedback */}
                  {gradeData.feedback && (
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 shadow-sm">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        Expert Feedback & Recommendations
                      </h3>
                      <div className="p-4 bg-white/50 rounded-lg border border-amber-100">
                        <p className="text-gray-700 leading-relaxed text-lg">{gradeData.feedback}</p>
                      </div>
                    </div>
                  )}

                  {/* Roadmap */}
                  <div className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 rounded-xl border border-green-200 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      Improvement Roadmap
                    </h3>
                    <div className="space-y-4">
                      {gradeData.roadmap.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="group flex items-start gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-300">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-800 font-medium leading-relaxed">{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Default Branch</div>
                      <div className="text-lg font-semibold">{repoData.default_branch}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Created</div>
                      <div className="text-lg font-semibold">{formatDate(repoData.created_at)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Last Updated</div>
                      <div className="text-lg font-semibold">{formatDate(repoData.updated_at)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Open Issues</div>
                      <div className="text-lg font-semibold">{repoData.open_issues_count}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Repository URL</div>
                    <a href={repoData.html_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all">
                      {repoData.html_url}
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'commits' && (
                <div className="space-y-3">
                  <h3 className="text-xl font-bold mb-4">Recent Commits ({commits.length})</h3>
                  {commits.map((commit, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{commit.commit.message}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {commit.commit.author.name} • {formatDate(commit.commit.author.date)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-mono">{commit.sha.substring(0, 7)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'files' && (
                <div>
                  <h3 className="text-xl font-bold mb-4">File Structure ({fileStructure.length} items)</h3>
                  <div className="max-h-96 overflow-y-auto">
                    {renderFileTree()}
                  </div>
                </div>
              )}

              {activeTab === 'readme' && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    README
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 max-h-96 overflow-y-auto">
                      {readme}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}