# Auto Flow - Automation for VEO AI
## Product Requirements Document

---

## Executive Summary

Auto Flow is a powerful Chrome extension that automates video generation workflows for Google's VEO AI platform. Developed by Đặng Minh Đức (@duckmartians), this extension streamlines the process of creating AI-generated videos by enabling batch processing, queue management, and automated downloading. It transforms the manual, time-consuming process of generating multiple AI videos into an efficient, hands-free automation system that content creators, filmmakers, and marketing professionals can leverage for scalable video production.

---

## Product Overview

### Product Name
**Auto Flow - Automation for VEO AI**

### Version
1.0.0

### Developer
- **Author**: Đặng Minh Đức
- **Handle**: @duckmartians
- **Support**: Buy Me a Coffee integration
- **Community**: Discord Community

### Platform
Google Chrome Browser Extension (Manifest V3)

### Target Platform
Google VEO AI (Text-to-Video, Image-to-Video)

---

## Problem Statement

### Current Challenges

Content creators and video professionals face significant challenges when using VEO AI for video generation:

1. **Manual Process Limitations**: Creating multiple videos requires repetitive manual input of prompts, settings configuration, and download initiation for each video individually.

2. **Time-Intensive Workflow**: Generating a series of related videos (e.g., scenes for a story, product variations) requires constant monitoring and intervention.

3. **Inconsistent Output Management**: Without automation, users struggle to organize outputs systematically, leading to disorganized file structures and lost work.

4. **Scalability Barriers**: Professional workflows requiring dozens or hundreds of videos become impractical without batch processing capabilities.

5. **Error Recovery**: When generations fail, users must manually track and retry failed prompts without systematic error handling.

### Market Opportunity

The AI video generation market is experiencing explosive growth:
- **Market Size**: $1.2 billion in 2024, projected to reach $5.8 billion by 2028
- **CAGR**: 48.7% growth rate
- **Target Users**: 50 million+ content creators, 10 million+ marketing professionals, 5 million+ filmmakers

---

## User Personas

### Primary Persona: "Marcus the Content Creator"
- **Role**: YouTube content creator and social media influencer
- **Age**: 28
- **Pain Points**: Creates 20+ videos monthly, needs consistent visual style, spends hours on manual video generation
- **Goals**: Automate video creation pipeline, maintain brand consistency, scale content production
- **Tech Savvy**: High, comfortable with browser extensions and AI tools

### Secondary Persona: "Sarah the Marketing Manager"
- **Role**: Digital marketing manager at e-commerce company
- **Age**: 35
- **Pain Points**: Needs product videos at scale, requires multiple aspect ratios, tight deadlines
- **Goals**: Generate product videos efficiently, A/B test video variations, reduce production costs
- **Tech Savvy**: Medium, uses marketing automation tools

### Tertiary Persona: "David the Indie Filmmaker"
- **Role**: Independent filmmaker and visual artist
- **Age**: 42
- **Pain Points**: Creating scene sequences for projects, maintaining visual continuity, budget constraints
- **Goals**: Generate scene concepts quickly, iterate on visual styles, prototype storytelling ideas
- **Tech Savvy**: Medium-High, uses creative software tools

---

## Feature Specifications

### Core Features

#### 1. Control Panel

##### 1.1 Creation Mode Selection
**Description**: Dropdown selector for choosing AI generation mode
**Acceptance Criteria**:
- Supports Text-to-Video (T2V) generation mode
- Supports Image-to-Video (I2V) generation mode
- Seamless switching between modes
- Mode-specific settings adaptation
- Visual indicator of current mode

**Technical Requirements**:
- Dropdown component with mode options
- State management for mode selection
- Dynamic UI adaptation based on mode
- Persistent mode preference storage

##### 1.2 Prompt List Management
**Description**: Advanced prompt input system with file import capability
**Acceptance Criteria**:
- Import prompts from .txt files
- Support for JSON-structured prompt format
- Real-time prompt preview and editing
- Sample file download for format reference
- Syntax highlighting for prompt structure

**Prompt Structure Format**:
```json
{
  "scene_number": 1,
  "scene": "Morning in the TinyTales Classroom",
  "style": "Full 3D cartoon, TinyTales TV style",
  "lens": "Wide classroom establishing shot",
  "look": "Bright classroom with a new poster of stars and planets"
}
```

**Technical Requirements**:
- File input handler for .txt files
- JSON parsing and validation
- Monaco-style code editor integration
- Sample template generation
- Multi-prompt support with array handling

##### 1.3 Job Download Folder Configuration
**Description**: Custom folder naming for organized output management
**Acceptance Criteria**:
- Custom folder name input (e.g., "Flow-01")
- Automatic folder creation on first download
- Sequential naming for multiple jobs
- Folder path validation
- Integration with browser download settings

**Technical Requirements**:
- Input field with validation
- Chrome Downloads API integration
- Folder structure management
- Naming convention enforcement

##### 1.4 Queue Management System
**Description**: Comprehensive task queue for batch processing
**Acceptance Criteria**:
- "Add to Queue" functionality for prompt batches
- "Manage" panel showing queued items count
- Individual task removal from queue
- Queue reordering capability
- Clear all queue option
- Visual queue item count display

**Technical Requirements**:
- Queue data structure implementation
- Persistent queue storage
- Real-time queue updates
- Drag-and-drop reordering (optional)

##### 1.5 Execution Controls
**Description**: Start and stop controls for queue processing
**Acceptance Criteria**:
- "Start Queue" button to begin processing
- "Stop" button for immediate halt
- Progress bar showing current status
- Status text indicator (Ready, Processing, Paused, Complete)
- Graceful stop handling without data loss

**Technical Requirements**:
- Async queue processor
- Interrupt handling mechanism
- Progress tracking system
- State persistence across sessions

##### 1.6 User Manual Access
**Description**: Multi-language documentation access
**Acceptance Criteria**:
- Vietnamese (Tiếng Việt) manual option
- English manual option
- In-extension or external link access
- Quick-access buttons in Control panel

**Technical Requirements**:
- Multi-language support infrastructure
- Documentation hosting or embedding
- Language toggle functionality

---

#### 2. Settings Panel

##### 2.1 General Settings

###### Videos Per Task
**Description**: Configure number of video variations per prompt
**Acceptance Criteria**:
- Dropdown selection (1, 2, 3, 4, 5+)
- Default value: 1
- Persistent setting storage
- Real-time application to queue

**Technical Requirements**:
- Numeric dropdown component
- Settings state management
- Queue integration for batch processing

###### Model Selection
**Description**: Optional AI model version selection
**Acceptance Criteria**:
- Model options dropdown
- Default: "Default (Veo 3.1 - Fast)"
- Support for multiple model versions
- Model capability descriptions
- Optional field (can leave as default)

**Available Models**:
- Default (Veo 3.1 - Fast)
- Veo 3.1 - Quality
- Veo 3.0 - Standard
- Custom model support (future)

**Technical Requirements**:
- Model configuration system
- API compatibility checking
- Model-specific parameter handling

###### Aspect Ratio Configuration
**Description**: Video dimension ratio selection for T2V and I2V crop
**Acceptance Criteria**:
- Ratio dropdown selection
- Options: Landscape (16:9), Portrait (9:16), Square (1:1), Widescreen (21:9)
- Default: Landscape (16:9)
- Mode-specific ratio options
- Preview indicator of selected ratio

**Technical Requirements**:
- Ratio configuration component
- API parameter mapping
- Visual ratio preview

###### Start Position
**Description**: Configure starting point for prompt/image processing
**Acceptance Criteria**:
- Numeric input for start position
- Default: 1
- Useful for resuming interrupted batches
- Validation for valid range
- Integration with prompt list indexing

**Technical Requirements**:
- Numeric input with validation
- Queue position management
- Resume functionality support

###### Video Creation Wait Time
**Description**: Configurable polling interval for video generation status
**Acceptance Criteria**:
- Range input: minimum to maximum seconds
- Default range: 30 to 60 seconds
- Adjustable based on model speed
- Prevents API rate limiting
- Optimizes for different network conditions

**Technical Requirements**:
- Dual numeric input (min/max)
- Polling interval configuration
- Adaptive timing based on API response

###### Language Selection
**Description**: Interface language preference
**Acceptance Criteria**:
- Language dropdown selector
- Options: English, Tiếng Việt (Vietnamese)
- Persistent language preference
- Full UI translation support

**Technical Requirements**:
- i18n internationalization system
- Language file management
- Dynamic UI text updates

##### 2.2 Download Settings

###### Auto-Download Videos
**Description**: Automatic download of completed videos
**Acceptance Criteria**:
- Toggle switch for enable/disable
- "Configure folder" button for download location
- Seamless download without browser prompts
- User tip for browser download settings
- Download progress indication

**Configuration Tip**:
> "Turn off 'Ask where to save...' in your browser's download settings for seamless auto-downloading."

**Technical Requirements**:
- Toggle component with state persistence
- Chrome Downloads API integration
- Folder configuration dialog
- Download queue management

---

#### 3. History Panel

##### 3.1 Detailed Log
**Description**: Comprehensive activity and event logging
**Acceptance Criteria**:
- Real-time log updates during processing
- Timestamped entries for all actions
- Log levels: Info, Warning, Error, Success
- Scrollable log container
- Log export functionality
- Clear log option

**Log Entry Types**:
- Queue start/stop events
- Prompt submission timestamps
- Video generation progress
- Download completion notifications
- Error messages with details
- System status changes

**Technical Requirements**:
- Log management system
- Real-time log streaming
- Log persistence (session-based)
- Export functionality (JSON/TXT)

##### 3.2 Failed Tasks Tracking
**Description**: Dedicated tracking for failed generation attempts
**Acceptance Criteria**:
- Failed task counter display
- List of failed prompts/images
- Error reason for each failure
- "Copy Failed Prompts/Images" button
- Retry individual or all failed tasks
- Clear failed tasks option

**Technical Requirements**:
- Failed task data structure
- Clipboard API integration
- Retry mechanism implementation
- Error categorization system

---

#### 4. More Tools Panel

##### 4.1 Discover Other Tools
**Description**: Ecosystem of related automation tools and resources
**Acceptance Criteria**:
- Tool discovery interface
- Direct links to related extensions and tools
- Tool descriptions and capabilities
- Community access links

**Available Tools**:

| Tool Name | Type | Description |
|-----------|------|-------------|
| Discord Community | Community | Support, discussion, and feedback platform |
| Auto Whisk (Local) | Local App | Automation for Whisk AI |
| Auto Meta (Extension) | Extension | Automation for Meta AI |
| Auto Flow (Extension) | Extension | Automation for Flow AI |
| Auto Whisk (Extension) | Extension | Automation for Whisk AI |
| YouTube Downloader (Local) | Local App | Download YouTube videos, audio, playlists, and channels |
| Word & Character Counter (Extension) | Extension | Real-time word and character counter |
| Cookie Exporter (Extension) | Extension | Export website cookies with ease |

**Technical Requirements**:
- Tool catalog component
- External link handling
- Tool metadata management
- Installation status detection (optional)

---

### Technical Architecture

#### Manifest V3 Implementation
```json
{
  "manifest_version": 3,
  "name": "Auto Flow - Automation for VEO AI",
  "version": "1.0.0",
  "description": "Automate video generation workflows for Google VEO AI with batch processing and queue management",
  "permissions": [
    "activeTab",
    "storage",
    "downloads",
    "scripting",
    "tabs",
    "alarms",
    "notifications"
  ],
  "host_permissions": [
    "https://labs.google/*",
    "https://veo.google.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://labs.google/*", "https://veo.google.com/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

#### Component Architecture
1. **Popup Interface**: Main user interface with tabbed navigation (Control, Settings, History, More Tools)
2. **Background Service Worker**: Queue processing, API monitoring, download management
3. **Content Scripts**: VEO AI page interaction, form automation, status monitoring
4. **Storage Layer**: Persistent settings, queue state, history management

#### Data Flow
```
User Input → Popup UI → Background Worker → Content Script → VEO AI
                ↓                                    ↓
          Storage (Queue/Settings)            Status Updates
                ↓                                    ↓
          Progress Updates ← Background Worker ← Generation Complete
                ↓
          Auto-Download → Local Storage
```

---

## User Experience Design

### Interface Components

#### 1. Header Section
- Extension logo (duck mascot)
- Extension name and developer credit
- "Buy Me a Coffee" support button
- Clean, dark theme aesthetic

#### 2. Tab Navigation
- **Control**: Primary workflow management
- **Settings**: Configuration options
- **History**: Logs and failed tasks
- **More Tools**: Ecosystem discovery

#### 3. Visual Design System
- **Primary Color**: Dark background (#1a1a2e)
- **Accent Color**: Teal/Cyan highlights (#00d9ff)
- **Text Color**: Light gray (#e0e0e0)
- **Error Color**: Coral red (#ff6b6b)
- **Success Color**: Green (#4caf50)
- **Warning Color**: Amber (#ffc107)

#### 4. Button Styles
- **Primary Action**: Filled teal buttons (Start Queue)
- **Secondary Action**: Outlined buttons (Add to Queue)
- **Danger Action**: Red/coral buttons (Stop)
- **Neutral Action**: Gray outlined buttons (Manage)

### Interaction Patterns

#### Primary Flow: Batch Video Generation
1. User opens Auto Flow popup
2. Selects Creation Mode (Text-to-Video or Image-to-Video)
3. Imports prompt list from .txt file or enters manually
4. Configures Job Download Folder name
5. Clicks "Add to Queue" to stage prompts
6. Reviews queued items in Manage panel
7. Clicks "Start Queue" to begin processing
8. Monitors progress via progress bar and status text
9. Reviews Detailed Log in History tab
10. Videos auto-download to configured folder

#### Secondary Flow: Settings Configuration
1. User navigates to Settings tab
2. Configures videos per task preference
3. Selects AI model version (optional)
4. Sets aspect ratio for output videos
5. Configures start position for batch resumption
6. Sets video creation wait time range
7. Selects interface language
8. Enables auto-download and configures folder
9. Settings persist across sessions

#### Error Recovery Flow
1. Processing encounters generation failure
2. Failed task logged in History → Failed Tasks
3. User reviews failure reason
4. User clicks "Copy Failed Prompts/Images"
5. User can paste into new prompt list
6. User retries failed tasks with adjusted parameters

---

## Success Metrics

### Key Performance Indicators

#### User Engagement
- **Daily Active Users (DAU)**: Target 50,000 within 6 months
- **Average Queue Size**: 10+ prompts per session
- **Session Duration**: 15+ minutes average
- **Feature Adoption**: 80% use auto-download feature

#### Productivity Impact
- **Time Saved**: 70% reduction in manual video generation time
- **Batch Processing**: Average 25 videos per queue session
- **Success Rate**: 95%+ video generation success rate
- **Error Recovery**: 90% of failed tasks successfully retried

#### Business Metrics
- **Installation Rate**: 10,000+ Chrome Web Store installs in first month
- **Retention Rate**: 60% 30-day retention
- **Rating**: 4.5+ star average on Chrome Web Store
- **Support Requests**: <5% of users require support

### Success Criteria

#### Launch Success (3 months)
- 25,000+ active installations
- 4.5+ star rating on Chrome Web Store
- 95%+ queue completion success rate
- Active Discord community with 1,000+ members

#### Growth Success (12 months)
- 100,000+ active installations
- Partnership with VEO AI ecosystem
- Multi-platform support (Firefox, Edge)
- Enterprise features for professional users

---

## Development Roadmap

### Phase 1: MVP (Weeks 1-4)
**Sprint 1 (Week 1-2)**
- Core popup interface with tabbed navigation
- Basic queue management system
- Text-to-Video mode implementation
- Local storage for settings and queue

**Sprint 2 (Week 3-4)**
- Settings panel implementation
- Auto-download functionality
- History and logging system
- Chrome Web Store submission

### Phase 2: Enhancement (Weeks 5-8)
**Sprint 3 (Week 5-6)**
- Image-to-Video mode support
- Advanced prompt editor with syntax highlighting
- Failed task retry mechanism
- Multi-language support (Vietnamese, English)

**Sprint 4 (Week 7-8)**
- More Tools ecosystem integration
- Performance optimization
- User manual and documentation
- Community feedback integration

### Phase 3: Advanced Features (Weeks 9-12)
**Sprint 5 (Week 9-10)**
- Scheduled queue processing
- Advanced model selection options
- Export/import settings profiles
- Batch folder organization

**Sprint 6 (Week 11-12)**
- Analytics and usage insights
- Premium features exploration
- API rate limit optimization
- Cross-browser compatibility (Firefox)

### Phase 4: Enterprise & Scale (Months 4-6)
- Team collaboration features
- Cloud queue synchronization
- Priority processing options
- Enterprise licensing model

---

## Monetization Strategy

### Freemium Model

#### Free Tier
- Full queue management functionality
- Up to 50 videos per day
- Basic settings configuration
- Community support via Discord

#### Premium Tier ($9.99/month or $99/year)
- Unlimited video generation
- Priority queue processing
- Advanced scheduling features
- Cloud settings synchronization
- Email support

#### Enterprise Tier (Custom pricing)
- Team collaboration
- API access for custom integrations
- Dedicated support
- Custom feature development
- SLA guarantees

### Alternative Revenue Streams
- **Buy Me a Coffee**: Voluntary donations
- **Affiliate Partnerships**: Related tool recommendations
- **Sponsored Features**: Partner tool integrations

---

## Privacy and Security

### Data Handling
- **Local-First Architecture**: All settings and queue data stored locally
- **No Data Collection**: Extension does not collect or transmit personal data
- **Secure API Interaction**: Only communicates with VEO AI platform
- **No Third-Party Analytics**: Respects user privacy

### Permissions Justification
| Permission | Purpose |
|------------|---------|
| `activeTab` | Interact with VEO AI page for automation |
| `storage` | Store settings, queue, and history locally |
| `downloads` | Auto-download generated videos |
| `scripting` | Inject automation scripts into VEO AI page |
| `tabs` | Detect VEO AI tabs for automation |
| `alarms` | Schedule polling for video generation status |
| `notifications` | Alert users of completed/failed tasks |

### Security Measures
- Content Security Policy enforcement
- Input validation for all user inputs
- Secure communication with VEO AI only
- Regular security audits and updates

---

## Testing Strategy

### Functional Testing
- Unit tests for queue management (95% coverage)
- Integration tests with VEO AI platform
- End-to-end tests for complete workflows
- Cross-browser compatibility testing

### User Testing
- Beta testing with 500+ users
- A/B testing for UI improvements
- Usability testing with target personas
- Accessibility testing (WCAG 2.1 compliance)

### Performance Testing
- Queue processing efficiency benchmarks
- Memory usage optimization
- Download speed verification
- Long-running session stability

---

## Launch Strategy

### Pre-Launch (Week 1-2)
- Beta testing with Discord community
- Documentation and user manual completion
- Chrome Web Store listing preparation
- Social media presence establishment

### Launch (Week 3)
- Chrome Web Store publication
- Discord community announcement
- Product Hunt submission
- YouTube tutorial video release

### Post-Launch (Week 4+)
- User feedback collection and iteration
- Bug fixes and performance improvements
- Feature requests prioritization
- Community engagement and support

---

## Risk Assessment

### Technical Risks
- **VEO AI API Changes**: Monitor for API updates, implement version detection
- **Rate Limiting**: Implement adaptive wait times and retry logic
- **Browser Updates**: Maintain Manifest V3 compliance, regular testing
- **Platform Availability**: Graceful degradation when VEO AI is unavailable

### Business Risks
- **Competition**: Differentiate with superior UX and ecosystem integration
- **Platform Dependency**: Explore support for alternative AI video platforms
- **User Adoption**: Invest in community building and education
- **Monetization**: Validate premium features before full development

### Mitigation Strategies
- Active community engagement for early issue detection
- Modular architecture for quick adaptation
- Regular communication with users about changes
- Diversification of supported platforms

---

## Conclusion

Auto Flow represents a significant opportunity to streamline AI video generation workflows for content creators, marketers, and filmmakers. By automating the repetitive aspects of VEO AI interaction—queue management, batch processing, and organized downloads—the extension delivers substantial time savings and productivity gains.

The phased development approach ensures rapid time-to-market while building a robust feature set. With proper execution and community engagement, Auto Flow can become the essential companion tool for VEO AI users, establishing a strong foundation for the broader automation tool ecosystem developed by @duckmartians.

---

## Appendix

### A. Prompt File Format Reference

#### Sample Prompt List (prompts.txt)
```json
[
  {
    "scene_number": 1,
    "scene": "Morning in the TinyTales Classroom",
    "style": "Full 3D cartoon, TinyTales TV style",
    "lens": "Wide classroom establishing shot",
    "look": "Bright classroom with a new poster of stars and planets"
  },
  {
    "scene_number": 2,
    "scene": "Teacher introduces the space lesson",
    "style": "Full 3D cartoon, TinyTales TV style",
    "lens": "Medium shot of teacher at whiteboard",
    "look": "Enthusiastic teacher pointing at space diagram"
  },
  {
    "scene_number": 3,
    "scene": "Students react with excitement",
    "style": "Full 3D cartoon, TinyTales TV style",
    "lens": "Close-up reaction shots of students",
    "look": "Children's faces lighting up with wonder"
  }
]
```

### B. Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + F` | Open Auto Flow popup |
| `Enter` | Start Queue (when focused) |
| `Escape` | Stop Queue |
| `Ctrl/Cmd + I` | Import prompt file |

### C. Supported File Formats
- **Prompt Files**: .txt, .json
- **Image Files (I2V)**: .jpg, .jpeg, .png, .webp
- **Output Videos**: .mp4 (VEO AI native format)

### D. Browser Compatibility
| Browser | Version | Status |
|---------|---------|--------|
| Google Chrome | 120+ | ✅ Fully Supported |
| Microsoft Edge | 120+ | 🔄 Planned |
| Mozilla Firefox | 115+ | 🔄 Planned |
| Safari | - | ❌ Not Planned |

---

**Document Version**: 1.0.0  
**Last Updated**: November 2024  
**Author**: Product Team  
**Status**: Production Ready
