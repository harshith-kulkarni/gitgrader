import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Try to initialize Groq client with API key from environment
groq_client = None
try:
    from groq import Groq
    api_key = os.getenv('GROQ_API_KEY')
    if api_key:
        groq_client = Groq(api_key=api_key)
        print("✅ Groq client initialized successfully")
    else:
        print("❌ GROQ_API_KEY not found in environment variables")
        print("📊 Will use fallback analysis")
except Exception as e:
    print(f"❌ Failed to initialize Groq client: {e}")
    print("📊 Will use fallback analysis")

def chat_with_groq(prompt):
    if groq_client is None:
        return None
    
    try:
        completion = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API error: {e}")
        return None

def fallback_analysis(repo_summary, file_analysis, commit_analysis, readme_analysis):
    """Enhanced rule-based analysis as fallback"""
    
    try:
        # Calculate scores
        code_quality = 0
        documentation = 0
        structure = 0
        activity = 0
        best_practices = 0
        
        # Code Quality (25 points)
        if file_analysis.get('codeFiles', 0) > 0:
            code_quality += 10
            if file_analysis.get('hasSourceFolder', False):
                code_quality += 5
            if file_analysis.get('configFiles', 0) > 0:
                code_quality += 5
            if file_analysis.get('hasLinting', False):
                code_quality += 5
        
        # Documentation (20 points)
        if readme_analysis.get('hasReadme', False):
            documentation += 5
            if readme_analysis.get('length', 0) > 500:
                documentation += 5
            if readme_analysis.get('hasInstallation', False):
                documentation += 3
            if readme_analysis.get('hasUsage', False):
                documentation += 3
            if readme_analysis.get('hasExamples', False):
                documentation += 2
            if readme_analysis.get('hasLicense', False):
                documentation += 2
        
        # Structure (20 points)
        total_files = repo_summary.get('totalFiles', 0)
        if total_files > 5:
            structure += 5
        if total_files > 15:
            structure += 5
        if file_analysis.get('testFiles', 0) > 0:
            structure += 10
        
        # Activity (20 points)
        total_commits = repo_summary.get('totalCommits', 0)
        if total_commits > 0:
            activity += 5
            if total_commits >= 10:
                activity += 5
            if total_commits >= 25:
                activity += 5
            if commit_analysis.get('avgCommitMessageLength', 0) > 20:
                activity += 5
        
        # Best Practices (15 points)
        if file_analysis.get('hasCICD', False):
            best_practices += 7
        if 'gitignore' in str(file_analysis.get('configFiles', 0)):
            best_practices += 5
        if 'LICENSE' in str(file_analysis.get('configFiles', 0)):
            best_practices += 3
        
        total_score = code_quality + documentation + structure + activity + best_practices
        
        # Determine rating
        if total_score >= 85:
            rating = "Gold"
            color = "text-yellow-600"
        elif total_score >= 70:
            rating = "Silver"
            color = "text-gray-600"
        elif total_score >= 50:
            rating = "Bronze"
            color = "text-orange-600"
        else:
            rating = "Beginner"
            color = "text-red-600"
        
        # Generate detailed, specific summary
        language = repo_summary.get('language')
        if not language or language == 'None':
            # Try to detect language from tech stack
            tech_stack = repo_summary.get('techStack', [])
            if tech_stack:
                language = tech_stack[0]  # Use first detected technology
            else:
                language = 'Multi-language'
        description = repo_summary.get('description', 'development project')
        
        summary = f"This {language} project "
        if description and description != 'development project':
            summary += f"focuses on {description.lower()}. "
        else:
            summary += f"appears to be a {language.lower()} development project. "
        
        # Add specific findings
        specific_findings = []
        if readme_analysis.get('hasReadme', False):
            if readme_analysis.get('length', 0) > 1000:
                specific_findings.append("comprehensive documentation")
            else:
                specific_findings.append("basic documentation")
        else:
            specific_findings.append("missing README documentation")
        
        if file_analysis.get('testFiles', 0) > 0:
            test_ratio = file_analysis.get('testFiles', 0) / max(file_analysis.get('codeFiles', 1), 1)
            if test_ratio > 0.3:
                specific_findings.append("good test coverage")
            else:
                specific_findings.append("limited test coverage")
        else:
            specific_findings.append("no test coverage")
        
        if file_analysis.get('hasSourceFolder', False):
            specific_findings.append("organized code structure")
        else:
            specific_findings.append("unorganized file structure")
        
        if file_analysis.get('hasCICD', False):
            specific_findings.append("automated CI/CD pipeline")
        
        summary += f"The analysis reveals {', '.join(specific_findings[:3])}. "
        
        if total_score >= 70:
            summary += "Overall, this repository demonstrates strong development practices and maintainability. "
        elif total_score >= 50:
            summary += "The repository shows solid fundamentals but has clear areas for improvement. "
        else:
            summary += "The repository needs significant improvements to meet modern development standards. "
        
        summary += f"With {total_commits} commits across {total_files} files, this project shows {'active' if total_commits > 20 else 'moderate'} development activity."
        
        # Security Vulnerability Assessment
        security_vulnerabilities = []
        
        # Check for common security issues
        if not file_analysis.get('hasCICD', False):
            security_vulnerabilities.append("Missing CI/CD pipeline for automated security scanning")
            
        if not file_analysis.get('hasLinting', False):
            security_vulnerabilities.append("Missing code linting tools that could catch security issues")
            
        # Check for sensitive files that might be exposed
        config_files = str(file_analysis.get('configFiles', 0)).lower()
        if 'config' in config_files or '.env' in config_files:
            security_vulnerabilities.append("Configuration files detected - ensure sensitive data is not committed")
            
        # Check for outdated dependencies (basic check)
        if '.json' in config_files or 'requirements.txt' in config_files or 'package.json' in config_files:
            security_vulnerabilities.append("Dependency files detected - check for outdated or vulnerable packages")
            
        # Check for test coverage
        if file_analysis.get('testFiles', 0) == 0:
            security_vulnerabilities.append("No tests detected - security vulnerabilities may go undetected")
            
        # Generate SPECIFIC roadmap based on actual repository analysis
        roadmap = []
        
        print(f"🔧 Generating roadmap for {language} project...")
        print(f"   - Language: {language}")
        print(f"   - Tech Stack: {repo_summary.get('techStack', [])}")
        print(f"   - README: {'exists' if readme_analysis.get('hasReadme', False) else 'missing'}")
        print(f"   - Tests: {file_analysis.get('testFiles', 0)} files")
        print(f"   - CI/CD: {'yes' if file_analysis.get('hasCICD', False) else 'no'}")
        
        # 1. Documentation-specific improvements
        if not readme_analysis.get('hasReadme', False):
            roadmap.append(f"Create a comprehensive README.md explaining what this {language} project does")
        elif readme_analysis.get('length', 0) < 300:
            roadmap.append(f"Expand the README to better describe this {language} project's purpose and features")
        
        if readme_analysis.get('hasReadme', False) and not readme_analysis.get('hasInstallation', False):
            roadmap.append(f"Add installation and setup instructions for this {language} project")
        
        if readme_analysis.get('hasReadme', False) and not readme_analysis.get('hasUsage', False):
            roadmap.append(f"Include usage examples and code snippets in the {language} documentation")
        
        # 2. Testing-specific improvements
        test_files = file_analysis.get('testFiles', 0)
        code_files = file_analysis.get('codeFiles', 0)
        
        if test_files == 0:
            if language.lower() == 'javascript':
                roadmap.append("Add unit tests using Jest or Mocha for JavaScript modules")
            elif language.lower() == 'python':
                roadmap.append("Implement unit tests using pytest or unittest for Python functions")
            elif language.lower() == 'java':
                roadmap.append("Add JUnit tests for Java classes and methods")
            else:
                roadmap.append(f"Implement unit tests for {language} code modules")
        elif test_files < code_files * 0.3:
            roadmap.append(f"Increase test coverage - currently only {test_files} test files for {code_files} code files")
        
        # 3. Structure-specific improvements
        if not file_analysis.get('hasSourceFolder', False) and code_files > 3:
            if language.lower() == 'javascript':
                roadmap.append("Organize JavaScript files into src/ and lib/ directories")
            elif language.lower() == 'python':
                roadmap.append("Structure Python code into packages with proper __init__.py files")
            else:
                roadmap.append(f"Organize {language} code into proper directory structure")
        
        # 4. CI/CD specific improvements
        if not file_analysis.get('hasCICD', False):
            if language.lower() == 'javascript':
                roadmap.append("Set up GitHub Actions for Node.js testing and deployment")
            elif language.lower() == 'python':
                roadmap.append("Configure GitHub Actions for Python testing with pytest")
            elif language.lower() == 'java':
                roadmap.append("Add GitHub Actions workflow for Maven/Gradle builds")
            else:
                roadmap.append(f"Set up CI/CD pipeline for {language} project automation")
        
        # 5. Language-specific tooling
        if not file_analysis.get('hasLinting', False):
            if language.lower() == 'javascript':
                roadmap.append("Add ESLint and Prettier for JavaScript code quality")
            elif language.lower() == 'python':
                roadmap.append("Set up Black, flake8, and mypy for Python code quality")
            elif language.lower() == 'java':
                roadmap.append("Configure Checkstyle and SpotBugs for Java code analysis")
            else:
                roadmap.append(f"Add linting and formatting tools for {language}")
        
        # 6. Commit and collaboration improvements
        avg_commit_length = commit_analysis.get('avgCommitMessageLength', 0)
        if avg_commit_length < 20:
            roadmap.append(f"Improve commit messages - current average is only {avg_commit_length} characters")
        
        # 7. Repository-specific missing files
        config_files_str = str(file_analysis.get('configFiles', 0)).lower()
        if language.lower() == 'javascript' and 'package.json' not in config_files_str:
            roadmap.append("Add package.json with dependencies and npm scripts")
        elif language.lower() == 'python' and 'requirements.txt' not in config_files_str and 'pyproject.toml' not in config_files_str:
            roadmap.append("Add requirements.txt or pyproject.toml for dependency management")
        
        # Ensure we have exactly 5-6 items, prioritizing the most important
        if len(roadmap) > 6:
            roadmap = roadmap[:6]
        elif len(roadmap) < 5:
            # Add repository-specific items based on actual findings
            missing_items_needed = 5 - len(roadmap)
            
            # Add items based on what's actually missing
            if file_analysis.get('hasSourceFolder', False) == False:
                roadmap.append(f"Create a proper directory structure with src/ and tests/ folders for better organization")
            
            if commit_analysis.get('uniqueAuthors', 0) <= 1:
                roadmap.append(f"Encourage collaboration by inviting other contributors to the {language} project")
            
            if file_analysis.get('hasDocsFolder', False) == False:
                roadmap.append(f"Add a docs/ folder with project documentation for the {language} codebase")
            
            if readme_analysis.get('hasBadges', False) == False and readme_analysis.get('hasReadme', False):
                roadmap.append(f"Add badges to README showing build status, dependencies, and code coverage")
            
            if file_analysis.get('hasLinting', False) == False and len(roadmap) < 5:
                roadmap.append(f"Add a linter configuration file for consistent {language} code formatting")
            
            # Fill remaining slots with more specific items
            while len(roadmap) < 5 and missing_items_needed > 0:
                additional_items = [
                    f"Add comprehensive error handling in critical {language} functions",
                    f"Implement logging for better debugging in the {language} application",
                    f"Add contribution guidelines to encourage community involvement",
                    f"Set up automated code review checks for pull requests"
                ]
                # Add items that haven't been added yet
                for item in additional_items:
                    if item not in roadmap and len(roadmap) < 5:
                        roadmap.append(item)
                missing_items_needed -= 1
        
        print(f"📋 Generated {len(roadmap)} specific roadmap items")
        
        return {
            "score": total_score,
            "rating": rating,
            "color": color,
            "breakdown": {
                "codeQuality": code_quality,
                "documentation": documentation,
                "structure": structure,
                "activity": activity,
                "bestPractices": best_practices
            },
            "summary": summary,
            "projectDescription": f"This {language} project appears to be {description.lower() if description != 'development project' else 'a software development project'}. Based on the file structure with {file_analysis.get('codeFiles', 0)} code files and {file_analysis.get('testFiles', 0)} test files, it's designed for {language.lower()} development{' with testing' if file_analysis.get('testFiles', 0) > 0 else ' without formal testing'}.",
            "techStackAnalysis": f"This project utilizes {language} as the primary language. The technology stack appears appropriate for the project's scope and requirements.",
            "feedback": f"Repository Analysis Findings: Code organization is {'well-structured with proper folders' if file_analysis.get('hasSourceFolder', False) else 'basic and could benefit from better organization'}. Documentation is {'comprehensive with a detailed README' if readme_analysis.get('length', 0) > 500 else 'minimal and needs expansion'}. Testing {'exists but could be expanded' if file_analysis.get('testFiles', 0) > 0 else 'is completely missing and should be implemented'}. Development practices {'include CI/CD automation' if file_analysis.get('hasCICD', False) else 'lack automation and could benefit from CI/CD setup'}.",
            "securityVulnerabilities": security_vulnerabilities,
            "roadmap": roadmap[:6],
            "isAIGenerated": False
        }
        
    except Exception as e:
        print(f"❌ Error in fallback analysis: {e}")
        # Return a basic analysis if everything fails
        return {
            "score": 50,
            "rating": "Bronze",
            "color": "text-orange-600",
            "breakdown": {
                "codeQuality": 10,
                "documentation": 10,
                "structure": 10,
                "activity": 10,
                "bestPractices": 10
            },
            "summary": "Analysis encountered an error, but the repository appears to be a basic software project that needs improvements in documentation, testing, and development practices.",
            "projectDescription": "This appears to be a software development project. More details would be available with proper analysis.",
            "techStackAnalysis": "Unable to determine technology stack due to analysis error.",
            "feedback": "Analysis failed, but general improvements in documentation, testing, and CI/CD would benefit this project.",
            "securityVulnerabilities": ["Analysis failed - unable to assess security vulnerabilities"],
            "roadmap": [
                "Fix repository analysis issues",
                "Add comprehensive README documentation",
                "Implement unit testing",
                "Set up CI/CD pipeline",
                "Add code linting and formatting"
            ],
            "isAIGenerated": False
        }

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'online',
        'message': 'GitGrade Backend is running',
        'groq_available': groq_client is not None
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'groq_available': groq_client is not None,
        'message': 'GitGrade Backend is running'
    })

@app.route('/analyze-repository', methods=['POST'])
def analyze_repository():
    try:
        data = request.json
        
        # Handle test requests
        if data.get('test'):
            return jsonify({'status': 'ok', 'message': 'Backend is running'})
        
        # Extract repository data from request
        repo_summary = data.get('repoSummary', {})
        file_analysis = data.get('fileAnalysis', {})
        commit_analysis = data.get('commitAnalysis', {})
        readme_analysis = data.get('readmeAnalysis', {})
        readme_content = data.get('readmeContent', '')
        
        # Debug: Print what we're analyzing
        print(f"🔍 Analyzing repository: {repo_summary.get('name', 'Unknown')}")
        print(f"📊 Files: {file_analysis.get('codeFiles', 0)} code, {file_analysis.get('testFiles', 0)} test")
        print(f"📖 README: {'Yes' if readme_analysis.get('hasReadme', False) else 'No'} ({readme_analysis.get('length', 0)} chars)")
        print(f"🤖 Groq client available: {groq_client is not None}")
        
        # Try AI analysis first
        if groq_client:
            try:
                print("🤖 Attempting AI analysis...")
                
                # Create the prompt with specific analysis
                prompt = f"""You are an expert code reviewer. Analyze this GitHub repository and provide SPECIFIC recommendations.

REPOSITORY: {repo_summary.get('name', 'Unknown')}
LANGUAGE: {repo_summary.get('language', 'Unknown')}

CURRENT STATE:
- Code files: {file_analysis.get('codeFiles', 0)}
- Test files: {file_analysis.get('testFiles', 0)}
- README exists: {readme_analysis.get('hasReadme', False)}
- README length: {readme_analysis.get('length', 0)} chars
- Has installation guide: {readme_analysis.get('hasInstallation', False)}
- Has usage examples: {readme_analysis.get('hasUsage', False)}
- Has CI/CD: {file_analysis.get('hasCICD', False)}
- Has linting: {file_analysis.get('hasLinting', False)}
- Commits: {repo_summary.get('totalCommits', 0)}

README PREVIEW:
{readme_content[:500]}

Provide JSON response with SPECIFIC roadmap based on what's missing:

{{
  "score": 75,
  "rating": "Silver",
  "breakdown": {{"codeQuality": 20, "documentation": 15, "structure": 15, "activity": 15, "bestPractices": 10}},
  "summary": "Specific analysis of this {repo_summary.get('language', 'code')} project with {file_analysis.get('codeFiles', 0)} files...",
  "projectDescription": "Based on README, this project does...",
  "techStackAnalysis": "Uses {repo_summary.get('language', 'technology')} appropriately...",
  "feedback": "Specific issues found: missing tests, no CI/CD, etc...",
  "securityVulnerabilities": ["List specific security concerns based on repository analysis"],
  "roadmap": [
    "SPECIFIC suggestion 1 based on missing elements",
    "SPECIFIC suggestion 2 for this repository",
    "SPECIFIC suggestion 3 for improvements",
    "SPECIFIC suggestion 4 for this project",
    "SPECIFIC suggestion 5 tailored to findings"
  ]
}}

Make roadmap SPECIFIC to what's actually missing in THIS repository. Also provide specific security vulnerabilities based on the repository structure and files."""

                # Get AI response using Groq
                ai_response_text = chat_with_groq(prompt)
                print(f"🤖 AI Response received: {len(ai_response_text) if ai_response_text else 0} characters")
                
                if ai_response_text and not ai_response_text.startswith("An error occurred"):
                    # Try to parse the JSON response
                    try:
                        # Clean the response - remove code blocks and extra text
                        cleaned_response = ai_response_text.strip()
                        
                        # Remove code blocks if present
                        if cleaned_response.startswith('```json'):
                            cleaned_response = cleaned_response.replace('```json', '').replace('```', '').strip()
                        elif cleaned_response.startswith('```'):
                            cleaned_response = cleaned_response.replace('```', '').strip()
                        
                        # Extract JSON from response if it contains extra text
                        import re
                        json_match = re.search(r'\{.*\}', cleaned_response, re.DOTALL)
                        if json_match:
                            ai_response = json.loads(json_match.group())
                        else:
                            ai_response = json.loads(cleaned_response)
                        
                        # Add metadata
                        ai_response['isAIGenerated'] = True
                        ai_response['techStack'] = repo_summary.get('techStack', [])
                        
                        # Add color coding for rating
                        color_map = {
                            'Gold': 'text-yellow-600',
                            'Silver': 'text-gray-600', 
                            'Bronze': 'text-orange-600',
                            'Beginner': 'text-red-600'
                        }
                        ai_response['color'] = color_map.get(ai_response.get('rating', 'Beginner'), 'text-red-600')
                        
                        print("✅ AI analysis completed successfully")
                        print(f"📋 Roadmap items: {len(ai_response.get('roadmap', []))}")
                        return jsonify(ai_response)
                        
                    except json.JSONDecodeError as e:
                        print(f"❌ Failed to parse AI response: {e}")
                        print(f"Raw response: {cleaned_response[:500]}...")
                        # Fall back to rule-based analysis
                        pass
                else:
                    print("❌ AI analysis failed or returned error, using fallback")
            except Exception as e:
                print(f"❌ AI analysis error: {e}")
        
        # Use fallback analysis
        print("📊 Using enhanced rule-based analysis")
        result = fallback_analysis(repo_summary, file_analysis, commit_analysis, readme_analysis)
        print(f"📋 Fallback analysis generated roadmap with {len(result.get('roadmap', []))} items")
        for i, item in enumerate(result.get('roadmap', []), 1):
            print(f"   {i}. {item}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🎯 GitGrade AI Backend Starting...")
    print("=" * 50)
    print(f"🤖 Groq Client: {'✅ Ready' if groq_client else '❌ Not Available'}")
    if not groq_client:
        print("💡 To enable AI analysis, set GROQ_API_KEY in .env file")
    
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    print(f"📡 Server: http://0.0.0.0:{port}")
    print("🔄 Press Ctrl+C to stop")
    print("=" * 50)
    app.run(debug=False, port=port, host='0.0.0.0')
