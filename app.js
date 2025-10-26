// LearnBridge AI - Main Application Logic

// Initialize environment configuration
let envConfig;
let CONFIG = {};

// Function to initialize configuration
async function initializeConfiguration() {
    try {
        envConfig = new EnvironmentConfig();
        await envConfig.loadConfig();
        
        CONFIG = {
            OPENAI_API_KEY: envConfig.get('OPENAI_API_KEY'),
            API_BASE_URL: envConfig.get('API_BASE_URL'),
            APP_NAME: envConfig.get('APP_NAME'),
            VERSION: envConfig.get('VERSION'),
            ENVIRONMENT: envConfig.get('ENVIRONMENT'),
            ENABLE_VOICE: envConfig.get('ENABLE_VOICE'),
            ENABLE_FILE_UPLOAD: envConfig.get('ENABLE_FILE_UPLOAD'),
            ENABLE_VOLUNTEER_MATCHING: envConfig.get('ENABLE_VOLUNTEER_MATCHING'),
            ENABLE_MULTILINGUAL: envConfig.get('ENABLE_MULTILINGUAL')
        };

        console.log(`🚀 ${CONFIG.APP_NAME} v${CONFIG.VERSION} loaded in ${CONFIG.ENVIRONMENT} mode`);
        
        // Warn if using default API key
        if (CONFIG.OPENAI_API_KEY === 'your-openai-api-key-here') {
            console.warn('⚠️  Using default API key. Please set your OpenAI API key in the .env file for full functionality.');
        }
        
    } catch (error) {
        console.error('Failed to load configuration:', error);
        // Fallback to default configuration
        CONFIG = {
            OPENAI_API_KEY: 'your-openai-api-key-here',
            API_BASE_URL: 'https://api.openai.com/v1',
            APP_NAME: 'LearnBridge AI',
            VERSION: '1.0.0',
            ENVIRONMENT: 'development',
            ENABLE_VOICE: true,
            ENABLE_FILE_UPLOAD: true,
            ENABLE_VOLUNTEER_MATCHING: true,
            ENABLE_MULTILINGUAL: true
        };
    }
}

// Global state
let currentLayer = 'student';
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize configuration first
    await initializeConfiguration();
    
    // Then initialize the app
    initializeApp();
    setupEventListeners();
    
    // Start demo magic after 2 seconds
    setTimeout(() => {
        startDemoMagic();
    }, 2000);
});

function initializeApp() {
    // Show configuration info
    console.log(`🎓 Initializing ${CONFIG.APP_NAME || 'LearnBridge AI'}...`);
    
    // Show student layer by default
    showLayer('student');
    
    // Initialize file upload (if enabled)
    if (CONFIG.ENABLE_FILE_UPLOAD) {
        initializeFileUpload();
    }
    
    // Load demo data
    loadDemoData();
    
    // Show feature status
    console.log('📊 Feature Status:');
    console.log(`   🎤 Voice Input: ${CONFIG.ENABLE_VOICE ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   📁 File Upload: ${CONFIG.ENABLE_FILE_UPLOAD ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   🤝 Volunteer Matching: ${CONFIG.ENABLE_VOLUNTEER_MATCHING ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   🌍 Multilingual: ${CONFIG.ENABLE_MULTILINGUAL ? '✅ Enabled' : '❌ Disabled'}`);
    
    console.log(`🚀 ${CONFIG.APP_NAME || 'LearnBridge AI'} initialized successfully!`);
}

function setupEventListeners() {
    // Chat input and send button
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat-btn');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
        
        // Detect language as user types
        chatInput.addEventListener('input', (e) => {
            detectLanguageFromText(e.target.value);
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }
    
    // File upload button
    const fileBtn = document.getElementById('file-btn');
    const fileInput = document.getElementById('file-input');
    
    if (fileBtn && fileInput) {
        fileBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleFileUpload);
        console.log('✅ File upload listeners added');
    } else {
        console.error('❌ File upload elements not found:', { fileBtn: !!fileBtn, fileInput: !!fileInput });
    }
    
    // Photo upload button
    const photoBtn = document.getElementById('photo-btn');
    const photoInput = document.getElementById('photo-input');
    
    if (photoBtn && photoInput) {
        photoBtn.addEventListener('click', () => {
            photoInput.click();
        });
        
        photoInput.addEventListener('change', handlePhotoUpload);
        console.log('✅ Photo upload listeners added');
    } else {
        console.error('❌ Photo upload elements not found:', { photoBtn: !!photoBtn, photoInput: !!photoInput });
    }
    
    // Voice button events - use click for better mobile compatibility
    const voiceBtn = document.getElementById('voice-btn');
    console.log('🔍 Looking for voice button with ID "voice-btn"...');
    console.log('✅ Voice button found:', !!voiceBtn);
    console.log('📋 Voice button element:', voiceBtn);
    
    if (voiceBtn) {
        console.log('🎯 Adding click event listener to voice button...');
        voiceBtn.addEventListener('click', function(e) {
            console.log('🖱️ Voice button clicked!');
            e.preventDefault();
            e.stopPropagation();
            console.log('📞 Calling toggleVoiceRecording...');
            toggleVoiceRecording();
        });
        
        // Add visual feedback for testing
        voiceBtn.addEventListener('mousedown', function() {
            console.log('👇 Voice button mousedown detected');
            this.style.transform = 'scale(0.9)';
        });
        
        voiceBtn.addEventListener('mouseup', function() {
            console.log('👆 Voice button mouseup detected');
            this.style.transform = '';
        });
        
        console.log('✅ Voice button event listeners added successfully');
    } else {
        console.error('❌ Voice button not found! Check if element exists in DOM');
    }
    
    // Volunteer matching system
    const showVolunteerFormBtn = document.getElementById('show-volunteer-form');
    const volunteerForm = document.getElementById('volunteer-form');
    const volunteerQuestionnaire = document.getElementById('volunteer-questionnaire');
    
    if (showVolunteerFormBtn && volunteerForm) {
        showVolunteerFormBtn.addEventListener('click', () => {
            volunteerForm.style.display = volunteerForm.style.display === 'none' ? 'block' : 'none';
            showVolunteerFormBtn.textContent = volunteerForm.style.display === 'block' ? 
                '🔽 Hide Form' : '👥 Find My Perfect Tutor';
        });
    }
    
    if (volunteerQuestionnaire) {
        volunteerQuestionnaire.addEventListener('submit', handleVolunteerMatching);
    }
}

// Layer Management
function showLayer(layerName) {
    // Update navigation pill states
    document.querySelectorAll('.nav-pill').forEach(pill => {
        pill.classList.remove('active');
    });
    
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current pill
    const currentPill = document.querySelector(`[data-layer="${layerName}"]`);
    if (currentPill) {
        currentPill.classList.add('active');
    }
    
    // Add active class to mobile nav item
    const mobileItems = document.querySelectorAll('.mobile-nav-item');
    mobileItems.forEach((item, index) => {
        const layers = ['student', 'volunteer', 'parent', 'teacher'];
        if (layers[index] === layerName) {
            item.classList.add('active');
        }
    });
    
    // Hide all layers with animation
    document.querySelectorAll('.layer').forEach(layer => {
        layer.classList.remove('active');
        layer.style.opacity = '0';
        layer.style.transform = 'translateY(20px)';
    });
    
    // Show selected layer with animation
    const targetLayer = document.getElementById(`${layerName}-layer`);
    if (targetLayer) {
        setTimeout(() => {
            targetLayer.classList.add('active');
            targetLayer.style.opacity = '1';
            targetLayer.style.transform = 'translateY(0)';
            targetLayer.style.transition = 'all 0.3s ease';
            currentLayer = layerName;
            
            // Load layer-specific data
            loadLayerData(layerName);
        }, 100);
    }
    
    // Navigation styling is now handled by CSS classes
    // The active states are managed through .active class on nav-pill and mobile-nav-item
}

function loadLayerData(layerName) {
    switch(layerName) {
        case 'student':
            // Student layer is always ready
            break;
            
        case 'volunteer':
            // Load fresh volunteer requests
            if (!localStorage.getItem('volunteerSignedUp')) {
                // Show signup flow
            } else {
                // Show active volunteer dashboard
                loadMoreHelpRequests();
            }
            break;
            
        case 'parent':
            // Animate progress bars loading
            setTimeout(() => {
                animateProgressBars();
            }, 500);
            break;
            
        case 'teacher':
            // Load comprehensive teacher dashboard
            setTimeout(() => {
                loadTeacherInsights();
                showModal('🎓 Teacher Dashboard loaded! All insights are now available with real-time data.');
            }, 1000);
            break;
    }
}

function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach((bar, index) => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = targetWidth;
            bar.style.transition = 'width 1.5s ease';
        }, index * 200);
    });
}

// Chat Functionality
function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process the message
    processChatMessage(message);
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    
    let avatar, className;
    switch(sender) {
        case 'user':
            avatar = '👤';
            className = 'user-message';
            break;
        case 'system':
            avatar = '🔔';
            className = 'system-message';
            break;
        default:
            avatar = '🤖';
            className = 'ai-message';
    }
    
    messageDiv.className = className;
    
    // Process markdown formatting for better display
    const formattedMessage = processMarkdown(message);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formattedMessage}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Markdown Processing for Better Message Display
function processMarkdown(text) {
    if (!text) return '';
    
    console.log('Processing markdown for:', text.substring(0, 100) + '...');
    let formatted = text;
    
    // Convert **text** to <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *text* to <em>text</em>  
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Convert horizontal rules
    formatted = formatted.replace(/^---$/gm, '<hr>');
    
    // Style section headers (with emojis at start)
    formatted = formatted.replace(/^(📚|🧮|💡|🎓|💫) \*\*(.*?)\*\*:/gm, '<div class="section-header">$1 <strong>$2</strong></div>');
    
    // Style step indicators and highlights - improved pattern matching
    formatted = formatted.replace(/^\*\*(🎯|✅|📐|💡|📖|🌟|🔑|📚|⚡|🔍|✨|💝|🎯) (.*?)\*\*:/gm, '<div class="highlight-item">$1 <strong>$2</strong></div>');
    
    // Handle the content after highlight items better
    formatted = formatted.replace(/(<div class="highlight-item">.*?<\/div>)\s*([^<\n]+)/gm, '$1<div class="highlight-content">$2</div>');
    
    // Style numbered steps
    formatted = formatted.replace(/^\*\*(\d+\.) \*\*/gm, '<div class="step-number"><strong>$1</strong></div>');
    
    // Clean up any remaining double asterisks
    formatted = formatted.replace(/\*\*/g, '');
    
    // Style emoji bullets
    formatted = formatted.replace(/^(💫|🌟|✨|🎯|💡) /gm, '<div class="emoji-bullet">$1 ');
    formatted = formatted.replace(/(<div class="emoji-bullet">.*?)(<br>|$)/g, '$1</div>$2');
    
    console.log('Processed markdown result:', formatted.substring(0, 200) + '...');
    return formatted;
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function processChatMessage(message) {
    try {
        // Detect language from the message
        const detectedLang = detectLanguageFromText(message);
        
        // Simulate AI thinking time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        removeTypingIndicator();
        
        // Get AI response in detected language
        const response = await getAIResponse(message, detectedLang);
        
        // Add AI response to chat with creative formatting
        console.log('Original AI response:', response);
        const formattedResponse = formatAIResponse(response);
        console.log('Formatted AI response:', formattedResponse);
        addMessageToChat(formattedResponse, 'ai');
        
    } catch (error) {
        removeTypingIndicator();
        addMessageToChat('Sorry, I encountered an error. Please try again!', 'ai');
        console.error('Chat error:', error);
    }
}

async function getAIResponse(message, language = 'en') {
    const languageInstructions = {
        'en': 'Respond in English.',
        'es': 'Responde en español.',
        'fr': 'Répondez en français.',
        'de': 'Antworten Sie auf Deutsch.',
        'it': 'Rispondi in italiano.',
        'pt': 'Responda em português.',
        'ru': 'Отвечайте на русском языке.',
        'zh': '请用中文回答。',
        'ja': '日本語で答えてください。',
        'ko': '한국어로 대답해 주세요.',
        'ar': 'أجب باللغة العربية.',
        'hi': 'हिंदी में उत्तर दें।'
    };
    
    const langInstruction = languageInstructions[language] || languageInstructions['en'];
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are an enthusiastic AI tutor for students. For complex problems, use step-by-step explanations with clear transitions like "First", "Next", "Then", "Finally". For math problems, show the method and solution clearly. For concepts, provide definitions and examples. Be encouraging and educational. Use natural sentence structure that's easy to break down. ${langInstruction}`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error('AI response failed');
    }
    
    const result = await response.json();
    return result.choices[0].message.content;
}

// Creative Response Formatting - Always Break Down Responses
function formatAIResponse(response) {
    console.log('🎨 Formatting AI response:', response.substring(0, 100) + '...');
    
    // Always break down any response longer than 100 characters
    if (response.length < 100) {
        return `💫 **Quick Answer:**\n\n${response}\n\n---\n✨ Great question!`;
    }
    
    // Split into sentences first
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 15);
    console.log(`📝 Split into ${sentences.length} sentences`);
    
    let formattedResponse = '';
    
    // Always use a structured approach for longer responses
    if (sentences.length >= 4) {
        // Multi-part explanation
        formattedResponse += '📚 **Detailed Explanation:**\n\n';
        
        sentences.forEach((sentence, index) => {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length < 15) return;
            
            // First sentence is the main concept
            if (index === 0) {
                formattedResponse += `**🎯 Main Concept:**\n${cleanSentence}.\n\n`;
            }
            // Last sentence is usually conclusion/summary
            else if (index === sentences.length - 1) {
                formattedResponse += `**✅ Summary:**\n${cleanSentence}.\n\n`;
            }
            // Middle sentences are details/steps
            else {
                const stepEmojis = ['💡', '📐', '🔍', '⚡', '🌟', '✨'];
                const emoji = stepEmojis[(index - 1) % stepEmojis.length];
                formattedResponse += `**${emoji} Key Point ${index}:**\n${cleanSentence}.\n\n`;
            }
        });
    } else if (sentences.length >= 2) {
        // Simple breakdown for 2-3 sentences
        formattedResponse += '🎓 **Here\'s the breakdown:**\n\n';
        
        sentences.forEach((sentence, index) => {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length < 15) return;
            
            const emojis = ['🎯', '💡', '✅'];
            const labels = ['Key Point', 'Details', 'Conclusion'];
            
            formattedResponse += `**${emojis[index % 3]} ${labels[index % 3]}:**\n${cleanSentence}.\n\n`;
        });
    } else {
        // Single sentence or very short - still make it look nice
        formattedResponse += '💫 **Quick Answer:**\n\n';
        formattedResponse += response + '\n\n';
    }
    
    // Always add an encouraging footer
    const encouragements = [
        '🌟 Keep up the great work!',
        '🎉 You\'re doing amazing!',  
        '💪 You\'ve got this!',
        '🚀 Keep learning and growing!',
        '✨ Great question!',
        '🎯 Hope this helps!',
        '💝 Happy to help!'
    ];
    
    formattedResponse += `---\n${encouragements[Math.floor(Math.random() * encouragements.length)]}`;
    
    console.log('✅ Formatted response ready');
    return formattedResponse;
}

// Volunteer Matching System
const sampleVolunteers = [
    {
        id: 1,
        name: "Sarah Chen",
        avatar: "👩‍🏫",
        subjects: ["math", "science"],
        grades: ["high", "college"],
        languages: ["english", "mandarin"],
        learningStyles: ["visual", "mixed"],
        availability: ["afternoon", "evening"],
        experience: "3 years",
        rating: 4.9,
        bio: "Math major with experience tutoring calculus and algebra"
    },
    {
        id: 2,
        name: "Marcus Johnson",
        avatar: "👨‍💼",
        subjects: ["english", "history"],
        grades: ["middle", "high"],
        languages: ["english", "spanish"],
        learningStyles: ["auditory", "reading"],
        availability: ["morning", "afternoon"],
        experience: "2 years",
        rating: 4.8,
        bio: "English teacher helping students with writing and literature"
    },
    {
        id: 3,
        name: "Elena Rodriguez",
        avatar: "👩‍💻",
        subjects: ["computer-science", "math"],
        grades: ["high", "college"],
        languages: ["spanish", "english"],
        learningStyles: ["kinesthetic", "visual"],
        availability: ["evening", "flexible"],
        experience: "4 years",
        rating: 4.9,
        bio: "Computer Science graduate specializing in programming and algorithms"
    },
    {
        id: 4,
        name: "David Kim",
        avatar: "👨‍🔬",
        subjects: ["science", "math"],
        grades: ["elementary", "middle", "high"],
        languages: ["english"],
        learningStyles: ["visual", "kinesthetic"],
        availability: ["afternoon", "flexible"],
        experience: "5 years",
        rating: 5.0,
        bio: "PhD in Chemistry with passion for making science fun and accessible"
    },
    {
        id: 5,
        name: "Amara Patel",
        avatar: "👩‍🎓",
        subjects: ["math", "foreign-language"],
        grades: ["elementary", "middle"],
        languages: ["english", "hindi"],
        learningStyles: ["mixed", "auditory"],
        availability: ["morning", "evening"],
        experience: "1 year",
        rating: 4.7,
        bio: "Multilingual tutor specializing in elementary math and language learning"
    }
];

async function handleVolunteerMatching(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const studentNeeds = {
        subject: formData.get('subject'),
        grade: formData.get('grade'),
        learningStyle: formData.get('learning-style'),
        availability: formData.get('availability'),
        language: formData.get('language'),
        description: formData.get('description')
    };
    
    console.log('🔍 Finding matches for student needs:', studentNeeds);
    
    // Show loading
    const resultsDiv = document.getElementById('volunteer-results');
    const matchesDiv = document.getElementById('volunteer-matches');
    
    resultsDiv.style.display = 'block';
    matchesDiv.innerHTML = '<div class="loading">🔍 Finding your perfect matches...</div>';
    
    // Simulate AI processing time
    setTimeout(() => {
        const matches = findVolunteerMatches(studentNeeds);
        displayVolunteerMatches(matches);
    }, 2000);
}

function findVolunteerMatches(studentNeeds) {
    console.log('🤖 AI analyzing student needs...');
    
    const scoredVolunteers = sampleVolunteers.map(volunteer => {
        let score = 0;
        let reasons = [];
        
        // Subject match (most important - 40 points)
        if (volunteer.subjects.includes(studentNeeds.subject)) {
            score += 40;
            reasons.push(`Expert in ${studentNeeds.subject}`);
        }
        
        // Grade level match (30 points)
        if (volunteer.grades.includes(studentNeeds.grade)) {
            score += 30;
            reasons.push(`Experienced with ${studentNeeds.grade} students`);
        }
        
        // Language match (20 points)
        if (volunteer.languages.includes(studentNeeds.language)) {
            score += 20;
            reasons.push(`Fluent in ${studentNeeds.language}`);
        }
        
        // Learning style match (15 points)
        if (volunteer.learningStyles.includes(studentNeeds.learningStyle) || 
            volunteer.learningStyles.includes('mixed')) {
            score += 15;
            reasons.push(`Matches your ${studentNeeds.learningStyle} learning style`);
        }
        
        // Availability match (10 points)
        if (volunteer.availability.includes(studentNeeds.availability) || 
            volunteer.availability.includes('flexible')) {
            score += 10;
            reasons.push(`Available during your preferred time`);
        }
        
        // Rating bonus (up to 5 points)
        score += volunteer.rating;
        
        return {
            ...volunteer,
            matchScore: Math.min(score, 100),
            matchReasons: reasons
        };
    });
    
    // Sort by match score and return top 3 matches
    return scoredVolunteers
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);
}

function displayVolunteerMatches(matches) {
    const matchesDiv = document.getElementById('volunteer-matches');
    
    if (matches.length === 0) {
        matchesDiv.innerHTML = '<p>No matches found. Please try adjusting your preferences.</p>';
        return;
    }
    
    matchesDiv.innerHTML = matches.map(volunteer => `
        <div class="volunteer-match-card">
            <div class="volunteer-info">
                <div class="volunteer-avatar">${volunteer.avatar}</div>
                <div class="volunteer-details">
                    <h5>${volunteer.name}</h5>
                    <div class="match-score">${volunteer.matchScore}% Match</div>
                </div>
            </div>
            
            <p class="volunteer-bio">${volunteer.bio}</p>
            
            <div class="volunteer-skills">
                ${volunteer.subjects.map(subject => 
                    `<span class="skill-tag">${subject.charAt(0).toUpperCase() + subject.slice(1)}</span>`
                ).join('')}
                <span class="skill-tag">⭐ ${volunteer.rating}/5.0</span>
                <span class="skill-tag">📅 ${volunteer.experience}</span>
            </div>
            
            <div class="match-reasons">
                <strong>Why this match is perfect:</strong>
                <ul>
                    ${volunteer.matchReasons.map(reason => `<li>✅ ${reason}</li>`).join('')}
                </ul>
            </div>
            
            <div class="volunteer-actions">
                <button class="connect-btn" onclick="requestTutoringSession(${volunteer.id})">
                    <i class="fas fa-hand-paper"></i> Request Session
                </button>
                <button class="connect-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);" onclick="sendInteractiveMessage(${volunteer.id})">
                    <i class="fas fa-comments"></i> Send Message
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Displayed ${matches.length} volunteer matches`);
}

function requestTutoringSession(volunteerId) {
    const volunteer = sampleVolunteers.find(v => v.id === volunteerId);
    if (volunteer) {
        // Show interactive request dialog
        addMessageToChat(`📋 **Tutoring Session Request Sent!**`, 'system');
        addMessageToChat(`👤 **Tutor:** ${volunteer.name}\n📚 **Subject:** Based on your questionnaire\n⏰ **Requested Time:** ${volunteer.availability[0]}\n\n📧 We've notified ${volunteer.name} of your request. They'll respond within 2 hours!`, 'system');
        
        // Show what the volunteer sees (simulate their dashboard)
        setTimeout(() => {
            addMessageToChat(`� **Update:** ${volunteer.name} has seen your request and is reviewing your needs...`, 'system');
        }, 2000);
        
        // Simulate volunteer acceptance with realistic interaction
        setTimeout(() => {
            addMessageToChat(`✅ **Great News!** ${volunteer.name} accepted your session request!\n\n💬 **${volunteer.name} says:** "Hi! I'm excited to help you learn. I've reviewed your questionnaire and I think we'll work great together. I'll prepare some materials based on what you're struggling with. Looking forward to our session!"\n\n📅 **Next Steps:** Check your email for the video call link. Session starts in 10 minutes!`, 'system');
        }, 5000);
        
        // Final connection simulation
        setTimeout(() => {
            addMessageToChat(`🎥 **Joining Video Call...** \n\n👋 Hi! I'm ${volunteer.name}. Thanks for choosing me as your tutor. I see you need help with the topics we discussed. Should we start by going over what's confusing you the most?`, 'ai');
        }, 8000);
    }
}

function sendInteractiveMessage(volunteerId) {
    const volunteer = sampleVolunteers.find(v => v.id === volunteerId);
    if (volunteer) {
        // Create an interactive message interface
        const messageContainer = document.createElement('div');
        messageContainer.className = 'interactive-message-container';
        messageContainer.innerHTML = `
            <div class="message-composer">
                <h4>💬 Send a message to ${volunteer.name}</h4>
                <textarea id="volunteer-message" placeholder="Hi ${volunteer.name}! I saw your profile and think you'd be perfect to help me with..." rows="3"></textarea>
                <div class="message-actions">
                    <button onclick="sendCustomMessage(${volunteerId})" class="send-message-btn">
                        <i class="fas fa-paper-plane"></i> Send Message
                    </button>
                    <button onclick="closeMessageComposer()" class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Focus on the textarea
        document.getElementById('volunteer-message').focus();
    }
}

function sendCustomMessage(volunteerId) {
    const volunteer = sampleVolunteers.find(v => v.id === volunteerId);
    const messageText = document.getElementById('volunteer-message').value.trim();
    
    if (!messageText) {
        alert('Please write a message before sending!');
        return;
    }
    
    if (volunteer) {
        // Close the composer
        closeMessageComposer();
        
        // Show the sent message
        addMessageToChat(`� **Message sent to ${volunteer.name}:**\n\n"${messageText}"`, 'user');
        addMessageToChat(`✅ Message delivered! ${volunteer.name} typically responds within 1-2 hours. You'll get an email notification when they reply.`, 'system');
        
        // Simulate realistic volunteer response based on message content
        setTimeout(() => {
            let response;
            if (messageText.toLowerCase().includes('math') || messageText.toLowerCase().includes('algebra')) {
                response = `Hi! Thanks for reaching out! I love helping students with math - it's my specialty. I see you mentioned ${messageText.toLowerCase().includes('algebra') ? 'algebra' : 'math'}. I have some great techniques that make it much easier to understand. When would be a good time for a tutoring session? I'm available ${volunteer.availability.join(' and ')}.`;
            } else if (messageText.toLowerCase().includes('help') || messageText.toLowerCase().includes('struggling')) {
                response = `Hello! I'd be happy to help you with your studies. I can see you're working hard and that's already a great start! Based on your message, I think we could have some really productive sessions together. Let me know when you'd like to start - I'm excited to work with you!`;
            } else {
                response = `Hi there! Thanks for your message. I'm really looking forward to working with you! I think my teaching style would be a great fit based on what you've shared. Would you like to schedule a session soon? I'm available ${volunteer.availability.join(' and ')}.`;
            }
            
            addMessageToChat(`📱 **${volunteer.name} replied:**\n\n"${response}"\n\n💡 **Want to schedule a session?** Click "Request Session" on their profile!`, 'system');
        }, 3000 + Math.random() * 3000); // Random delay between 3-6 seconds for realism
    }
}

function closeMessageComposer() {
    const composer = document.querySelector('.interactive-message-container');
    if (composer) {
        composer.remove();
    }
}

// Teacher Volunteer Matching Functions
function findTutorsForStudents() {
    const selectedStudents = document.querySelectorAll('.student-checkbox input:checked');
    
    if (selectedStudents.length === 0) {
        alert('Please select at least one student who needs help.');
        return;
    }
    
    const studentNames = Array.from(selectedStudents).map(input => {
        const label = input.nextElementSibling.textContent;
        return label.split(' - ')[0];
    });
    
    // Show results section
    const resultsDiv = document.getElementById('teacher-volunteer-results');
    const matchesDiv = document.getElementById('teacher-volunteer-matches');
    
    resultsDiv.style.display = 'block';
    matchesDiv.innerHTML = '<div class="loading">🔍 Finding perfect volunteer matches for your students...</div>';
    
    // Simulate AI processing
    setTimeout(() => {
        const matches = generateTeacherRecommendations(selectedStudents);
        displayTeacherVolunteerMatches(matches);
    }, 2000);
}

function runBulkAssessment() {
    const subject = document.getElementById('bulk-subject').value;
    const difficulty = document.getElementById('difficulty-level').value;
    
    const resultsDiv = document.getElementById('teacher-volunteer-results');
    const matchesDiv = document.getElementById('teacher-volunteer-matches');
    
    resultsDiv.style.display = 'block';
    matchesDiv.innerHTML = '<div class="loading">📊 Analyzing student needs and matching with volunteers...</div>';
    
    setTimeout(() => {
        const recommendations = generateBulkRecommendations(subject, difficulty);
        displayTeacherVolunteerMatches(recommendations);
    }, 3000);
}

function scheduleGroupSession() {
    const sessionType = document.getElementById('session-type').value;
    const timeSlot = document.getElementById('group-time').value;
    
    const resultsDiv = document.getElementById('teacher-volunteer-results');
    const matchesDiv = document.getElementById('teacher-volunteer-matches');
    
    resultsDiv.style.display = 'block';
    matchesDiv.innerHTML = '<div class="loading">📅 Finding available volunteers for group sessions...</div>';
    
    setTimeout(() => {
        const groupSessions = generateGroupSessionMatches(sessionType, timeSlot);
        displayTeacherVolunteerMatches(groupSessions);
    }, 2500);
}

function generateTeacherRecommendations(selectedStudents) {
    const studentNeeds = Array.from(selectedStudents).map(input => {
        const label = input.nextElementSibling.textContent;
        const [name, need] = label.split(' - ');
        
        let subject = 'math';
        if (need.toLowerCase().includes('english') || need.toLowerCase().includes('writing')) subject = 'english';
        if (need.toLowerCase().includes('chemistry') || need.toLowerCase().includes('science')) subject = 'science';
        if (need.toLowerCase().includes('history')) subject = 'history';
        
        return { name, need, subject };
    });
    
    return studentNeeds.map(student => {
        const suitableVolunteers = sampleVolunteers.filter(volunteer => 
            volunteer.subjects.includes(student.subject)
        );
        
        return {
            studentName: student.name,
            studentNeed: student.need,
            recommendedVolunteers: suitableVolunteers.slice(0, 2),
            matchType: 'individual'
        };
    });
}

function generateBulkRecommendations(subject, difficulty) {
    const relevantVolunteers = sampleVolunteers.filter(volunteer => 
        volunteer.subjects.includes(subject)
    );
    
    const studentCounts = {
        'struggling': '8 students',
        'average': '12 students', 
        'advanced': '5 students'
    };
    
    return [{
        bulkAssessment: true,
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        difficulty: difficulty.replace('-', ' '),
        studentCount: studentCounts[difficulty],
        recommendedVolunteers: relevantVolunteers.slice(0, 3),
        matchType: 'bulk'
    }];
}

function generateGroupSessionMatches(sessionType, timeSlot) {
    const availableVolunteers = sampleVolunteers.filter(volunteer => {
        if (timeSlot === 'after-school') return volunteer.availability.includes('afternoon');
        if (timeSlot === 'evening') return volunteer.availability.includes('evening');
        return volunteer.availability.includes('flexible');
    });
    
    return [{
        groupSession: true,
        sessionType: sessionType.replace('-', ' '),
        timeSlot: timeSlot.replace('-', ' '),
        recommendedVolunteers: availableVolunteers.slice(0, 2),
        matchType: 'group'
    }];
}

function displayTeacherVolunteerMatches(matches) {
    const matchesDiv = document.getElementById('teacher-volunteer-matches');
    
    if (matches.length === 0) {
        matchesDiv.innerHTML = '<p>No suitable volunteers found. Try adjusting your criteria.</p>';
        return;
    }
    
    matchesDiv.innerHTML = matches.map(match => {
        if (match.matchType === 'individual') {
            return `
                <div class="teacher-match-card">
                    <h5>👤 ${match.studentName}</h5>
                    <p><strong>Need:</strong> ${match.studentNeed}</p>
                    <div class="recommended-volunteers">
                        <h6>Recommended Volunteers:</h6>
                        ${match.recommendedVolunteers.map(volunteer => `
                            <div class="mini-volunteer-card">
                                <span class="volunteer-avatar-mini">${volunteer.avatar}</span>
                                <div class="volunteer-mini-info">
                                    <strong>${volunteer.name}</strong>
                                    <span class="match-score-mini">${volunteer.rating}/5.0 ⭐</span>
                                </div>
                                <button onclick="assignVolunteerToStudent('${match.studentName}', ${volunteer.id})" class="assign-btn">
                                    Assign
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (match.matchType === 'bulk') {
            return `
                <div class="teacher-match-card">
                    <h5>📊 Bulk Assessment Results</h5>
                    <p><strong>Subject:</strong> ${match.subject}</p>
                    <p><strong>Level:</strong> ${match.difficulty}</p>
                    <p><strong>Students Identified:</strong> ${match.studentCount}</p>
                    <div class="recommended-volunteers">
                        <h6>Top Volunteer Recommendations:</h6>
                        ${match.recommendedVolunteers.map(volunteer => `
                            <div class="mini-volunteer-card">
                                <span class="volunteer-avatar-mini">${volunteer.avatar}</span>
                                <div class="volunteer-mini-info">
                                    <strong>${volunteer.name}</strong>
                                    <span class="availability-mini">${volunteer.availability[0]}</span>
                                </div>
                                <button onclick="createBulkAssignment('${match.subject}', ${volunteer.id})" class="assign-btn">
                                    Create Sessions
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (match.matchType === 'group') {
            return `
                <div class="teacher-match-card">
                    <h5>👥 Group Session Plan</h5>
                    <p><strong>Type:</strong> ${match.sessionType}</p>
                    <p><strong>Time:</strong> ${match.timeSlot}</p>
                    <div class="recommended-volunteers">
                        <h6>Available Group Leaders:</h6>
                        ${match.recommendedVolunteers.map(volunteer => `
                            <div class="mini-volunteer-card">
                                <span class="volunteer-avatar-mini">${volunteer.avatar}</span>
                                <div class="volunteer-mini-info">
                                    <strong>${volunteer.name}</strong>
                                    <span class="experience-mini">${volunteer.experience}</span>
                                </div>
                                <button onclick="scheduleWithVolunteer('${match.sessionType}', ${volunteer.id})" class="assign-btn">
                                    Schedule
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }).join('');
}

function assignVolunteerToStudent(studentName, volunteerId) {
    const volunteer = sampleVolunteers.find(v => v.id === volunteerId);
    if (volunteer) {
        alert(`✅ ${volunteer.name} has been assigned to help ${studentName}! \n\n🔔 Both the student and volunteer will receive email notifications with next steps.`);
    }
}

function createBulkAssignment(subject, volunteerId) {
    const volunteer = sampleVolunteers.find(v => v.id === volunteerId);
    if (volunteer) {
        alert(`✅ Bulk tutoring sessions created! \n\n👥 ${volunteer.name} will lead group sessions for ${subject} students. \n📧 All selected students and parents will receive session details via email.`);
    }
}

function scheduleWithVolunteer(sessionType, volunteerId) {
    const volunteer = sampleVolunteers.find(v => v.id === volunteerId);
    if (volunteer) {
        alert(`📅 Group session scheduled! \n\n🎓 ${volunteer.name} will lead "${sessionType}" sessions. \n📨 Calendar invitations will be sent to all participants.`);
    }
}

// Unified Chat Interface Functions
function showChatStatus(message) {
    const statusElement = document.getElementById('chat-status');
    const statusText = document.getElementById('status-text');
    if (statusElement && statusText) {
        statusText.textContent = message;
        statusElement.style.display = 'block';
    }
}

function hideChatStatus() {
    const statusElement = document.getElementById('chat-status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}

function addPhotoToChat(imageSrc, filename) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message photo-message';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <div class="photo-upload-display">
                <img src="${imageSrc}" alt="${filename}" style="max-width: 200px; border-radius: 8px; margin-bottom: 8px;">
                <div class="photo-info">📸 ${filename}</div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function analyzePhotoInChat(imageSrc) {
    showTypingIndicator();
    showChatStatus('🔍 Analyzing your homework photo...');
    
    try {
        // Convert image to base64 for API
        const base64Image = imageSrc.split(',')[1];
        const analysis = await analyzeImageWithGPT4Vision(base64Image);
        
        removeTypingIndicator();
        hideChatStatus();
        
        // Format photo analysis response creatively
        const formattedAnalysis = formatAIResponse(analysis);
        addMessageToChat(formattedAnalysis, 'ai');
        
    } catch (error) {
        removeTypingIndicator();
        hideChatStatus();
        addMessageToChat('Sorry, I had trouble analyzing your photo. Please try again or describe the problem in text!', 'ai');
        console.error('Photo analysis error:', error);
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'user-message' : 
                           sender === 'system' ? 'system-message' : 'ai-message';
    
    let avatar = '🤖';
    if (sender === 'user') avatar = '👤';
    if (sender === 'system') avatar = '🔄';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${message}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enter key support for chat
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Photo upload handler
    const photoInput = document.getElementById('homework-photo');
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoUpload);
    }
});

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Add photo message to chat
        addPhotoToChat(e.target.result, file.name);
        
        // Auto-analyze the photo
        analyzePhotoInChat(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Handle file upload (documents)
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        showError('Please select a PDF, Word document, text file, or image.');
        return;
    }
    
    const reader = new FileReader();
    
    if (file.type.startsWith('image/')) {
        reader.onload = function(e) {
            addPhotoToChat(e.target.result, file.name);
            analyzePhotoInChat(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        reader.onload = function(e) {
            addFileToChat(file.name, file.type);
            analyzeDocumentInChat(e.target.result, file.type);
        };
        
        if (file.type === 'text/plain') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }
}

// Photo Upload Functionality
function initializeFileUpload() {
    const uploadArea = document.getElementById('photo-upload');
    
    // Check if upload area exists (it might not in current HTML structure)
    if (!uploadArea) {
        console.log('📁 No photo-upload element found, skipping drag/drop initialization');
        return;
    }
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#764ba2';
        uploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handlePhotoFile(files[0]);
        }
    });
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handlePhotoFile(file);
    }
}

function handlePhotoFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImage = document.getElementById('preview-image');
        const photoPreview = document.getElementById('photo-preview');
        const uploadPlaceholder = document.querySelector('.upload-placeholder');
        
        previewImage.src = e.target.result;
        uploadPlaceholder.style.display = 'none';
        photoPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Voice Recording Functionality
function toggleVoiceRecording() {
    console.log('🎤 toggleVoiceRecording called, isRecording:', isRecording);
    
    // Add immediate visual feedback to show button is working
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
        console.log('✅ Voice button found:', voiceBtn);
        voiceBtn.style.background = 'linear-gradient(135deg, #ff4757, #ff3742)';
        voiceBtn.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (!isRecording) {
                voiceBtn.style.background = '';
                voiceBtn.style.transform = '';
            }
        }, 200);
    } else {
        console.error('❌ Voice button not found!');
        showError('Voice button not found. Please refresh the page.');
        return;
    }
    
    // Add immediate user feedback
    if (!isRecording) {
        addMessageToChat('🎤 Starting voice recording...', 'system');
    }
    
    if (isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

async function startVoiceRecording() {
    console.log('🎬 startVoiceRecording called');
    console.log('📊 Current isRecording state:', isRecording);
    
    if (isRecording) {
        console.log('⚠️ Already recording, returning early');
        return;
    }
    
    // Check browser support
    console.log('🔍 Checking browser support...');
    console.log('📱 navigator.mediaDevices:', !!navigator.mediaDevices);
    console.log('🎙️ getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
    console.log('📼 MediaRecorder:', !!window.MediaRecorder);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ Browser does not support getUserMedia');
        showError('Your browser does not support voice recording. Please use Chrome, Firefox, or Safari.');
        return;
    }
    
    if (!window.MediaRecorder) {
        console.error('❌ Browser does not support MediaRecorder');
        showError('MediaRecorder is not supported in your browser. Please use a modern browser.');
        return;
    }
    
    try {
        console.log('Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = processVoiceRecording;
        
        mediaRecorder.start();
        isRecording = true;
        
        // Update UI
        const voiceBtn = document.getElementById('voice-btn');
        
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        
        // Add status message to chat
        addMessageToChat('🎤 Listening... Speak your homework question', 'system');
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        console.error('Full error details:', error);
        
        // Check if it's a permissions issue
        if (error.name === 'NotAllowedError') {
            showError('Please allow microphone access to use voice input. Click the microphone icon in your browser\'s address bar.');
        } else if (error.name === 'NotFoundError') {
            showError('No microphone found. Please check your microphone connection.');
        } else if (error.name === 'NotReadableError') {
            showError('Microphone is already in use by another application.');
        } else {
            showError('Could not access microphone: ' + error.message);
        }
    }
}

function stopVoiceRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    mediaRecorder.stop();
    isRecording = false;
    
    // Stop all tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    
    // Update UI
    const voiceBtn = document.getElementById('voice-btn');
    
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    
    // Add processing message to chat
    addMessageToChat('🔄 Processing your voice...', 'system');
}

async function processVoiceRecording() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const selectedLanguage = 'auto'; // Auto-detect language
    
    try {
        // Show processing status
        addMessageToChat('🔄 Processing your voice...', 'system');
        
        // Convert speech to text using OpenAI Whisper with auto-detection
        const result = await speechToText(audioBlob, selectedLanguage);
        const transcript = result.text;
        const detectedLang = result.detectedLanguage;
        
        console.log(`🎤 Voice transcription complete:`, { transcript, detectedLang });
        
        // Update language status with detected language from speech
        updateLanguageStatus(detectedLang);
        
        // Display transcript in chat with enhanced language information
        const langName = getLanguageName(detectedLang);
        addMessageToChat(`🎤 **Voice Input Detected:** ${langName}\n📝 "${transcript}"`, 'user');
        
        // Also show language detection in chat for clarity
        addMessageToChat(`🌍 Language auto-detected: **${langName}** - I'll respond in the same language!`, 'system');
        
        // Process the message through the chat system
        await processChatMessage(transcript);
        
    } catch (error) {
        console.error('❌ Error processing voice:', error);
        showError('Sorry, we couldn\'t process your voice. Please try again or check your microphone.');
        addMessageToChat('❌ Voice processing failed. Please try speaking again.', 'system');
    }
}

// AI Integration Functions
async function speechToText(audioBlob, language = 'auto') {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    
    // Only specify language if user explicitly selected one (not auto-detect)
    if (language !== 'auto' && language !== 'en') {
        formData.append('language', language);
    }
    // If auto or en, let Whisper auto-detect for best accuracy
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Speech recognition failed');
    }
    
    const result = await response.json();
    
    // Whisper automatically detects the language and returns it
    console.log('Detected language from speech:', result.language || 'auto-detected');
    
    return {
        text: result.text,
        detectedLanguage: result.language || 'auto'
    };
}

// Language Detection Functions
function detectLanguageFromText(text) {
    if (!text || text.length < 5) return;
    
    const languageStatus = document.getElementById('language-status');
    if (!languageStatus) return;
    
    console.log(`🔍 Detecting language for text: "${text.substring(0, 50)}..."`);
    
    // Enhanced language detection patterns with common words
    const patterns = {
        'es': {
            chars: /(?:¿|¡|ñ|á|é|í|ó|ú|ü)/i,
            words: /\b(?:que|con|por|para|una|como|pero|más|hasta|donde|cuando|porque|también|muy|bien|todo|hacer|ser|estar|tener|poder|decir|hola|gracias|ayuda|tarea|matemáticas|español)\b/i
        },
        'fr': {
            chars: /(?:ç|à|è|é|ê|ë|î|ï|ô|ù|û|ü|ÿ)/i,
            words: /\b(?:que|avec|pour|dans|sur|par|mais|plus|tout|comme|bien|faire|être|avoir|dire|aller|voir|savoir|bonjour|merci|aide|devoirs|mathématiques|français)\b/i
        },
        'de': {
            chars: /(?:ä|ö|ü|ß)/i,
            words: /\b(?:und|mit|für|auf|von|zu|im|ist|das|die|der|ein|eine|aber|auch|nicht|nur|wie|kann|haben|sein|werden|hallo|danke|hilfe|hausaufgaben|mathematik|deutsch)\b/i
        },
        'it': {
            chars: /(?:à|è|é|ì|í|î|ò|ó|ù|ú)/i,
            words: /\b(?:che|con|per|nel|del|una|come|più|anche|tutto|fare|essere|avere|dire|andare|vedere|sapere|ciao|grazie|aiuto|compiti|matematica|italiano)\b/i
        },
        'pt': {
            chars: /(?:ã|õ|ç|á|à|â|é|ê|í|ó|ô|ú)/i,
            words: /\b(?:que|com|por|para|uma|como|mais|também|todo|fazer|ser|ter|poder|dizer|ir|ver|saber|olá|obrigado|ajuda|lição|matemática|português)\b/i
        },
        'ru': {
            chars: /[а-яё]/i,
            words: /\b(?:что|как|для|при|или|это|был|его|она|они|мне|нас|вам|им|может|быть|есть|привет|спасибо|помощь|домашнее|математика|русский)\b/i
        },
        'zh': {
            chars: /[\u4e00-\u9fff]/,
            words: /(?:的|和|在|有|是|我|你|他|她|它|们|这|那|什么|怎么|为什么|谢谢|帮助|作业|数学|中文)/
        },
        'ja': {
            chars: /[\u3040-\u309f\u30a0-\u30ff]/,
            words: /(?:です|ます|ある|する|いる|この|その|どの|何|どう|なぜ|ありがとう|助け|宿題|数学|日本語)/
        },
        'ko': {
            chars: /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/,
            words: /(?:이|그|저|의|를|에|와|과|하다|있다|없다|무엇|어떻게|왜|감사합니다|도움|숙제|수학|한국어)/
        },
        'ar': {
            chars: /[\u0600-\u06ff]/,
            words: /(?:في|من|إلى|على|مع|هذا|هذه|ذلك|تلك|ما|كيف|لماذا|شكرا|مساعدة|واجب|رياضيات|عربي)/
        },
        'hi': {
            chars: /[\u0900-\u097f]/,
            words: /(?:और|का|के|की|में|से|को|पर|है|हैं|था|थी|क्या|कैसे|क्यों|धन्यवाद|मदद|गृहकार्य|गणित|हिंदी)/
        }
    };
    
    let detectedLang = 'en'; // default to English
    let maxScore = 0;
    
    // Score each language based on character patterns and common words
    for (const [lang, { chars, words }] of Object.entries(patterns)) {
        let score = 0;
        
        // Character-based detection (weight: 1)
        if (chars.test(text)) {
            score += 1;
        }
        
        // Word-based detection (weight: 2)
        if (words.test(text)) {
            score += 2;
        }
        
        if (score > maxScore) {
            maxScore = score;
            detectedLang = lang;
        }
    }
    
    // If no non-English patterns detected but contains English words, confirm English
    if (maxScore === 0) {
        const englishWords = /\b(?:the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use|what|with|help|please|homework|math|english|question|answer|problem|study|learn|school|student|teacher|parent)\b/i;
        if (englishWords.test(text)) {
            detectedLang = 'en';
            maxScore = 1;
        }
    }
    
    console.log(`✅ Language detection result: ${detectedLang} (confidence score: ${maxScore})`);
    updateLanguageStatus(detectedLang);
    return detectedLang;
}

function updateLanguageStatus(language) {
    const languageStatus = document.getElementById('language-status');
    if (!languageStatus) return;
    
    const languageNames = {
        'en': 'English 🇺🇸',
        'es': 'Spanish 🇪🇸',
        'fr': 'French 🇫🇷',
        'de': 'German 🇩🇪',
        'it': 'Italian 🇮🇹',
        'pt': 'Portuguese 🇵🇹',
        'ru': 'Russian 🇷🇺',
        'zh': 'Chinese 🇨🇳',
        'ja': 'Japanese 🇯🇵',
        'ko': 'Korean 🇰🇷',
        'ar': 'Arabic 🇸🇦',
        'hi': 'Hindi 🇮🇳',
        'tl': 'Filipino 🇵🇭',
        'vi': 'Vietnamese 🇻🇳',
        'th': 'Thai 🇹🇭',
        'tr': 'Turkish 🇹🇷',
        'nl': 'Dutch 🇳🇱',
        'sv': 'Swedish 🇸🇪',
        'da': 'Danish 🇩🇰',
        'no': 'Norwegian 🇳🇴'
    };
    
    const langName = languageNames[language] || `Unknown (${language})`;
    languageStatus.innerHTML = `<i class="fas fa-language"></i> ${langName}`;
    languageStatus.classList.add('detected');
    
    // Add a brief flash animation to draw attention
    languageStatus.style.transform = 'scale(1.05)';
    languageStatus.style.background = 'rgba(34, 197, 94, 0.2)';
    
    setTimeout(() => {
        languageStatus.style.transform = '';
        languageStatus.style.background = '';
    }, 300);
    
    console.log(`🌍 Language detected: ${langName}`);
}

function getLanguageName(langCode) {
    const languageNames = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'hi': 'Hindi'
    };
    
    return languageNames[langCode] || 'Unknown';
}

// Helper functions for file and photo handling
function addPhotoToChat(imageSrc, fileName) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <div class="message-text">📷 Uploaded: ${fileName}</div>
            <img src="${imageSrc}" alt="Uploaded homework" style="max-width: 300px; border-radius: 8px; margin-top: 8px;">
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addFileToChat(fileName, fileType) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    
    const fileIcon = getFileIcon(fileType);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <div class="message-text">${fileIcon} Uploaded: ${fileName}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('text')) return '📃';
    if (fileType.startsWith('image/')) return '🖼️';
    return '📁';
}

async function analyzePhotoInChat(imageSrc) {
    showTypingIndicator();
    
    try {
        const detectedLang = detectLanguageFromText(document.getElementById('chat-input').value) || 'en';
        const response = await analyzeImageWithAI(imageSrc, detectedLang);
        
        removeTypingIndicator();
        addMessageToChat(response, 'ai');
        
    } catch (error) {
        removeTypingIndicator();
        addMessageToChat('Sorry, I had trouble analyzing your image. Please try again!', 'ai');
        console.error('Photo analysis error:', error);
    }
}

async function analyzeDocumentInChat(content, fileType) {
    showTypingIndicator();
    
    try {
        let text = '';
        
        if (fileType === 'text/plain') {
            text = content;
        } else {
            // For PDFs and Word docs, we'd need additional processing
            text = 'Document uploaded - content analysis would require server-side processing';
        }
        
        const detectedLang = detectLanguageFromText(text) || 'en';
        const response = await getAIResponse(`Please help me with this document content: ${text.substring(0, 1000)}`, detectedLang);
        
        removeTypingIndicator();
        addMessageToChat(response, 'ai');
        
    } catch (error) {
        removeTypingIndicator();
        addMessageToChat('Sorry, I had trouble analyzing your document. Please try again!', 'ai');
        console.error('Document analysis error:', error);
    }
}

async function analyzeImageWithAI(imageSrc, language = 'en') {
    const response = await fetch(`${CONFIG.API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4-vision-preview',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful AI tutor. Analyze this homework image and provide educational assistance. ${language !== 'en' ? `Respond in ${getLanguageName(language)}.` : ''}`
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Please help me understand this homework problem. Explain the concepts and provide step-by-step guidance.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageSrc
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        })
    });

    if (!response.ok) {
        throw new Error('Image analysis failed');
    }

    const result = await response.json();
    return result.choices[0].message.content;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b, #ff5252);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Mobile Menu Functions
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (mobileNav.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    mobileNav.classList.add('active');
    toggle.classList.add('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    mobileNav.classList.remove('active');
    toggle.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileNav = document.getElementById('mobile-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (mobileNav && mobileNav.classList.contains('active')) {
        if (!mobileNav.contains(event.target) && !toggle.contains(event.target)) {
            closeMobileMenu();
        }
    }
});

async function analyzeHomework() {
    const image = document.getElementById('preview-image').src;
    
    if (!image) {
        showError('Please upload a homework image first.');
        return;
    }
    
    showLoading('AI is analyzing your homework...');
    
    try {
        // Convert image to base64 if needed
        const base64Image = image.startsWith('data:') ? image.split(',')[1] : image;
        
        // Analyze with GPT-4 Vision
        const solution = await analyzeHomeworkImage(base64Image);
        
        // Display solution
        displaySolution(solution);
        
        // Simulate community support
        setTimeout(() => {
            addVolunteerSupport();
        }, 3000);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error analyzing homework:', error);
        hideLoading();
        showError('Sorry, we couldn\'t analyze your homework. Please try again.');
    }
}

async function analyzeHomeworkImage(base64Image) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4-vision-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Please analyze this homework problem and provide a step-by-step solution that a student can understand. Make it educational, not just the answer. Format your response with clear steps.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        })
    });
    
    if (!response.ok) {
        throw new Error('Image analysis failed');
    }
    
    const result = await response.json();
    return result.choices[0].message.content;
}

async function processHomeworkQuestion(question, language) {
    showLoading('AI is solving your homework...');
    
    try {
        const solution = await solveHomeworkQuestion(question, language);
        displaySolution(solution);
        
        // Add volunteer support
        setTimeout(() => {
            addVolunteerSupport();
        }, 3000);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error processing question:', error);
        hideLoading();
        showError('Sorry, we couldn\'t solve your homework. Please try again.');
    }
}

async function solveHomeworkQuestion(question, language) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful tutor. Provide step-by-step solutions to homework problems. Be educational and encouraging. ${language !== 'en' ? `Respond in the language code: ${language}` : ''}`
                },
                {
                    role: 'user',
                    content: `Please help me solve this homework problem step by step: ${question}`
                }
            ],
            max_tokens: 1000
        })
    });
    
    if (!response.ok) {
        throw new Error('Problem solving failed');
    }
    
    const result = await response.json();
    return result.choices[0].message.content;
}

// UI Display Functions
function displaySolution(solutionText) {
    const aiResponse = document.getElementById('ai-response');
    const solutionSteps = document.getElementById('solution-steps');
    
    // Parse solution into steps
    const steps = solutionText.split('\n').filter(line => line.trim());
    
    let stepsHTML = '';
    steps.forEach((step, index) => {
        if (step.trim()) {
            stepsHTML += `
                <div class="step">
                    <h5>Step ${index + 1}</h5>
                    <p>${step.trim()}</p>
                </div>
            `;
        }
    });
    
    solutionSteps.innerHTML = stepsHTML;
    aiResponse.style.display = 'block';
    
    // Scroll to solution
    aiResponse.scrollIntoView({ behavior: 'smooth' });
}

function addVolunteerSupport() {
    const volunteerComments = document.getElementById('volunteer-comments');
    
    // Clear loading message
    volunteerComments.innerHTML = '';
    
    // Enhanced volunteer responses with more personality
    const comments = [
        {
            name: 'Jessica S.',
            avatar: 'JS',
            school: 'Lincoln High School',
            message: 'Wow! 🤩 You nailed this quadratic equation! I remember when I first learned this - it felt impossible, but you made it look easy! The way you organized each step is exactly how I do it now. Keep up the amazing work! 🌟',
            time: 'just now',
            helpfulCount: 12
        },
        {
            name: 'Marcus T.',
            avatar: 'MT',
            school: 'Washington High School', 
            message: 'YESSS! 🎉 I struggled with this exact same type of problem last year, and seeing you solve it step-by-step just brought back memories. Your work is so clean and organized! You\'re going to ace your next math test! 💪✨',
            time: '1 minute ago',
            helpfulCount: 8
        },
        {
            name: 'Aisha P.',
            avatar: 'AP',
            school: 'Roosevelt High School',
            message: 'This is incredible! 👏 As a senior who tutors math, I can tell you that your problem-solving approach is spot-on. The way you verified your answers at the end? *Chef\'s kiss* 👨‍🍳💋 That\'s what separates good students from great ones!',
            time: '2 minutes ago',
            helpfulCount: 15
        }
    ];
    
    // Add comments one by one with typing effect for wow factor
    comments.forEach((comment, index) => {
        setTimeout(() => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'volunteer-comment';
            commentDiv.style.opacity = '0';
            commentDiv.style.transform = 'translateY(20px)';
            commentDiv.innerHTML = `
                <div class="volunteer-info">
                    <div class="volunteer-avatar" style="background: linear-gradient(135deg, #667eea, #764ba2);">${comment.avatar}</div>
                    <div>
                        <strong>${comment.name}</strong>
                        <small>${comment.school} • ${comment.helpfulCount} students found this helpful</small>
                    </div>
                    <small style="margin-left: auto;">${comment.time}</small>
                </div>
                <p class="typing-message" data-message="${comment.message}"></p>
                <div style="margin-top: 0.5rem;">
                    <button onclick="thankVolunteer('${comment.name}')" style="background: none; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 15px; border-radius: 15px; cursor: pointer; font-size: 0.8rem; margin-right: 10px;">👍 Thank ${comment.name.split(' ')[0]}</button>
                    <button onclick="askFollowUp('${comment.name}')" style="background: none; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 15px; border-radius: 15px; cursor: pointer; font-size: 0.8rem;">💬 Ask Question</button>
                </div>
            `;
            
            volunteerComments.appendChild(commentDiv);
            
            // Animate in
            setTimeout(() => {
                commentDiv.style.opacity = '1';
                commentDiv.style.transform = 'translateY(0)';
                commentDiv.style.transition = 'all 0.5s ease';
                
                // Start typing effect
                setTimeout(() => {
                    typeMessage(commentDiv.querySelector('.typing-message'), comment.message);
                }, 300);
                
            }, 100);
            
        }, index * 2000); // Stagger comments by 2 seconds
    });
}

// Text-to-Speech Function
async function playAudioExplanation() {
    const solutionText = document.getElementById('solution-steps').textContent;
    const language = document.getElementById('language-select').value;
    
    try {
        const audioUrl = await textToSpeech(solutionText, language);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        console.error('Error playing audio:', error);
        showError('Sorry, audio playback is not available right now.');
    }
}

async function textToSpeech(text, language) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/audio/speech`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: 'alloy'
        })
    });
    
    if (!response.ok) {
        throw new Error('Text-to-speech failed');
    }
    
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
}

// Enhanced Volunteer System
function signupVolunteer() {
    // Simulate signup process with realistic flow
    showLoading('Setting up your volunteer profile...');
    
    setTimeout(() => {
        hideLoading();
        
        // Add volunteer to the system (simulate)
        localStorage.setItem('volunteerSignedUp', 'true');
        localStorage.setItem('volunteerName', 'Alex Johnson');
        localStorage.setItem('volunteerSchool', 'Lincoln High School');
        localStorage.setItem('volunteerId', 'vol_' + Date.now());
        
        // Initialize volunteer dashboard
        initializeVolunteerDashboard();
        
        showModal('🎉 Welcome to LearnBridge! You\'re now helping students in your community. Check out your volunteer dashboard!');
        
        // Load initial tickets and requests
        setTimeout(() => {
            loadVolunteerTickets();
            loadAvailableRequests();
        }, 1000);
        
    }, 2000);
}

function initializeVolunteerDashboard() {
    // Hide signup form and show dashboard
    document.getElementById('volunteer-intro').style.display = 'none';
    document.getElementById('volunteer-profile').style.display = 'block';
    document.getElementById('volunteer-quick-stats').style.display = 'flex';
    document.getElementById('ticket-management').style.display = 'block';
    document.getElementById('available-requests').style.display = 'block';
    
    // Initialize ticket system
    loadVolunteerTickets();
}

function loadVolunteerTickets() {
    const ticketList = document.getElementById('ticket-list');
    
    // Sample tickets with realistic data
    const tickets = [
        {
            id: 'TKT-001',
            status: 'in-progress',
            student: 'Maria S.',
            grade: '7th Grade',
            subject: 'Algebra',
            problem: 'Quadratic equations - needs step-by-step help',
            priority: 'high',
            timeAgo: '15 min ago',
            responseTime: '2 min',
            difficulty: 'medium',
            estimatedTime: '10-15 min'
        },
        {
            id: 'TKT-002',
            status: 'assigned',
            student: 'David K.',
            grade: '9th Grade',
            subject: 'Chemistry',
            problem: 'Balancing chemical equations confusion',
            priority: 'medium',
            timeAgo: '32 min ago',
            responseTime: '5 min',
            difficulty: 'easy',
            estimatedTime: '5-10 min'
        },
        {
            id: 'TKT-003',
            status: 'completed',
            student: 'Sofia L.',
            grade: '10th Grade',
            subject: 'English',
            problem: 'Essay structure for Romeo & Juliet analysis',
            priority: 'low',
            timeAgo: '1 hour ago',
            responseTime: 'Completed',
            difficulty: 'hard',
            estimatedTime: '15-20 min',
            rating: '5⭐',
            feedback: 'Super helpful! Thank you so much!'
        },
        {
            id: 'TKT-004',
            status: 'assigned',
            student: 'James R.',
            grade: '11th Grade',
            subject: 'Physics',
            problem: 'Motion and velocity word problems',
            priority: 'high',
            timeAgo: '45 min ago',
            responseTime: '8 min',
            difficulty: 'hard',
            estimatedTime: '20-25 min'
        }
    ];
    
    let ticketHTML = '';
    tickets.forEach(ticket => {
        const statusClass = ticket.status.replace('-', '');
        const priorityColor = getPriorityColor(ticket.priority);
        
        ticketHTML += `
            <div class="ticket-card ${statusClass}" data-status="${ticket.status}" data-subject="${ticket.subject.toLowerCase()}">
                <div class="ticket-header">
                    <div class="ticket-id">${ticket.id}</div>
                    <div class="ticket-status status-${statusClass}">${formatStatus(ticket.status)}</div>
                    <div class="ticket-priority priority-${ticket.priority}" style="background: ${priorityColor};">
                        ${ticket.priority.toUpperCase()}
                    </div>
                </div>
                
                <div class="ticket-content">
                    <div class="student-info">
                        <div class="student-avatar">${ticket.student.split(' ')[0][0]}${ticket.student.split(' ')[1][0]}</div>
                        <div class="student-details">
                            <strong>${ticket.student}</strong>
                            <span>${ticket.grade} • ${ticket.subject}</span>
                        </div>
                        <div class="ticket-time">
                            <span class="time-ago">${ticket.timeAgo}</span>
                            <span class="response-time">Response: ${ticket.responseTime}</span>
                        </div>
                    </div>
                    
                    <div class="problem-description">
                        <p>${ticket.problem}</p>
                    </div>
                    
                    <div class="ticket-meta">
                        <span class="difficulty difficulty-${ticket.difficulty}">
                            <i class="fas fa-signal"></i> ${ticket.difficulty.toUpperCase()}
                        </span>
                        <span class="estimated-time">
                            <i class="fas fa-clock"></i> ${ticket.estimatedTime}
                        </span>
                        ${ticket.rating ? `<span class="ticket-rating">${ticket.rating}</span>` : ''}
                    </div>
                    
                    ${ticket.feedback ? `
                        <div class="student-feedback">
                            <i class="fas fa-quote-left"></i>
                            <em>${ticket.feedback}</em>
                        </div>
                    ` : ''}
                </div>
                
                <div class="ticket-actions">
                    ${getTicketActions(ticket)}
                </div>
            </div>
        `;
    });
    
    ticketList.innerHTML = ticketHTML;
}

function getTicketActions(ticket) {
    switch(ticket.status) {
        case 'assigned':
            return `
                <button onclick="startTicket('${ticket.id}')" class="btn-primary">
                    <i class="fas fa-play"></i> Start Helping
                </button>
                <button onclick="viewTicketDetails('${ticket.id}')" class="btn-secondary">
                    <i class="fas fa-eye"></i> View Details
                </button>
            `;
        case 'in-progress':
            return `
                <button onclick="continueTicket('${ticket.id}')" class="btn-primary">
                    <i class="fas fa-comments"></i> Continue Chat
                </button>
                <button onclick="completeTicket('${ticket.id}')" class="btn-success">
                    <i class="fas fa-check"></i> Mark Complete
                </button>
            `;
        case 'completed':
            return `
                <button onclick="viewTicketDetails('${ticket.id}')" class="btn-secondary">
                    <i class="fas fa-history"></i> View History
                </button>
                <button onclick="requestFeedback('${ticket.id}')" class="btn-outline">
                    <i class="fas fa-star"></i> Request Review
                </button>
            `;
        default:
            return '';
    }
}

function loadAvailableRequests() {
    const helpRequests = document.getElementById('help-requests');
    
    const availableRequests = [
        {
            id: 'REQ-001',
            student: 'Anonymous Student',
            grade: '8th Grade',
            subject: 'Geometry',
            problem: 'Triangle angle calculations - need help understanding',
            priority: 'medium',
            timeWaiting: '3 min',
            difficulty: 'easy',
            aiSolution: 'Provided',
            tags: ['geometry', 'triangles', 'angles']
        },
        {
            id: 'REQ-002',
            student: 'Anonymous Student', 
            grade: '12th Grade',
            subject: 'Calculus',
            problem: 'Derivatives and chain rule application',
            priority: 'high',
            timeWaiting: '8 min',
            difficulty: 'hard',
            aiSolution: 'Provided',
            tags: ['calculus', 'derivatives', 'chain-rule']
        },
        {
            id: 'REQ-003',
            student: 'Anonymous Student',
            grade: '6th Grade', 
            subject: 'Math',
            problem: 'Fraction multiplication and division',
            priority: 'low',
            timeWaiting: '1 min',
            difficulty: 'easy',
            aiSolution: 'Provided',
            tags: ['fractions', 'multiplication', 'division']
        }
    ];
    
    let requestHTML = '';
    availableRequests.forEach(request => {
        const priorityColor = getPriorityColor(request.priority);
        
        requestHTML += `
            <div class="request-card available" data-subject="${request.subject.toLowerCase()}">
                <div class="request-header">
                    <div class="request-id">${request.id}</div>
                    <div class="request-priority priority-${request.priority}" style="background: ${priorityColor};">
                        ${request.priority.toUpperCase()}
                    </div>
                    <div class="waiting-time">
                        <i class="fas fa-clock"></i> Waiting ${request.timeWaiting}
                    </div>
                </div>
                
                <div class="request-info">
                    <div class="subject-info">
                        <span class="subject-tag">${request.subject}</span>
                        <span class="grade-tag">${request.grade}</span>
                        <span class="difficulty difficulty-${request.difficulty}">
                            <i class="fas fa-signal"></i> ${request.difficulty.toUpperCase()}
                        </span>
                    </div>
                    
                    <p class="problem-text">${request.problem}</p>
                    
                    <div class="request-tags">
                        ${request.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                    
                    <div class="ai-status">
                        <i class="fas fa-robot"></i> AI Solution: ${request.aiSolution}
                    </div>
                </div>
                
                <div class="request-actions">
                    <button onclick="claimRequest('${request.id}')" class="btn-primary">
                        <i class="fas fa-hand-paper"></i> Claim Ticket
                    </button>
                    <button onclick="viewRequestDetails('${request.id}')" class="btn-secondary">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                </div>
            </div>
        `;
    });
    
    helpRequests.innerHTML = requestHTML;
}

function helpStudent(requestId) {
    // Get the request card and show helping process
    const requestCard = event.target.closest('.request-card');
    const originalContent = requestCard.innerHTML;
    
    // Show helping process
    requestCard.style.background = 'linear-gradient(135deg, #ffeaa7, #fab1a0)';
    event.target.textContent = 'Adding Support...';
    event.target.disabled = true;
    
    setTimeout(() => {
        // Show the help being added
        const helpModal = document.createElement('div');
        helpModal.className = 'modal';
        helpModal.style.display = 'flex';
        helpModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3><i class="fas fa-heart" style="color: #e74c3c;"></i> Add Your Support</h3>
                <div style="margin: 1rem 0;">
                    <strong>Student's Problem:</strong> ${requestCard.querySelector('p').textContent}
                </div>
                <textarea id="support-message" placeholder="Write an encouraging message..." style="width: 100%; height: 80px; margin: 1rem 0; padding: 10px; border-radius: 8px; border: 2px solid #ddd;"></textarea>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="submitSupport('${requestId}')" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Send Support</button>
                    <button onclick="closeHelpModal()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(helpModal);
        
        // Pre-fill with encouraging message
        setTimeout(() => {
            document.getElementById('support-message').value = "Great job tackling this problem! I remember struggling with this exact type of question last year. The key is to take it step by step - you've got this! 🌟 Keep practicing and you'll master it in no time!";
        }, 500);
        
    }, 1500);
}

function submitSupport(requestId) {
    const message = document.getElementById('support-message').value;
    
    showLoading('Sending your encouragement to the student...');
    
    setTimeout(() => {
        hideLoading();
        closeHelpModal();
        
        // Remove the request card with animation
        const requestCard = document.querySelector('.request-card');
        if (requestCard) {
            requestCard.style.transform = 'translateX(100%)';
            requestCard.style.opacity = '0';
            setTimeout(() => {
                requestCard.remove();
                
                // Add new request to keep the flow going
                addNewHelpRequest();
                
            }, 500);
        }
        
        // Update volunteer stats
        updateVolunteerStats();
        
        showModal('🎉 Amazing! Your encouragement was sent to Maria (7th grade). She just replied: "Thank you so much! This really helps!" You\'re making a real difference!');
        
    }, 2000);
}

function closeHelpModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function loadMoreHelpRequests() {
    const helpRequests = document.getElementById('help-requests');
    
    // Add realistic new requests
    const newRequests = [
        {
            subject: 'Chemistry',
            problem: 'Balancing chemical equations - needs step-by-step help',
            time: '2 minutes ago',
            student: 'David (9th grade)'
        },
        {
            subject: 'English',
            problem: 'Essay structure for Romeo & Juliet analysis',
            time: '5 minutes ago', 
            student: 'Sofia (10th grade)'
        },
        {
            subject: 'Physics',
            problem: 'Motion and velocity word problems',
            time: '8 minutes ago',
            student: 'James (11th grade)'
        }
    ];
    
    newRequests.forEach((req, index) => {
        setTimeout(() => {
            const requestCard = document.createElement('div');
            requestCard.className = 'request-card';
            requestCard.style.opacity = '0';
            requestCard.style.transform = 'translateY(20px)';
            requestCard.innerHTML = `
                <div class="request-info">
                    <span class="subject-tag">${req.subject}</span>
                    <p>${req.problem}</p>
                    <small>AI solution provided • ${req.time} • ${req.student}</small>
                </div>
                <button onclick="helpStudent('req_${Date.now()}_${index}')" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 600;">Add Support</button>
            `;
            
            helpRequests.appendChild(requestCard);
            
            // Animate in
            setTimeout(() => {
                requestCard.style.opacity = '1';
                requestCard.style.transform = 'translateY(0)';
                requestCard.style.transition = 'all 0.5s ease';
            }, 100);
            
        }, index * 200);
    });
}

// Utility Functions for Volunteer System
function getPriorityColor(priority) {
    switch(priority) {
        case 'high': return 'linear-gradient(135deg, #dc3545, #c82333)';
        case 'medium': return 'linear-gradient(135deg, #ffc107, #e0a800)';
        case 'low': return 'linear-gradient(135deg, #28a745, #1e7e34)';
        default: return 'linear-gradient(135deg, #6c757d, #545b62)';
    }
}

function formatStatus(status) {
    return status.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function filterTickets(status) {
    const tickets = document.querySelectorAll('.ticket-card');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide tickets based on filter
    tickets.forEach(ticket => {
        if (status === 'all' || ticket.dataset.status === status) {
            ticket.style.display = 'block';
            ticket.style.animation = 'slideInUp 0.3s ease';
        } else {
            ticket.style.display = 'none';
        }
    });
    
    // Update ticket count
    const visibleCount = document.querySelectorAll('.ticket-card[style*="block"]').length;
    updateTicketCount(status, visibleCount);
}

function filterBySubject(subject) {
    const tickets = document.querySelectorAll('.ticket-card');
    const requests = document.querySelectorAll('.request-card');
    
    const allCards = [...tickets, ...requests];
    
    allCards.forEach(card => {
        if (subject === 'all' || card.dataset.subject === subject) {
            card.style.display = 'block';
            card.style.animation = 'slideInUp 0.3s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

function updateTicketCount(status, count) {
    const statusText = status === 'all' ? 'All Tickets' : formatStatus(status);
    const countElement = document.querySelector('.ticket-count');
    if (countElement) {
        countElement.textContent = `${statusText} (${count})`;
    }
}

// Ticket Action Functions
function startTicket(ticketId) {
    showLoading('Starting support session...');
    
    setTimeout(() => {
        hideLoading();
        showModal(`🚀 Support session started for ${ticketId}! Student is now connected to your chat.`);
        
        // Update ticket status
        const ticketCard = document.querySelector(`[data-ticket-id="${ticketId}"]`);
        if (ticketCard) {
            ticketCard.classList.remove('assigned');
            ticketCard.classList.add('inprogress');
        }
        
        // Simulate chat opening
        setTimeout(() => {
            openChatInterface(ticketId);
        }, 1000);
    }, 1500);
}

function continueTicket(ticketId) {
    showModal('📱 Reopening chat session...');
    setTimeout(() => {
        openChatInterface(ticketId);
    }, 800);
}

function completeTicket(ticketId) {
    showLoading('Completing ticket and requesting student feedback...');
    
    setTimeout(() => {
        hideLoading();
        showModal('✅ Ticket completed! Student feedback has been requested. Great job helping!');
        
        // Update volunteer stats
        updateVolunteerStats();
        
        // Refresh ticket list
        setTimeout(loadVolunteerTickets, 1000);
    }, 2000);
}

function claimRequest(requestId) {
    showLoading('Claiming help request...');
    
    setTimeout(() => {
        hideLoading();
        showModal(`🎯 Request ${requestId} claimed! It's now added to your active tickets.`);
        
        // Remove from available requests
        const requestCard = document.querySelector(`[data-request-id="${requestId}"]`);
        if (requestCard) {
            requestCard.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => requestCard.remove(), 500);
        }
        
        // Update ticket count and refresh
        setTimeout(() => {
            loadVolunteerTickets();
            loadAvailableRequests();
        }, 1000);
    }, 1500);
}

function viewTicketDetails(ticketId) {
    // Create detailed ticket view modal
    const modalContent = `
        <div class="ticket-details-modal">
            <div class="detail-header">
                <h3><i class="fas fa-ticket-alt"></i> Ticket ${ticketId}</h3>
                <div class="ticket-timeline">
                    <div class="timeline-item completed">
                        <i class="fas fa-plus"></i>
                        <span>Ticket Created - 2:30 PM</span>
                    </div>
                    <div class="timeline-item completed">
                        <i class="fas fa-user"></i>
                        <span>Assigned to You - 2:32 PM</span>
                    </div>
                    <div class="timeline-item active">
                        <i class="fas fa-comments"></i>
                        <span>In Progress - 2:35 PM</span>
                    </div>
                </div>
            </div>
            
            <div class="student-profile">
                <h4>Student Information</h4>
                <div class="profile-grid">
                    <div>Grade Level: 7th Grade</div>
                    <div>Subject: Algebra</div>
                    <div>Learning Style: Visual</div>
                    <div>Previous Sessions: 3</div>
                </div>
            </div>
            
            <div class="conversation-summary">
                <h4>Conversation Summary</h4>
                <div class="chat-preview">
                    <div class="message student">Hi! I'm really confused about quadratic equations...</div>
                    <div class="message volunteer">No problem! Let's break it down step by step. What specifically is confusing you?</div>
                    <div class="message student">I don't understand how to find the roots...</div>
                </div>
            </div>
        </div>
    `;
    
    showCustomModal('Ticket Details', modalContent);
}

function viewRequestDetails(requestId) {
    // Create detailed request preview modal
    const modalContent = `
        <div class="request-details-modal">
            <div class="detail-header">
                <h3><i class="fas fa-question-circle"></i> Help Request ${requestId}</h3>
                <div class="request-meta">
                    <span class="priority-high">HIGH PRIORITY</span>
                    <span class="waiting-time">Waiting 8 minutes</span>
                </div>
            </div>
            
            <div class="problem-details">
                <h4>Problem Description</h4>
                <p>Student is struggling with derivatives and chain rule application in Calculus. They've submitted a photo of their work showing confusion with composite function differentiation.</p>
                
                <div class="ai-analysis">
                    <h5><i class="fas fa-robot"></i> AI Analysis</h5>
                    <ul>
                        <li>Student correctly identified the composite function</li>
                        <li>Made error in applying chain rule step 2</li>
                        <li>Needs clarification on derivative of inner function</li>
                        <li>Recommended approach: Step-by-step walkthrough with examples</li>
                    </ul>
                </div>
                
                <div class="student-work">
                    <h5>Student's Work (Photo)</h5>
                    <div class="work-preview">
                        <i class="fas fa-image"></i>
                        <span>calculus_problem_photo.jpg</span>
                        <button class="btn-secondary">View Full Image</button>
                    </div>
                </div>
            </div>
            
            <div class="volunteer-match">
                <h4>Why This Matches You</h4>
                <div class="match-reasons">
                    <div class="match-item">
                        <i class="fas fa-check-circle"></i>
                        <span>You've successfully helped 12 calculus students</span>
                    </div>
                    <div class="match-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Your expertise includes derivatives and chain rule</span>
                    </div>
                    <div class="match-item">
                        <i class="fas fa-check-circle"></i>
                        <span>High student rating for math tutoring (4.9/5)</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showCustomModal('Request Preview', modalContent, '700px');
}

function openChatInterface(ticketId) {
    // This would typically open a real chat interface
    // For now, simulate with a demo modal
    const chatContent = `
        <div class="chat-interface">
            <div class="chat-header">
                <div class="student-info">
                    <div class="avatar">MS</div>
                    <div>
                        <strong>Maria S. (7th Grade)</strong>
                        <span>Algebra - Quadratic Equations</span>
                    </div>
                </div>
                <div class="chat-status">
                    <span class="status-indicator active"></span>
                    Active Session
                </div>
            </div>
            
            <div class="chat-messages">
                <div class="message student">
                    <div class="message-content">
                        Hi! I'm really confused about this quadratic equation: x² + 5x + 6 = 0. 
                        I don't know how to find the solutions.
                    </div>
                    <div class="message-time">2:35 PM</div>
                </div>
                
                <div class="ai-suggestion">
                    <i class="fas fa-robot"></i>
                    <strong>AI Suggestion:</strong> Consider using the factoring method or quadratic formula. 
                    Student might benefit from visual representation.
                </div>
            </div>
            
            <div class="chat-input">
                <textarea placeholder="Type your response to help Maria..."></textarea>
                <div class="input-actions">
                    <button class="btn-secondary"><i class="fas fa-image"></i> Image</button>
                    <button class="btn-secondary"><i class="fas fa-calculator"></i> Tools</button>
                    <button class="btn-primary">Send <i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;
    
    showCustomModal(`Chat Session - ${ticketId}`, chatContent, '900px');
}

function updateVolunteerStats() {
    // Update the quick stats display
    const statsElements = {
        'active-tickets': document.querySelector('#active-tickets .stat-number'),
        'completed-today': document.querySelector('#completed-today .stat-number'),
        'avg-rating': document.querySelector('#avg-rating .stat-number'),
        'response-time': document.querySelector('#response-time .stat-number')
    };
    
    // Increment completed today
    if (statsElements['completed-today']) {
        const current = parseInt(statsElements['completed-today'].textContent);
        statsElements['completed-today'].textContent = current + 1;
    }
    
    // Update active tickets (decrease by 1)
    if (statsElements['active-tickets']) {
        const current = parseInt(statsElements['active-tickets'].textContent);
        statsElements['active-tickets'].textContent = Math.max(0, current - 1);
    }
}

function showCustomModal(title, content, width = '600px') {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.innerHTML = `
        <div class="custom-modal" style="max-width: ${width};">
            <div class="modal-header">
                <h3>${title}</h3>
                <button onclick="this.closest('.custom-modal-overlay').remove()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.custom-modal').style.transform = 'translateY(0) scale(1)';
    }, 10);
}

// Enhanced Teacher Dashboard Functions
function loadTeacherInsights() {
    // Load comprehensive teacher dashboard data
    loadClassroomAnalytics();
    loadStudentStrugglingAreas();
    loadVolunteerActivity();
    loadCurriculumRecommendations();
    loadStudentProgress();
}

function loadClassroomAnalytics() {
    const analyticsContainer = document.getElementById('classroom-analytics');
    if (!analyticsContainer) return;
    
    const analyticsData = {
        totalStudents: 127,
        activeToday: 43,
        helpRequests: 18,
        avgAccuracy: 78,
        improvementRate: '+12%',
        topStrugglingSubjects: ['Algebra', 'Chemistry', 'Essay Writing'],
        mostRequestedHelp: 'Quadratic Equations',
        peakHelpTimes: ['3:00-4:00 PM', '7:00-8:00 PM']
    };
    
    analyticsContainer.innerHTML = `
        <div class="analytics-grid">
            <div class="analytics-card highlight-card">
                <div class="analytics-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="analytics-content">
                    <h3>${analyticsData.totalStudents}</h3>
                    <p>Total Students Using LearnBridge</p>
                    <small>${analyticsData.activeToday} active today</small>
                </div>
            </div>
            
            <div class="analytics-card">
                <div class="analytics-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <div class="analytics-content">
                    <h3>${analyticsData.helpRequests}</h3>
                    <p>Help Requests Today</p>
                    <small>Peak: ${analyticsData.peakHelpTimes[0]}</small>
                </div>
            </div>
            
            <div class="analytics-card">
                <div class="analytics-icon success">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="analytics-content">
                    <h3>${analyticsData.avgAccuracy}%</h3>
                    <p>Average Problem Accuracy</p>
                    <small class="success-text">${analyticsData.improvementRate} from last week</small>
                </div>
            </div>
            
            <div class="analytics-card warning">
                <div class="analytics-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="analytics-content">
                    <h3>${analyticsData.mostRequestedHelp}</h3>
                    <p>Most Requested Help Topic</p>
                    <small>32% of all requests</small>
                </div>
            </div>
        </div>
    `;
}

function loadStudentStrugglingAreas() {
    const strugglingContainer = document.getElementById('struggling-areas');
    if (!strugglingContainer) return;
    
    const strugglingData = [
        {
            topic: 'Quadratic Equations',
            subject: 'Algebra',
            studentCount: 23,
            avgAccuracy: 45,
            trend: 'increasing',
            urgency: 'high',
            suggestions: ['More visual examples', 'Step-by-step practice', 'Peer tutoring']
        },
        {
            topic: 'Chemical Balancing',
            subject: 'Chemistry', 
            studentCount: 18,
            avgAccuracy: 52,
            trend: 'stable',
            urgency: 'medium',
            suggestions: ['Interactive simulations', 'Practice worksheets', 'Video tutorials']
        },
        {
            topic: 'Essay Structure',
            subject: 'English',
            studentCount: 15,
            avgAccuracy: 38,
            trend: 'decreasing',
            urgency: 'high',
            suggestions: ['Outline templates', 'Example analysis', 'Writing workshops']
        },
        {
            topic: 'Derivative Rules',
            subject: 'Calculus',
            studentCount: 12,
            avgAccuracy: 41,
            trend: 'increasing',
            urgency: 'medium',
            suggestions: ['Chain rule breakdown', 'Practice problems', 'Concept mapping']
        }
    ];
    
    let strugglingHTML = '';
    strugglingData.forEach((area, index) => {
        const trendIcon = area.trend === 'increasing' ? 'fa-arrow-up' : 
                         area.trend === 'decreasing' ? 'fa-arrow-down' : 'fa-minus';
        const trendColor = area.trend === 'increasing' ? '#e74c3c' : 
                          area.trend === 'decreasing' ? '#27ae60' : '#f39c12';
        const urgencyClass = area.urgency === 'high' ? 'urgent' : area.urgency === 'medium' ? 'moderate' : 'low';
        
        strugglingHTML += `
            <div class="struggling-card ${urgencyClass}" data-index="${index}">
                <div class="struggling-header">
                    <div class="topic-info">
                        <h4>${area.topic}</h4>
                        <span class="subject-badge ${area.subject.toLowerCase()}">${area.subject}</span>
                        <span class="urgency-badge ${urgencyClass}">${area.urgency.toUpperCase()} PRIORITY</span>
                    </div>
                    <div class="trend-indicator" style="color: ${trendColor};">
                        <i class="fas ${trendIcon}"></i>
                        <span>${area.trend}</span>
                    </div>
                </div>
                
                <div class="struggling-stats">
                    <div class="stat-item">
                        <div class="stat-circle">
                            <span class="stat-number">${area.studentCount}</span>
                        </div>
                        <span class="stat-label">Students Struggling</span>
                    </div>
                    <div class="stat-item">
                        <div class="accuracy-bar">
                            <div class="accuracy-fill" style="width: ${area.avgAccuracy}%"></div>
                            <span class="accuracy-text">${area.avgAccuracy}%</span>
                        </div>
                        <span class="stat-label">Average Accuracy</span>
                    </div>
                </div>
                
                <div class="suggestions-section">
                    <h5><i class="fas fa-lightbulb"></i> AI Recommendations:</h5>
                    <ul class="suggestions-list">
                        ${area.suggestions.map(suggestion => `
                            <li><i class="fas fa-check-circle"></i> ${suggestion}</li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="struggling-actions">
                    <button onclick="createLessonPlan('${area.topic}')" class="btn-primary">
                        <i class="fas fa-clipboard-list"></i> Generate Lesson Plan
                    </button>
                    <button onclick="viewDetailedAnalysis('${area.topic}')" class="btn-secondary">
                        <i class="fas fa-chart-bar"></i> Detailed Analysis
                    </button>
                    <button onclick="shareWithColleagues('${area.topic}')" class="btn-outline">
                        <i class="fas fa-share"></i> Share Insights
                    </button>
                </div>
            </div>
        `;
    });
    
    strugglingContainer.innerHTML = strugglingHTML;
}

function loadVolunteerActivity() {
    const volunteerContainer = document.getElementById('volunteer-activity');
    if (!volunteerContainer) return;
    
    const volunteerData = {
        totalVolunteers: 89,
        activeToday: 23,
        totalHelpProvided: 342,
        avgResponseTime: '3.2 min',
        topVolunteers: [
            { name: 'Jessica S.', school: 'Lincoln High', helped: 47, rating: 4.9, avatar: 'JS' },
            { name: 'Marcus T.', school: 'Washington High', helped: 41, rating: 4.8, avatar: 'MT' },
            { name: 'Aisha P.', school: 'Roosevelt High', helped: 38, rating: 4.9, avatar: 'AP' },
            { name: 'Kevin M.', school: 'Jefferson High', helped: 35, rating: 4.7, avatar: 'KM' },
            { name: 'Lisa R.', school: 'Lincoln High', helped: 33, rating: 4.8, avatar: 'LR' }
        ]
    };
    
    volunteerContainer.innerHTML = `
        <div class="volunteer-overview">
            <div class="volunteer-stats-grid">
                <div class="volunteer-stat-card">
                    <div class="stat-icon"><i class="fas fa-hands-helping"></i></div>
                    <div class="stat-content">
                        <h3>${volunteerData.totalVolunteers}</h3>
                        <p>Active Volunteers</p>
                        <small><span class="online-indicator"></span> ${volunteerData.activeToday} helping right now</small>
                    </div>
                </div>
                <div class="volunteer-stat-card">
                    <div class="stat-icon"><i class="fas fa-comments"></i></div>
                    <div class="stat-content">
                        <h3>${volunteerData.totalHelpProvided}</h3>
                        <p>Help Sessions This Week</p>
                        <small class="success-text">+15% from last week</small>
                    </div>
                </div>
                <div class="volunteer-stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <h3>${volunteerData.avgResponseTime}</h3>
                        <p>Average Response Time</p>
                        <small class="success-text">2.1 min faster than average</small>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="top-volunteers-section">
            <div class="section-header">
                <h4><i class="fas fa-trophy"></i> Top Performing Volunteers</h4>
                <button onclick="viewAllVolunteers()" class="btn-outline">View All</button>
            </div>
            <div class="volunteers-list">
                ${volunteerData.topVolunteers.map((volunteer, index) => `
                    <div class="volunteer-item ${index === 0 ? 'top-performer' : ''}">
                        <div class="volunteer-rank">#${index + 1}</div>
                        <div class="volunteer-avatar">${volunteer.avatar}</div>
                        <div class="volunteer-info">
                            <h5>${volunteer.name}</h5>
                            <p>${volunteer.school}</p>
                            <div class="volunteer-metrics">
                                <span><i class="fas fa-users"></i> ${volunteer.helped} helped</span>
                                <span><i class="fas fa-star"></i> ${volunteer.rating}/5.0</span>
                            </div>
                        </div>
                        <div class="volunteer-actions">
                            <button onclick="sendRecognition('${volunteer.name}')" class="btn-primary">
                                <i class="fas fa-medal"></i> Recognize
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function loadCurriculumRecommendations() {
    const curriculumContainer = document.getElementById('curriculum-recommendations');
    if (!curriculumContainer) return;
    
    const recommendations = [
        {
            type: 'lesson-plan',
            title: 'Interactive Quadratic Equations Workshop',
            description: 'Based on student struggles, create hands-on activities for quadratic equations',
            priority: 'high',
            timeEstimate: '2 weeks',
            studentsImpacted: 23,
            resources: ['GeoGebra simulations', 'Practice worksheets', 'Video tutorials']
        },
        {
            type: 'assessment',
            title: 'Chemical Balancing Checkpoint Quiz',
            description: 'Quick assessment to identify specific areas of confusion in chemical equations',
            priority: 'medium',
            timeEstimate: '1 week',
            studentsImpacted: 18,
            resources: ['Online quiz platform', 'Immediate feedback system']
        },
        {
            type: 'intervention',
            title: 'Essay Writing Intensive Program',
            description: 'Targeted intervention for students struggling with essay structure',
            priority: 'high',
            timeEstimate: '3 weeks',
            studentsImpacted: 15,
            resources: ['Writing templates', 'Peer review system', 'Expert examples']
        }
    ];
    
    let recommendationsHTML = '';
    recommendations.forEach((rec, index) => {
        const priorityClass = rec.priority === 'high' ? 'high-priority' : 'medium-priority';
        const typeIcon = rec.type === 'lesson-plan' ? 'fa-clipboard-list' : 
                        rec.type === 'assessment' ? 'fa-clipboard-check' : 'fa-user-md';
        
        recommendationsHTML += `
            <div class="recommendation-card ${priorityClass}">
                <div class="recommendation-header">
                    <div class="rec-icon">
                        <i class="fas ${typeIcon}"></i>
                    </div>
                    <div class="rec-info">
                        <h4>${rec.title}</h4>
                        <p class="rec-description">${rec.description}</p>
                    </div>
                    <div class="priority-indicator ${priorityClass}">
                        ${rec.priority.toUpperCase()}
                    </div>
                </div>
                
                <div class="recommendation-metrics">
                    <div class="metric-item">
                        <i class="fas fa-users"></i>
                        <span>${rec.studentsImpacted} Students</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-calendar"></i>
                        <span>${rec.timeEstimate}</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-book"></i>
                        <span>${rec.resources.length} Resources</span>
                    </div>
                </div>
                
                <div class="resources-preview">
                    <h5>Resources Needed:</h5>
                    <div class="resource-tags">
                        ${rec.resources.map(resource => `
                            <span class="resource-tag">${resource}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="recommendation-actions">
                    <button onclick="implementRecommendation(${index})" class="btn-primary">
                        <i class="fas fa-play"></i> Implement Now
                    </button>
                    <button onclick="scheduleRecommendation(${index})" class="btn-secondary">
                        <i class="fas fa-calendar-plus"></i> Schedule
                    </button>
                    <button onclick="shareRecommendation(${index})" class="btn-outline">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `;
    });
    
    curriculumContainer.innerHTML = recommendationsHTML;
}

function loadStudentProgress() {
    const progressContainer = document.getElementById('student-progress');
    if (!progressContainer) return;
    
    const progressData = [
        {
            name: 'Maria S.',
            grade: '7th Grade',
            avatar: 'MS',
            subjects: [
                { name: 'Algebra', progress: 72, trend: 'up', recentActivity: 'Completed quadratic equations practice' },
                { name: 'Geometry', progress: 85, trend: 'stable', recentActivity: 'Working on triangle properties' }
            ],
            helpRequestsCount: 3,
            volunteerFeedback: 'Very engaged and asks great questions!',
            lastActive: '2 hours ago'
        },
        {
            name: 'David K.',
            grade: '9th Grade',
            avatar: 'DK',
            subjects: [
                { name: 'Chemistry', progress: 68, trend: 'up', recentActivity: 'Struggling with chemical balancing' },
                { name: 'Physics', progress: 78, trend: 'down', recentActivity: 'Completed motion problems' }
            ],
            helpRequestsCount: 5,
            volunteerFeedback: 'Needs more confidence but shows good understanding',
            lastActive: '45 minutes ago'
        },
        {
            name: 'Sofia L.',
            grade: '10th Grade',
            avatar: 'SL',
            subjects: [
                { name: 'English', progress: 82, trend: 'up', recentActivity: 'Submitted Romeo & Juliet essay' },
                { name: 'History', progress: 75, trend: 'stable', recentActivity: 'Research on Civil War' }
            ],
            helpRequestsCount: 2,
            volunteerFeedback: 'Excellent writer, very creative approaches',
            lastActive: '1 hour ago'
        }
    ];
    
    let progressHTML = '';
    progressData.forEach(student => {
        progressHTML += `
            <div class="student-progress-card">
                <div class="student-header">
                    <div class="student-avatar">${student.avatar}</div>
                    <div class="student-basic-info">
                        <h4>${student.name}</h4>
                        <p>${student.grade}</p>
                        <small class="last-active">Active ${student.lastActive}</small>
                    </div>
                    <div class="help-indicator">
                        <span class="help-count">${student.helpRequestsCount}</span>
                        <small>Help Requests</small>
                    </div>
                </div>
                
                <div class="subjects-progress">
                    ${student.subjects.map(subject => {
                        const trendIcon = subject.trend === 'up' ? 'fa-arrow-up' : 
                                         subject.trend === 'down' ? 'fa-arrow-down' : 'fa-minus';
                        const trendColor = subject.trend === 'up' ? '#27ae60' : 
                                          subject.trend === 'down' ? '#e74c3c' : '#f39c12';
                        
                        return `
                            <div class="subject-progress-item">
                                <div class="subject-header">
                                    <span class="subject-name">${subject.name}</span>
                                    <div class="progress-trend" style="color: ${trendColor};">
                                        <i class="fas ${trendIcon}"></i>
                                        <span>${subject.progress}%</span>
                                    </div>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${subject.progress}%"></div>
                                </div>
                                <small class="recent-activity">${subject.recentActivity}</small>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="volunteer-feedback-section">
                    <h5><i class="fas fa-comment"></i> Latest Volunteer Feedback:</h5>
                    <p class="feedback-text">"${student.volunteerFeedback}"</p>
                </div>
                
                <div class="student-actions">
                    <button onclick="viewFullProgress('${student.name}')" class="btn-primary">
                        <i class="fas fa-chart-line"></i> Full Progress
                    </button>
                    <button onclick="sendEncouragement('${student.name}')" class="btn-secondary">
                        <i class="fas fa-heart"></i> Send Note
                    </button>
                    <button onclick="flagForAttention('${student.name}')" class="btn-outline">
                        <i class="fas fa-flag"></i> Flag
                    </button>
                </div>
            </div>
        `;
    });
    
    progressContainer.innerHTML = progressHTML;
}

// Teacher Action Functions
function createLessonPlan(topic) {
    showLoading(`Generating AI-powered lesson plan for ${topic}...`);
    
    setTimeout(() => {
        hideLoading();
        const lessonPlan = generateLessonPlanContent(topic);
        showCustomModal(`📚 Lesson Plan: ${topic}`, lessonPlan, '900px');
    }, 2500);
}

function generateLessonPlanContent(topic) {
    return `
        <div class="lesson-plan-content">
            <div class="lesson-header">
                <h3>Interactive ${topic} Workshop</h3>
                <div class="lesson-meta">
                    <span><i class="fas fa-clock"></i> 90 minutes</span>
                    <span><i class="fas fa-users"></i> 23 students</span>
                    <span><i class="fas fa-target"></i> Medium difficulty</span>
                </div>
            </div>
            
            <div class="lesson-objectives">
                <h4>🎯 Learning Objectives</h4>
                <ul>
                    <li>Students will understand the fundamental concepts of ${topic}</li>
                    <li>Students will solve problems using step-by-step methods</li>
                    <li>Students will connect ${topic} to real-world applications</li>
                </ul>
            </div>
            
            <div class="lesson-structure">
                <h4>📋 Lesson Structure</h4>
                <div class="lesson-phases">
                    <div class="phase">
                        <h5>Phase 1: Introduction (15 min)</h5>
                        <p>Hook students with real-world example, review prerequisites</p>
                    </div>
                    <div class="phase">
                        <h5>Phase 2: Guided Practice (30 min)</h5>
                        <p>Step-by-step walkthrough with interactive examples</p>
                    </div>
                    <div class="phase">
                        <h5>Phase 3: Collaborative Work (30 min)</h5>
                        <p>Students work in pairs on structured problems</p>
                    </div>
                    <div class="phase">
                        <h5>Phase 4: Assessment & Wrap-up (15 min)</h5>
                        <p>Quick check, address misconceptions, preview next lesson</p>
                    </div>
                </div>
            </div>
            
            <div class="lesson-resources">
                <h4>📚 Resources Included</h4>
                <div class="resource-list">
                    <div class="resource-item">
                        <i class="fas fa-file-powerpoint"></i>
                        <span>Interactive Presentation (25 slides)</span>
                    </div>
                    <div class="resource-item">
                        <i class="fas fa-tasks"></i>
                        <span>Practice Worksheet (15 problems)</span>
                    </div>
                    <div class="resource-item">
                        <i class="fas fa-video"></i>
                        <span>Concept Video (8 minutes)</span>
                    </div>
                    <div class="resource-item">
                        <i class="fas fa-clipboard-check"></i>
                        <span>Exit Ticket Assessment</span>
                    </div>
                </div>
            </div>
            
            <div class="lesson-actions">
                <button onclick="downloadLessonPlan('${topic}')" class="btn-primary">
                    <i class="fas fa-download"></i> Download Complete Plan
                </button>
                <button onclick="addToCalendar('${topic}')" class="btn-secondary">
                    <i class="fas fa-calendar-plus"></i> Add to Calendar
                </button>
                <button onclick="shareWithTeam('${topic}')" class="btn-outline">
                    <i class="fas fa-share"></i> Share with Team
                </button>
            </div>
        </div>
    `;
}

function viewDetailedAnalysis(topic) {
    showLoading(`Analyzing detailed data for ${topic}...`);
    
    setTimeout(() => {
        hideLoading();
        const analysis = generateDetailedAnalysis(topic);
        showCustomModal(`📊 Detailed Analysis: ${topic}`, analysis, '900px');
    }, 2000);
}

function generateDetailedAnalysis(topic) {
    return `
        <div class="detailed-analysis-content">
            <div class="analysis-overview">
                <h3>${topic} - Detailed Analysis</h3>
                <div class="time-period">
                    <span>Analysis Period: Last 30 days</span>
                </div>
            </div>
            
            <div class="analysis-charts">
                <div class="chart-container">
                    <h4>📈 Performance Trend</h4>
                    <div class="mock-chart">
                        <div class="chart-bars">
                            <div class="bar" style="height: 45%;">45%</div>
                            <div class="bar" style="height: 52%;">52%</div>
                            <div class="bar" style="height: 48%;">48%</div>
                            <div class="bar" style="height: 61%;">61%</div>
                            <div class="bar" style="height: 58%;">58%</div>
                        </div>
                        <div class="chart-labels">
                            <span>Week 1</span>
                            <span>Week 2</span>
                            <span>Week 3</span>
                            <span>Week 4</span>
                            <span>Week 5</span>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-stats">
                    <div class="stat-box">
                        <h5>Common Mistakes</h5>
                        <ul>
                            <li>Forgetting to distribute negative signs (67%)</li>
                            <li>Incorrect factoring approach (45%)</li>
                            <li>Arithmetic errors in solutions (34%)</li>
                        </ul>
                    </div>
                    
                    <div class="stat-box">
                        <h5>Success Patterns</h5>
                        <ul>
                            <li>Visual learners improved 23% faster</li>
                            <li>Peer tutoring increased success rate by 31%</li>
                            <li>Practice problems correlation: 0.84</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="recommendations-section">
                <h4>🎯 Targeted Recommendations</h4>
                <div class="recommendation-item high-impact">
                    <div class="rec-header">
                        <span class="impact-badge high">HIGH IMPACT</span>
                        <h5>Implement Visual Problem-Solving Method</h5>
                    </div>
                    <p>Students who used visual aids showed 67% better retention. Recommended tools: GeoGebra, graphing activities.</p>
                </div>
                
                <div class="recommendation-item medium-impact">
                    <div class="rec-header">
                        <span class="impact-badge medium">MEDIUM IMPACT</span>
                        <h5>Increase Peer Collaboration</h5>
                    </div>
                    <p>Pair stronger students with those struggling. Data shows 31% improvement in collaborative settings.</p>
                </div>
            </div>
        </div>
    `;
}

function implementRecommendation(index) {
    showLoading('Setting up implementation plan...');
    
    setTimeout(() => {
        hideLoading();
        showModal('🚀 Implementation plan created! Resources have been added to your teaching toolkit and calendar reminders set.');
    }, 2000);
}

function scheduleRecommendation(index) {
    showLoading('Adding to your schedule...');
    
    setTimeout(() => {
        hideLoading();
        showModal('📅 Recommendation scheduled! You\'ll receive reminders and preparation materials before implementation.');
    }, 1500);
}

function sendRecognition(volunteerName) {
    showLoading(`Sending recognition to ${volunteerName}...`);
    
    setTimeout(() => {
        hideLoading();
        showModal(`🏆 Recognition sent to ${volunteerName}! They'll receive a certificate and your personal thank you message.`);
    }, 1500);
}

function viewFullProgress(studentName) {
    showLoading(`Loading complete progress report for ${studentName}...`);
    
    setTimeout(() => {
        hideLoading();
        const progressReport = generateProgressReport(studentName);
        showCustomModal(`📊 Progress Report: ${studentName}`, progressReport, '900px');
    }, 2000);
}

function generateProgressReport(studentName) {
    return `
        <div class="progress-report-content">
            <div class="report-header">
                <div class="student-info">
                    <div class="student-avatar">${studentName.split(' ')[0][0]}${studentName.split(' ')[1][0]}</div>
                    <div>
                        <h3>${studentName}</h3>
                        <p>7th Grade • Lincoln Middle School</p>
                    </div>
                </div>
                <div class="report-period">
                    <span>Report Period: September 1 - October 26, 2025</span>
                </div>
            </div>
            
            <div class="overall-performance">
                <h4>📈 Overall Performance</h4>
                <div class="performance-metrics">
                    <div class="metric">
                        <span class="metric-label">Overall Progress</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 78%"></div>
                            <span class="metric-value">78%</span>
                        </div>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Help Requests Resolved</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 85%"></div>
                            <span class="metric-value">17/20</span>
                        </div>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Volunteer Satisfaction</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 92%"></div>
                            <span class="metric-value">4.6/5.0</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="subject-breakdown">
                <h4>📚 Subject Performance</h4>
                <div class="subjects-grid">
                    <div class="subject-card">
                        <h5>Algebra</h5>
                        <div class="progress-circle" data-progress="72">
                            <span>72%</span>
                        </div>
                        <p>Improving steadily, especially in quadratic equations</p>
                    </div>
                    <div class="subject-card">
                        <h5>Geometry</h5>
                        <div class="progress-circle" data-progress="85">
                            <span>85%</span>
                        </div>
                        <p>Strong performance, excellent spatial reasoning</p>
                    </div>
                </div>
            </div>
            
            <div class="volunteer-interactions">
                <h4>👥 Volunteer Interactions</h4>
                <div class="interaction-list">
                    <div class="interaction-item">
                        <span class="volunteer-name">Jessica S.</span>
                        <span class="session-count">8 sessions</span>
                        <span class="rating">⭐ 4.8</span>
                    </div>
                    <div class="interaction-item">
                        <span class="volunteer-name">Marcus T.</span>
                        <span class="session-count">5 sessions</span>
                        <span class="rating">⭐ 4.5</span>
                    </div>
                </div>
            </div>
            
            <div class="report-actions">
                <button onclick="downloadProgressReport('${studentName}')" class="btn-primary">
                    <i class="fas fa-download"></i> Download Report
                </button>
                <button onclick="shareWithParents('${studentName}')" class="btn-secondary">
                    <i class="fas fa-share"></i> Share with Parents
                </button>
                <button onclick="scheduleConference('${studentName}')" class="btn-outline">
                    <i class="fas fa-calendar"></i> Schedule Conference
                </button>
            </div>
        </div>
    `;
}

function sendEncouragement(studentName) {
    showLoading(`Sending encouraging message to ${studentName}...`);
    
    setTimeout(() => {
        hideLoading();
        showModal(`💌 Encouraging message sent to ${studentName}! They'll receive it through the LearnBridge student portal.`);
    }, 1500);
}

// Quick Action Functions for Teacher Dashboard
function generateClassReport() {
    showLoading('Generating comprehensive class report with AI insights...');
    
    setTimeout(() => {
        hideLoading();
        const reportContent = `
            <div class="class-report-content">
                <div class="report-header">
                    <h3>📊 Class Performance Report</h3>
                    <div class="report-period">
                        <span>Period: September 1 - October 26, 2025</span>
                    </div>
                </div>
                
                <div class="report-summary">
                    <h4>Executive Summary</h4>
                    <div class="summary-metrics">
                        <div class="summary-item">
                            <strong>Overall Class Performance: 78% Average</strong>
                            <p>+12% improvement from last month</p>
                        </div>
                        <div class="summary-item">
                            <strong>Students At Risk: 15 students</strong>
                            <p>Require immediate intervention</p>
                        </div>
                        <div class="summary-item">
                            <strong>Volunteer Utilization: 89%</strong>
                            <p>342 help sessions completed</p>
                        </div>
                    </div>
                </div>
                
                <div class="subject-breakdown">
                    <h4>Subject Performance Analysis</h4>
                    <div class="subject-performance">
                        <div class="subject-item">
                            <span class="subject-name">Algebra</span>
                            <div class="performance-bar">
                                <div class="performance-fill" style="width: 72%; background: #28a745;"></div>
                            </div>
                            <span class="performance-score">72%</span>
                        </div>
                        <div class="subject-item">
                            <span class="subject-name">Chemistry</span>
                            <div class="performance-bar">
                                <div class="performance-fill" style="width: 68%; background: #ffc107;"></div>
                            </div>
                            <span class="performance-score">68%</span>
                        </div>
                        <div class="subject-item">
                            <span class="subject-name">English</span>
                            <div class="performance-bar">
                                <div class="performance-fill" style="width: 82%; background: #28a745;"></div>
                            </div>
                            <span class="performance-score">82%</span>
                        </div>
                    </div>
                </div>
                
                <div class="actionable-insights">
                    <h4>🎯 Actionable Insights</h4>
                    <ul>
                        <li>Focus additional resources on Quadratic Equations (23 students struggling)</li>
                        <li>Implement peer tutoring program for Chemistry (18 students need support)</li>
                        <li>Continue current English curriculum - showing excellent results</li>
                        <li>Schedule parent conferences for 15 at-risk students</li>
                    </ul>
                </div>
                
                <div class="report-actions">
                    <button onclick="downloadReport()" class="btn-primary">
                        <i class="fas fa-download"></i> Download Full Report (PDF)
                    </button>
                    <button onclick="scheduleFollowUp()" class="btn-secondary">
                        <i class="fas fa-calendar"></i> Schedule Follow-up Review
                    </button>
                    <button onclick="shareWithAdmin()" class="btn-outline">
                        <i class="fas fa-share"></i> Share with Administration
                    </button>
                </div>
            </div>
        `;
        
        showCustomModal('Class Performance Report', reportContent, '900px');
    }, 3000);
}

function scheduleIntervention() {
    showLoading('Setting up intervention scheduling system...');
    
    setTimeout(() => {
        hideLoading();
        const interventionContent = `
            <div class="intervention-scheduler">
                <h3>📋 Schedule Targeted Intervention</h3>
                
                <div class="intervention-form">
                    <div class="form-group">
                        <label>Intervention Type</label>
                        <select class="form-control">
                            <option>Small Group Tutoring</option>
                            <option>One-on-One Support</option>
                            <option>Peer Mentoring</option>
                            <option>Parent Conference</option>
                            <option>Learning Resources</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Subject Focus</label>
                        <select class="form-control">
                            <option>Quadratic Equations (Algebra)</option>
                            <option>Chemical Balancing (Chemistry)</option>
                            <option>Essay Structure (English)</option>
                            <option>Derivative Rules (Calculus)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Students to Include</label>
                        <div class="student-selector">
                            <div class="student-option">
                                <input type="checkbox" id="maria" checked>
                                <label for="maria">Maria S. (7th Grade) - Struggling with Algebra</label>
                            </div>
                            <div class="student-option">
                                <input type="checkbox" id="david" checked>
                                <label for="david">David K. (9th Grade) - Chemistry support needed</label>
                            </div>
                            <div class="student-option">
                                <input type="checkbox" id="james">
                                <label for="james">James R. (11th Grade) - Physics concepts</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Preferred Schedule</label>
                        <div class="schedule-options">
                            <button class="schedule-btn">Morning (8:00-10:00 AM)</button>
                            <button class="schedule-btn active">Afternoon (3:00-5:00 PM)</button>
                            <button class="schedule-btn">Evening (6:00-8:00 PM)</button>
                        </div>
                    </div>
                    
                    <div class="intervention-actions">
                        <button onclick="createIntervention()" class="btn-primary">
                            <i class="fas fa-calendar-plus"></i> Schedule Intervention
                        </button>
                        <button onclick="requestVolunteerHelp()" class="btn-secondary">
                            <i class="fas fa-hands-helping"></i> Request Volunteer Support
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        showCustomModal('Schedule Intervention', interventionContent, '700px');
    }, 2000);
}

function contactParents() {
    showLoading('Preparing parent communication system...');
    
    setTimeout(() => {
        hideLoading();
        const parentContactContent = `
            <div class="parent-communication">
                <h3>📞 Parent Communication Center</h3>
                
                <div class="communication-options">
                    <div class="comm-option">
                        <div class="comm-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="comm-content">
                            <h4>Progress Update Email</h4>
                            <p>Send detailed progress reports to all parents</p>
                            <button onclick="sendProgressEmails()" class="btn-primary">Send to All (127 parents)</button>
                        </div>
                    </div>
                    
                    <div class="comm-option">
                        <div class="comm-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="comm-content">
                            <h4>Alert for Struggling Students</h4>
                            <p>Notify parents of students needing extra support</p>
                            <button onclick="sendAlerts()" class="btn-warning">Send Alerts (15 parents)</button>
                        </div>
                    </div>
                    
                    <div class="comm-option">
                        <div class="comm-icon">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="comm-content">
                            <h4>Celebration Messages</h4>
                            <p>Share positive achievements and milestones</p>
                            <button onclick="sendCelebrations()" class="btn-success">Send Celebrations (43 parents)</button>
                        </div>
                    </div>
                    
                    <div class="comm-option">
                        <div class="comm-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <div class="comm-content">
                            <h4>Conference Requests</h4>
                            <p>Schedule parent-teacher conferences</p>
                            <button onclick="scheduleConferences()" class="btn-info">Schedule Meetings</button>
                        </div>
                    </div>
                </div>
                
                <div class="recent-communications">
                    <h4>Recent Communications</h4>
                    <div class="comm-history">
                        <div class="history-item">
                            <span class="time">2 hours ago</span>
                            <span class="message">Progress update sent to Maria S.'s parents</span>
                            <span class="status success">✓ Delivered</span>
                        </div>
                        <div class="history-item">
                            <span class="time">1 day ago</span>
                            <span class="message">Alert sent regarding David K.'s chemistry struggles</span>
                            <span class="status success">✓ Read</span>
                        </div>
                        <div class="history-item">
                            <span class="time">3 days ago</span>
                            <span class="message">Celebration message for Sofia L.'s essay achievement</span>
                            <span class="status success">✓ Replied</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        showCustomModal('Parent Communication', parentContactContent, '800px');
    }, 2000);
}

function requestVolunteers() {
    showLoading('Analyzing volunteer needs and sending requests...');
    
    setTimeout(() => {
        hideLoading();
        showModal('📢 Volunteer request sent! Based on current demand, we\'ve reached out to qualified volunteers in Algebra, Chemistry, and English. You should see new volunteers joining within 24-48 hours.');
    }, 2500);
}

function exportData() {
    showLoading('Preparing comprehensive analytics export...');
    
    setTimeout(() => {
        hideLoading();
        showModal('📥 Analytics export ready! Downloaded file includes: student progress data, volunteer activity logs, curriculum recommendations, and detailed performance metrics. File saved as "LearnBridge_Analytics_Oct2025.xlsx"');
    }, 3000);
}

function aiInsights() {
    showLoading('AI is analyzing teaching patterns and generating personalized insights...');
    
    setTimeout(() => {
        hideLoading();
        const aiInsightsContent = `
            <div class="ai-insights-content">
                <div class="ai-header">
                    <h3>🧠 AI Teaching Insights</h3>
                    <p>Personalized recommendations based on your teaching patterns and student data</p>
                </div>
                
                <div class="insight-categories">
                    <div class="insight-category">
                        <h4>🎯 Teaching Optimization</h4>
                        <div class="insight-item">
                            <div class="insight-icon">⏰</div>
                            <div class="insight-text">
                                <strong>Optimal Teaching Times</strong>
                                <p>Students show 23% better engagement during 10:00-11:30 AM sessions. Consider scheduling challenging topics during this window.</p>
                            </div>
                        </div>
                        
                        <div class="insight-item">
                            <div class="insight-icon">👥</div>
                            <div class="insight-text">
                                <strong>Group Learning Effectiveness</strong>
                                <p>Peer collaboration increased problem-solving success by 31%. Recommend more group activities for Algebra concepts.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="insight-category">
                        <h4>📚 Curriculum Adjustments</h4>
                        <div class="insight-item">
                            <div class="insight-icon">📈</div>
                            <div class="insight-text">
                                <strong>Concept Progression</strong>
                                <p>Students who master fractions first show 45% better success with algebraic equations. Adjust prerequisite requirements.</p>
                            </div>
                        </div>
                        
                        <div class="insight-item">
                            <div class="insight-icon">🎨</div>
                            <div class="insight-text">
                                <strong>Visual Learning Impact</strong>
                                <p>Visual aids increased retention by 67% for geometry concepts. Integrate more diagrams and interactive elements.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="insight-category">
                        <h4>🚨 Early Warning System</h4>
                        <div class="insight-item">
                            <div class="insight-icon">⚠️</div>
                            <div class="insight-text">
                                <strong>At-Risk Prediction</strong>
                                <p>AI identified 3 students likely to struggle with upcoming calculus unit. Recommend preventive tutoring for James R., Lisa M., and Alex K.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="insight-category">
                        <h4>🏆 Success Patterns</h4>
                        <div class="insight-item">
                            <div class="insight-icon">🌟</div>
                            <div class="insight-text">
                                <strong>High-Performing Strategies</strong>
                                <p>Students using LearnBridge + volunteer support show 89% homework completion rate vs. 67% traditional method.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="ai-actions">
                    <button onclick="implementAIRecommendations()" class="btn-primary">
                        <i class="fas fa-robot"></i> Implement Recommendations
                    </button>
                    <button onclick="customizeInsights()" class="btn-secondary">
                        <i class="fas fa-cog"></i> Customize Insights
                    </button>
                    <button onclick="shareInsights()" class="btn-outline">
                        <i class="fas fa-share"></i> Share with Colleagues
                    </button>
                </div>
            </div>
        `;
        
        showCustomModal('AI Teaching Insights', aiInsightsContent, '900px');
    }, 3500);
}

// Additional Helper Functions for Teacher Actions
function flagForAttention(studentName) {
    showLoading(`Flagging ${studentName} for additional attention...`);
    
    setTimeout(() => {
        hideLoading();
        showModal(`🚩 ${studentName} has been flagged for additional attention. Administration and support staff have been notified. Intervention recommendations will be generated within 24 hours.`);
    }, 1500);
}

function shareWithColleagues(topic) {
    showLoading(`Preparing ${topic} insights for sharing...`);
    
    setTimeout(() => {
        hideLoading();
        showModal(`📤 ${topic} analysis shared with your teaching team! Colleagues can now access the insights, suggestions, and lesson plans in their LearnBridge teacher portals.`);
    }, 2000);
}

function shareRecommendation(index) {
    showLoading('Sharing recommendation with your teaching network...');
    
    setTimeout(() => {
        hideLoading();
        showModal('🌐 Recommendation shared successfully! Your colleagues will receive the implementation guide, resources, and success metrics in their dashboard.');
    }, 1500);
}

function viewAllVolunteers() {
    showLoading('Loading complete volunteer directory...');
    
    setTimeout(() => {
        hideLoading();
        showModal('👥 Complete volunteer directory opened! You can now view all 89 active volunteers, their specialties, availability, and performance metrics.');
    }, 2000);
}

function addNewHelpRequest() {
    const helpRequests = document.getElementById('help-requests');
    const newRequest = document.createElement('div');
    newRequest.className = 'request-card';
    newRequest.style.opacity = '0';
    newRequest.style.transform = 'translateX(-100%)';
    
    const subjects = ['Geometry', 'World History', 'Spanish', 'Biology'];
    const problems = [
        'Triangle angle calculations confusing',
        'World War I timeline essay help needed', 
        'Conjugating irregular verbs in past tense',
        'Photosynthesis process explanation needed'
    ];
    
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomProblem = problems[Math.floor(Math.random() * problems.length)];
    
    newRequest.innerHTML = `
        <div class="request-info">
            <span class="subject-tag">${randomSubject}</span>
            <p>${randomProblem}</p>
            <small>AI solution provided • just now</small>
        </div>
        <button onclick="helpStudent('new_${Date.now}')" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 600;">Add Support</button>
    `;
    
    helpRequests.appendChild(newRequest);
    
    // Animate in
    setTimeout(() => {
        newRequest.style.opacity = '1';
        newRequest.style.transform = 'translateX(0)';
        newRequest.style.transition = 'all 0.5s ease';
    }, 100);
}

function updateVolunteerStats() {
    // Update the volunteer stats in the intro section
    const statsSection = document.querySelector('.volunteer-intro');
    if (statsSection && statsSection.innerHTML.includes('Welcome, Alex')) {
        const currentHelped = parseInt(statsSection.innerHTML.match(/(\d+)<\/strong><br><small>Students Helped/)[1]) + 1;
        const currentHours = parseInt(statsSection.innerHTML.match(/(\d+)<\/strong><br><small>Volunteer Hours/)[1]) + 2;
        
        statsSection.innerHTML = statsSection.innerHTML.replace(
            /(\d+)<\/strong><br><small>Students Helped/,
            `${currentHelped}</strong><br><small>Students Helped`
        ).replace(
            /(\d+)<\/strong><br><small>Volunteer Hours/,
            `${currentHours}</strong><br><small>Volunteer Hours`
        );
    }
}

function requestVolunteerHelp() {
    const textarea = document.querySelector('.add-comment textarea');
    if (textarea.value.trim()) {
        const question = textarea.value;
        showLoading('Connecting you with local volunteers...');
        
        setTimeout(() => {
            hideLoading();
            
            // Add the student's question to the volunteer comments
            const volunteerComments = document.getElementById('volunteer-comments');
            const studentQuestion = document.createElement('div');
            studentQuestion.className = 'volunteer-comment';
            studentQuestion.style.background = 'rgba(255, 107, 107, 0.2)';
            studentQuestion.innerHTML = `
                <div class="volunteer-info">
                    <div class="volunteer-avatar" style="background: #ff6b6b;">YOU</div>
                    <div>
                        <strong>Your Question</strong>
                        <small>Just asked</small>
                    </div>
                </div>
                <p>${question}</p>
            `;
            volunteerComments.appendChild(studentQuestion);
            
            // Simulate volunteer responses
            setTimeout(() => {
                const response1 = document.createElement('div');
                response1.className = 'volunteer-comment';
                response1.innerHTML = `
                    <div class="volunteer-info">
                        <div class="volunteer-avatar">KM</div>
                        <div>
                            <strong>Kevin M.</strong>
                            <small>Senior at Washington High</small>
                        </div>
                        <small style="margin-left: auto;">just now</small>
                    </div>
                    <p>Great question! I had the same confusion last year. Try breaking it down into smaller parts first. You've got this! 💪</p>
                `;
                volunteerComments.appendChild(response1);
                
                // Scroll to new comment
                response1.scrollIntoView({ behavior: 'smooth' });
                
                // Second response
                setTimeout(() => {
                    const response2 = document.createElement('div');
                    response2.className = 'volunteer-comment';
                    response2.innerHTML = `
                        <div class="volunteer-info">
                            <div class="volunteer-avatar">LR</div>
                            <div>
                                <strong>Lisa R.</strong>
                                <small>Lincoln High Tutor</small>
                            </div>
                            <small style="margin-left: auto;">30 seconds ago</small>
                        </div>
                        <p>I can help! Here's a tip: [draws diagram] 📐 Think of it like this... Would you like me to explain more?</p>
                    `;
                    volunteerComments.appendChild(response2);
                    response2.scrollIntoView({ behavior: 'smooth' });
                    
                    // Update parent dashboard
                    updateParentProgress();
                    
                }, 3000);
                
            }, 2000);
            
            textarea.value = '';
            showModal('🎉 Two local volunteers are helping you right now! Check the comments below.');
            
        }, 1500);
    }
}

// Utility Functions
function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const spinnerText = overlay.querySelector('p');
    spinnerText.textContent = message;
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showModal(message) {
    const modal = document.getElementById('success-modal');
    const modalText = modal.querySelector('p');
    modalText.textContent = message;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('success-modal').style.display = 'none';
}

function showError(message) {
    // Create temporary error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Demo Data Loading
function loadDemoData() {
    // Load sample data for demo purposes
    console.log('Demo data loaded');
    
    // If no API key provided, show demo mode
    if (CONFIG.OPENAI_API_KEY === 'your-openai-api-key-here') {
        console.log('Demo mode: Add your OpenAI API key to enable full functionality');
        
        // Override AI functions with demo responses
        window.analyzeHomework = demoAnalyzeHomework;
        window.processHomeworkQuestion = demoProcessQuestion;
    }
    
    // Initialize dynamic content
    initializeDynamicStats();
    setupRealtimeUpdates();
}

function initializeDynamicStats() {
    // Update stats in real-time for wow factor
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach((stat, index) => {
        let current = parseInt(stat.textContent);
        let target = current + Math.floor(Math.random() * 10) + 5;
        
        // Animate number increases
        const increment = () => {
            if (current < target) {
                current++;
                stat.textContent = current;
                setTimeout(increment, 200);
            }
        };
        
        setTimeout(increment, index * 1000);
    });
}

function setupRealtimeUpdates() {
    // Simulate real-time activity
    setInterval(() => {
        // Update student count
        const studentStat = document.querySelector('.stat-number');
        if (studentStat) {
            let current = parseInt(studentStat.textContent);
            studentStat.textContent = current + 1;
            
            // Flash update
            studentStat.style.color = '#FFD700';
            studentStat.style.transform = 'scale(1.1)';
            setTimeout(() => {
                studentStat.style.color = '#FFD700';
                studentStat.style.transform = 'scale(1)';
            }, 500);
        }
    }, 30000); // Every 30 seconds
}

function updateParentProgress() {
    // Update parent dashboard when student gets help
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        let currentWidth = parseInt(bar.style.width) || 0;
        let newWidth = Math.min(currentWidth + Math.floor(Math.random() * 5) + 2, 100);
        
        bar.style.width = newWidth + '%';
        
        // Update the percentage display
        const percentDisplay = bar.parentElement.nextElementSibling;
        if (percentDisplay) {
            percentDisplay.textContent = newWidth + '%';
        }
    });
    
    // Add new milestone
    addNewMilestone();
}

function addNewMilestone() {
    const milestoneCard = document.querySelector('.milestone-card');
    if (milestoneCard) {
        const milestones = [
            '🎯 Completed algebra homework independently!',
            '📈 Improved by 15% this week!',
            '🤝 Connected with 2 new volunteer mentors!',
            '⭐ Received encouraging feedback from peers!',
            '🔥 On a 3-day learning streak!'
        ];
        
        const randomMilestone = milestones[Math.floor(Math.random() * milestones.length)];
        
        const newMilestone = document.createElement('div');
        newMilestone.className = 'milestone';
        newMilestone.style.opacity = '0';
        newMilestone.style.transform = 'translateY(-10px)';
        newMilestone.innerHTML = `
            <i class="fas fa-star" style="color: #FFD700;"></i>
            <span>${randomMilestone}</span>
            <small style="margin-left: auto; color: #666;">just now</small>
        `;
        
        // Insert at top
        const firstMilestone = milestoneCard.querySelector('.milestone');
        if (firstMilestone) {
            milestoneCard.insertBefore(newMilestone, firstMilestone);
        } else {
            milestoneCard.appendChild(newMilestone);
        }
        
        // Animate in
        setTimeout(() => {
            newMilestone.style.opacity = '1';
            newMilestone.style.transform = 'translateY(0)';
            newMilestone.style.transition = 'all 0.5s ease';
        }, 100);
        
        // Remove old milestones to keep list manageable
        const allMilestones = milestoneCard.querySelectorAll('.milestone');
        if (allMilestones.length > 4) {
            allMilestones[allMilestones.length - 1].remove();
        }
    }
}

// Parent Dashboard Functions
function changeParentLanguage() {
    const selectedLang = document.getElementById('parent-language').value;
    const demoDiv = document.getElementById('language-demo');
    const sampleUpdate = document.getElementById('sample-update');
    
    const translations = {
        'en': 'Your child completed 3 homework problems today with 92% accuracy!',
        'es': '¡Su hijo completó 3 problemas de tarea hoy con 92% de precisión!',
        'zh': '您的孩子今天完成了3道作业题，准确率达92%！',
        'ar': 'أكمل طفلك 3 مسائل واجبات منزلية اليوم بدقة 92%!',
        'hi': 'आपके बच्चे ने आज 92% सटीकता के साथ 3 गृहकार्य समस्याएं पूरी कीं!',
        'fr': 'Votre enfant a terminé 3 problèmes de devoirs aujourd\'hui avec 92% de précision!'
    };
    
    sampleUpdate.textContent = translations[selectedLang];
    demoDiv.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        demoDiv.style.display = 'none';
    }, 3000);
    
    showModal('✅ Language preference updated! You\'ll receive all future updates in your selected language.');
}

function viewAllActivity() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h3><i class="fas fa-history"></i> Complete Activity Timeline</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <div class="timeline-item">
                    <strong>Today 3:45 PM</strong> - ✨ Completed quadratic equations with AI help
                    <br><small>Accuracy: 95% • Time: 12 minutes • Volunteers: Jessica S., Marcus T.</small>
                </div>
                <div class="timeline-item" style="margin-top: 1rem;">
                    <strong>Today 2:20 PM</strong> - 🤝 Connected with 2 new volunteer mentors
                    <br><small>Both from local high schools • Previous help rating: 4.9/5</small>
                </div>
                <div class="timeline-item" style="margin-top: 1rem;">
                    <strong>Today 1:15 PM</strong> - 📚 Asked follow-up question about algebra
                    <br><small>Response from Aisha P. • Received detailed explanation</small>
                </div>
                <div class="timeline-item" style="margin-top: 1rem;">
                    <strong>Yesterday 4:30 PM</strong> - 🎯 Achieved 85% improvement in math
                    <br><small>Weekly progress milestone reached</small>
                </div>
                <div class="timeline-item" style="margin-top: 1rem;">
                    <strong>Yesterday 3:45 PM</strong> - 🌟 Received encouragement from 5 volunteers
                    <br><small>All positive feedback • Confidence boost reported</small>
                </div>
            </div>
            <button onclick="closeModal()" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-top: 1rem;">Close Timeline</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function addLiveNotification(message) {
    const notifications = document.getElementById('live-notifications');
    if (notifications) {
        const newNotification = document.createElement('div');
        newNotification.className = 'notification-item';
        newNotification.style.opacity = '0';
        newNotification.style.transform = 'translateY(-10px)';
        newNotification.innerHTML = `
            <span class="notification-time">just now</span>
            <span class="notification-text">${message}</span>
        `;
        
        // Insert at top
        notifications.insertBefore(newNotification, notifications.firstChild);
        
        // Animate in
        setTimeout(() => {
            newNotification.style.opacity = '1';
            newNotification.style.transform = 'translateY(0)';
            newNotification.style.transition = 'all 0.5s ease';
        }, 100);
        
        // Remove old notifications
        const allNotifications = notifications.querySelectorAll('.notification-item');
        if (allNotifications.length > 3) {
            allNotifications[allNotifications.length - 1].remove();
        }
    }
}

// Demo Magic - Ties all layers together for wow factor
function startDemoMagic() {
    // Simulate ongoing activity across all layers
    
    // Every 15 seconds, add a new help request (Volunteer layer)
    setInterval(() => {
        if (currentLayer === 'volunteer') {
            addNewHelpRequest();
        }
    }, 15000);
    
    // Every 20 seconds, update parent notifications (Parent layer) 
    setInterval(() => {
        if (currentLayer === 'parent') {
            const notifications = [
                '📚 New homework help session completed!',
                '🌟 Volunteer mentor added encouragement!',
                '📊 Daily learning goal achieved!',
                '🎯 Subject mastery improved by 5%!',
                '💪 3-day learning streak maintained!'
            ];
            const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
            addLiveNotification(randomNotification);
        }
    }, 20000);
    
    // Every 10 seconds, update stats in hero section
    setInterval(() => {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach((stat, index) => {
            if (Math.random() > 0.7) { // 30% chance to update each stat
                let current = parseInt(stat.textContent);
                stat.textContent = current + 1;
                
                // Flash effect
                stat.style.transform = 'scale(1.1)';
                stat.style.color = '#FFD700';
                setTimeout(() => {
                    stat.style.transform = 'scale(1)';
                    stat.style.color = '#FFD700';
                }, 300);
            }
        });
    }, 10000);
}

// Demo Functions (for when API key is not provided)
async function demoAnalyzeHomework() {
    showLoading('AI is analyzing your homework...');
    
    setTimeout(() => {
        const demoSolution = `
        Step 1: Identify the equation type
        This is a quadratic equation in the form ax² + bx + c = 0
        
        Step 2: Use the quadratic formula
        x = (-b ± √(b² - 4ac)) / 2a
        
        Step 3: Substitute the values
        For 2x² + 5x - 3 = 0, we have a=2, b=5, c=-3
        
        Step 4: Calculate the discriminant
        b² - 4ac = 25 - 4(2)(-3) = 25 + 24 = 49
        
        Step 5: Find the solutions
        x = (-5 ± √49) / 4 = (-5 ± 7) / 4
        x₁ = 2/4 = 0.5 and x₂ = -12/4 = -3
        `;
        
        displaySolution(demoSolution);
        hideLoading();
        
        setTimeout(() => {
            addVolunteerSupport();
        }, 2000);
    }, 3000);
}

async function demoProcessQuestion(question, language) {
    showLoading('AI is analyzing your question...');
    
    setTimeout(() => {
        const langName = getLanguageName(language);
        const demoSolution = `
        Great question! I detected you're speaking ${langName}. Let me help you step by step:
        
        Step 1: Understand what you're asking
        "${question}"
        
        Step 2: Break down the problem
        Let's identify the key components and what we need to find.
        
        Step 3: Apply the relevant concept
        Based on your question, we'll use the appropriate method or formula.
        
        Step 4: Work through the solution
        Following logical steps to reach the answer.
        
        Step 5: Verify the result
        Always check if our answer makes sense!
        
        💡 Pro tip: I can explain this in any language you're comfortable with!
        `;
        
        displaySolution(demoSolution);
        hideLoading();
        
        setTimeout(() => {
            addVolunteerSupport();
        }, 2000);
    }, 3000);
}

// Toggle voice recording (alternative method)
function toggleVoiceRecording() {
    if (isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

// Helper function to get language names
// Typing effect for volunteer messages
function typeMessage(element, message) {
    element.textContent = '';
    let i = 0;
    
    const typing = setInterval(() => {
        if (i < message.length) {
            element.textContent += message.charAt(i);
            i++;
        } else {
            clearInterval(typing);
            // Add cursor blink effect briefly
            element.textContent += '|';
            setTimeout(() => {
                element.textContent = message;
            }, 500);
        }
    }, 30); // Adjust typing speed
}

function thankVolunteer(volunteerName) {
    showModal(`✨ Thank you sent to ${volunteerName}! They'll be so happy to know they helped you succeed! 💖`);
    
    // Update button to show thanks sent
    event.target.innerHTML = '✅ Thanked!';
    event.target.disabled = true;
    event.target.style.background = 'rgba(40, 167, 69, 0.3)';
}

function askFollowUp(volunteerName) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-comments"></i> Ask ${volunteerName} a Follow-up Question</h3>
            <textarea id="followup-question" placeholder="What else would you like to know about this problem?" style="width: 100%; height: 100px; margin: 1rem 0; padding: 10px; border-radius: 8px; border: 2px solid #ddd;"></textarea>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="sendFollowUp('${volunteerName}')" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Send Question</button>
                <button onclick="closeModal()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function sendFollowUp(volunteerName) {
    const question = document.getElementById('followup-question').value;
    if (question.trim()) {
        closeModal();
        showLoading(`Sending your question to ${volunteerName}...`);
        
        setTimeout(() => {
            hideLoading();
            showModal(`🚀 Your question was sent to ${volunteerName}! They'll respond soon with more detailed help!`);
            
            // Add the follow-up to volunteer comments
            setTimeout(() => {
                const volunteerComments = document.getElementById('volunteer-comments');
                const followUp = document.createElement('div');
                followUp.className = 'volunteer-comment';
                followUp.style.background = 'rgba(255, 193, 7, 0.2)';
                followUp.innerHTML = `
                    <div class="volunteer-info">
                        <div class="volunteer-avatar" style="background: #ffc107;">YOU</div>
                        <div>
                            <strong>Your Follow-up</strong>
                            <small>Question for ${volunteerName}</small>
                        </div>
                        <small style="margin-left: auto;">just now</small>
                    </div>
                    <p>${question}</p>
                `;
                volunteerComments.appendChild(followUp);
                followUp.scrollIntoView({ behavior: 'smooth' });
            }, 1000);
            
        }, 2000);
    }
}

function getLanguageName(langCode) {
    const languageNames = {
        'auto': 'Auto-detected',
        'en': 'English',
        'es': 'Spanish',
        'zh': 'Chinese',
        'ar': 'Arabic', 
        'hi': 'Hindi',
        'fr': 'French',
        'de': 'German',
        'ja': 'Japanese',
        'ko': 'Korean',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'it': 'Italian',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'da': 'Danish',
        'no': 'Norwegian',
        'fi': 'Finnish',
        'pl': 'Polish',
        'tr': 'Turkish',
        'th': 'Thai',
        'vi': 'Vietnamese',
        'he': 'Hebrew',
        'cs': 'Czech',
        'hu': 'Hungarian',
        'ro': 'Romanian',
        'bg': 'Bulgarian',
        'hr': 'Croatian',
        'sk': 'Slovak',
        'sl': 'Slovenian',
        'et': 'Estonian',
        'lv': 'Latvian',
        'lt': 'Lithuanian',
        'mt': 'Maltese',
        'cy': 'Welsh',
        'ga': 'Irish',
        'is': 'Icelandic',
        'mk': 'Macedonian',
        'sq': 'Albanian',
        'eu': 'Basque',
        'ca': 'Catalan',
        'gl': 'Galician'
    };
    
    return languageNames[langCode] || langCode || 'Unknown';
}

// Enhanced Parent Dashboard Functions
function switchChild() {
    const selectedChild = document.getElementById('child-select').value;
    const progressDetails = document.getElementById('progress-details');
    
    // Sample data for different children
    const childData = {
        'maria': {
            subjects: [
                { name: 'Math', progress: 85, trend: 'up', change: '+12%' },
                { name: 'Science', progress: 72, trend: 'up', change: '+8%' },
                { name: 'English', progress: 91, trend: 'stable', change: '+2%' },
                { name: 'History', progress: 78, trend: 'up', change: '+15%' }
            ]
        },
        'carlos': {
            subjects: [
                { name: 'Math', progress: 76, trend: 'up', change: '+18%' },
                { name: 'Science', progress: 88, trend: 'up', change: '+5%' },
                { name: 'English', progress: 82, trend: 'up', change: '+10%' },
                { name: 'Spanish', progress: 95, trend: 'stable', change: '+1%' }
            ]
        }
    };
    
    const data = childData[selectedChild];
    if (data) {
        progressDetails.innerHTML = data.subjects.map(subject => `
            <div class="progress-item">
                <span>${subject.name}</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${subject.progress}%"></div>
                </div>
                <span>${subject.progress}%</span>
                <small class="trend ${subject.trend}">${subject.trend === 'up' ? '↗' : '→'} ${subject.change}</small>
            </div>
        `).join('');
        
        addLiveNotification(`📊 Switched to viewing ${selectedChild === 'maria' ? 'Maria' : 'Carlos'}'s progress`);
    }
}

function changeTimeframe(period) {
    document.querySelectorAll('.time-filter button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const multipliers = { 'week': 1, 'month': 0.8, 'quarter': 0.6 };
    const multiplier = multipliers[period];
    
    document.querySelectorAll('.progress-fill').forEach(bar => {
        const currentWidth = parseInt(bar.style.width);
        const newWidth = Math.max(20, Math.min(100, currentWidth * multiplier));
        bar.style.width = newWidth + '%';
        bar.parentElement.nextElementSibling.textContent = Math.round(newWidth) + '%';
    });
    
    addLiveNotification(`📈 Updated view to show ${period} progress`);
}

function viewAllAchievements() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <h3><i class="fas fa-trophy"></i> All Achievements</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <div class="achievement-category">
                    <h4>🏆 Academic Milestones</h4>
                    <div class="achievement-item" style="display: flex; gap: 15px; margin: 15px 0; padding: 15px; background: rgba(102, 126, 234, 0.05); border-radius: 10px;">
                        <span style="font-size: 2em;">⭐</span>
                        <div>
                            <strong>Mastered fraction multiplication!</strong>
                            <p>Completed 10 problems with 95% accuracy</p>
                            <small>Yesterday • Math</small>
                        </div>
                    </div>
                    <div class="achievement-item" style="display: flex; gap: 15px; margin: 15px 0; padding: 15px; background: rgba(102, 126, 234, 0.05); border-radius: 10px;">
                        <span style="font-size: 2em;">🎯</span>
                        <div>
                            <strong>Completed 5 algebra problems independently</strong>
                            <p>Showed strong problem-solving skills</p>
                            <small>3 days ago • Math</small>
                        </div>
                    </div>
                </div>
                
                <div class="achievement-category">
                    <h4>🧠 Learning Skills</h4>
                    <div class="achievement-item" style="display: flex; gap: 15px; margin: 15px 0; padding: 15px; background: rgba(34, 197, 94, 0.05); border-radius: 10px;">
                        <span style="font-size: 2em;">💡</span>
                        <div>
                            <strong>Asked thoughtful follow-up questions</strong>
                            <p>Demonstrated curiosity and critical thinking</p>
                            <small>5 days ago • Science</small>
                        </div>
                    </div>
                </div>
            </div>
            <button onclick="closeModal()" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-top: 1rem;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function messageVolunteer(volunteerId) {
    const volunteerNames = { 'jessica': 'Jessica S.', 'ahmed': 'Ahmed T.' };
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-comments"></i> Message ${volunteerNames[volunteerId]}</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <textarea placeholder="Write your message here..." style="width: 100%; height: 120px; padding: 12px; border-radius: 8px; border: 2px solid #667eea; resize: vertical;"></textarea>
                <p style="font-size: 0.9em; color: #666; margin-top: 8px;">
                    <i class="fas fa-info-circle"></i> This message will be sent through LearnBridge's secure messaging system.
                </p>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Cancel</button>
                <button onclick="sendVolunteerMessage('${volunteerId}')" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Send Message</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function sendVolunteerMessage(volunteerId) {
    showModal('✅ Message sent successfully! ' + (volunteerId === 'jessica' ? 'Jessica' : 'Ahmed') + ' will receive a notification.');
    closeModal();
}

function findMoreVolunteers() {
    showModal('🔍 Opening volunteer matching system... This will help find the perfect tutor for your child!');
    setTimeout(() => showLayer('student'), 2000);
}

function viewSessionDetails(sessionId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h3><i class="fas fa-chalkboard"></i> Quadratic Equations Practice</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><strong>Subject:</strong> Math</div>
                    <div><strong>Date:</strong> Today, 3:45 PM</div>
                    <div><strong>Duration:</strong> 25 minutes</div>
                    <div><strong>Volunteer:</strong> Jessica S.</div>
                    <div><strong>Accuracy:</strong> 92%</div>
                    <div><strong>Confidence:</strong> High</div>
                </div>
                
                <h4>Topics Covered:</h4>
                <ul style="margin-left: 20px;">
                    <li>Solving quadratics by factoring</li>
                    <li>Using the quadratic formula</li>
                    <li>Graphing parabolas</li>
                </ul>
                
                <h4>Volunteer Feedback:</h4>
                <p style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">Maria showed excellent understanding of quadratic concepts. She successfully solved 8 out of 8 practice problems and asked insightful questions about real-world applications.</p>
                
                <h4>Next Steps:</h4>
                <p style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">Ready to move on to more complex quadratic applications and word problems.</p>
            </div>
            <button onclick="closeModal()" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-top: 1rem;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function viewAllSessions() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <h3><i class="fas fa-history"></i> All Tutoring Sessions (23 total)</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <div class="session-history-list">
                    ${Array.from({length: 10}, (_, i) => `
                        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; margin: 10px 0; background: white; border-radius: 10px; border: 1px solid #e5e7eb;">
                            <span class="subject-tag ${['math', 'science', 'english'][i % 3]}">${['Math', 'Science', 'English'][i % 3]}</span>
                            <div style="flex: 1;">
                                <strong>${['Quadratic Equations', 'Cell Biology', 'Essay Writing', 'Algebra Basics', 'Chemistry'][i % 5]}</strong>
                                <p style="margin: 5px 0; color: #6b7280; font-size: 0.9em;">${['Today', 'Yesterday', '2 days ago', '3 days ago', '4 days ago'][i % 5]} • ${15 + i * 2} min • ${['Jessica S.', 'Ahmed T.', 'Sarah M.'][i % 3]}</p>
                            </div>
                            <span style="font-weight: bold; color: #22c55e;">${90 + i}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button onclick="closeModal()" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-top: 1rem;">Close Sessions</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function openFamilyChat() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; height: 70vh; display: flex; flex-direction: column;">
            <h3><i class="fas fa-comments"></i> Family Learning Chat</h3>
            <div class="chat-container" style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 15px; margin: 15px 0; overflow-y: auto;">
                <div class="message parent-message">
                    <strong>You:</strong> How did your math test go today? 😊
                    <small>Today, 4:00 PM</small>
                </div>
                <div class="message child-message">
                    <strong>Maria:</strong> Really good! Jessica helped me understand quadratics better. Got a 94%! 🎉
                    <small>Today, 4:02 PM</small>
                </div>
                <div class="message ai-message">
                    <strong>LearnBridge AI:</strong> Maria showed excellent progress in algebraic thinking during today's session. She's ready for more advanced topics! 📈
                    <small>Today, 4:05 PM</small>
                </div>
                <div class="message parent-message">
                    <strong>You:</strong> That's wonderful! I'm so proud of your hard work. 💪
                    <small>Today, 4:10 PM</small>
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <input type="text" placeholder="Type your message..." style="flex: 1; padding: 10px; border-radius: 20px; border: 2px solid #667eea;">
                <button style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Send</button>
            </div>
            <button onclick="closeModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; margin-top: 15px;">Close Chat</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Volunteer Comment Interaction Functions
function replyToComment(tutorId, sessionId) {
    const tutorNames = {
        'jessica': 'Jessica S.',
        'ahmed': 'Ahmed T.',
        'sarah': 'Sarah M.'
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h3><i class="fas fa-reply"></i> Reply to ${tutorNames[tutorId]}</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #0ea5e9;">
                    <strong>Original Comment:</strong>
                    <p style="margin: 8px 0 0 0; font-style: italic;">
                        ${getOriginalComment(tutorId, sessionId)}
                    </p>
                </div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Your Reply:</label>
                <textarea id="reply-text" placeholder="Thank ${tutorNames[tutorId]} for their feedback and ask any questions..." style="width: 100%; height: 120px; padding: 12px; border-radius: 8px; border: 2px solid #667eea; resize: vertical;"></textarea>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="insertQuickReply('thank')" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.3); padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 0.9em;">Thank You</button>
                    <button onclick="insertQuickReply('follow')" style="background: rgba(59, 130, 246, 0.1); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3); padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 0.9em;">Ask Follow-up</button>
                    <button onclick="insertQuickReply('schedule')" style="background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 0.9em;">Schedule More</button>
                </div>
                <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                    <i class="fas fa-info-circle"></i> Your reply will be sent to ${tutorNames[tutorId]} and copied to your family chat.
                </p>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Cancel</button>
                <button onclick="sendReply('${tutorId}')" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Send Reply</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function getOriginalComment(tutorId, sessionId) {
    const comments = {
        'jessica': "Maria demonstrated exceptional understanding today! She not only solved all 8 quadratic problems correctly but also made the connection to real-world applications...",
        'ahmed': "What a curious mind! Maria asked some of the best questions I've heard about photosynthesis. She wanted to know why plants are green...",
        'sarah': "Significant improvement in Maria's persuasive writing! Her thesis statements are now much clearer and she's using transition words effectively..."
    };
    return comments[tutorId] || "Great session today!";
}

function insertQuickReply(type) {
    const textarea = document.getElementById('reply-text');
    const templates = {
        'thank': "Thank you so much for the detailed feedback! It's wonderful to hear about Maria's progress. ",
        'follow': "This is great to hear! Could you suggest some additional practice problems or resources for Maria to continue building on this success? ",
        'schedule': "We'd love to schedule another session with you soon. When would be your next available time? "
    };
    
    textarea.value += templates[type];
    textarea.focus();
}

function sendReply(tutorId) {
    const replyText = document.getElementById('reply-text').value.trim();
    if (replyText) {
        const tutorNames = { 'jessica': 'Jessica S.', 'ahmed': 'Ahmed T.', 'sarah': 'Sarah M.' };
        showModal(`✅ Reply sent to ${tutorNames[tutorId]}! They'll receive a notification and can respond in your family chat.`);
        addLiveNotification(`💬 Replied to ${tutorNames[tutorId]}'s feedback`);
        closeModal();
    } else {
        alert('Please write a reply before sending.');
    }
}

function scheduleFollowUp(tutorId) {
    const tutorNames = { 'jessica': 'Jessica S.', 'ahmed': 'Ahmed T.', 'sarah': 'Sarah M.' };
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-calendar-plus"></i> Schedule Follow-up with ${tutorNames[tutorId]}</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Preferred Date:</label>
                    <input type="date" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #667eea;" min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Preferred Time:</label>
                    <select style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #667eea;">
                        <option>3:00 PM - 4:00 PM</option>
                        <option>4:00 PM - 5:00 PM</option>
                        <option>5:00 PM - 6:00 PM</option>
                        <option>6:00 PM - 7:00 PM</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Focus Area:</label>
                    <select style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #667eea;">
                        <option>Continue current topic</option>
                        <option>Advanced practice problems</option>
                        <option>Review and reinforcement</option>
                        <option>New topic introduction</option>
                    </select>
                </div>
                <p style="font-size: 0.9em; color: #666;">
                    <i class="fas fa-info-circle"></i> We'll send a scheduling request to ${tutorNames[tutorId]} and notify you of their availability.
                </p>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Cancel</button>
                <button onclick="confirmScheduling('${tutorId}')" style="background: #22c55e; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Send Request</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmScheduling(tutorId) {
    const tutorNames = { 'jessica': 'Jessica S.', 'ahmed': 'Ahmed T.', 'sarah': 'Sarah M.' };
    showModal(`📅 Scheduling request sent to ${tutorNames[tutorId]}! You'll receive a confirmation within 24 hours.`);
    addLiveNotification(`📅 Scheduled follow-up session with ${tutorNames[tutorId]}`);
    closeModal();
}

function viewExtraResources(tutorId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <h3><i class="fas fa-book-open"></i> Additional Resources from Ahmed T.</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <p style="color: #6b7280; margin-bottom: 20px;">Ahmed recommended these resources to help Maria continue exploring photosynthesis and plant biology:</p>
                
                <div class="resource-grid" style="display: grid; gap: 15px;">
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; border-left: 4px solid #22c55e;">
                        <h4 style="margin: 0 0 8px 0; color: #16a34a;">🔬 Virtual Lab Simulations</h4>
                        <p style="margin: 0 0 8px 0;">Interactive photosynthesis simulator - explore how light, CO2, and water affect plant growth</p>
                        <button style="background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 0.9em;">Open Simulation</button>
                    </div>
                    
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 10px; border-left: 4px solid #3b82f6;">
                        <h4 style="margin: 0 0 8px 0; color: #2563eb;">📚 Educational Videos</h4>
                        <p style="margin: 0 0 8px 0;">"Photosynthesis Explained" - Khan Academy series (3 videos, ~45 minutes total)</p>
                        <button style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 0.9em;">Watch Videos</button>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b;">
                        <h4 style="margin: 0 0 8px 0; color: #d97706;">🧪 Home Experiment</h4>
                        <p style="margin: 0 0 8px 0;">Simple chlorophyll extraction using spinach leaves - safe kitchen science!</p>
                        <button style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 0.9em;">Get Instructions</button>
                    </div>
                    
                    <div style="background: #fdf2f8; padding: 15px; border-radius: 10px; border-left: 4px solid #ec4899;">
                        <h4 style="margin: 0 0 8px 0; color: #be185d;">📖 Recommended Reading</h4>
                        <p style="margin: 0 0 8px 0;">"The Omnivore's Dilemma (Young Readers Edition)" - connects plants to food systems</p>
                        <button style="background: #ec4899; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 0.9em;">Find at Library</button>
                    </div>
                </div>
                
                <div style="background: rgba(102, 126, 234, 0.05); padding: 15px; border-radius: 10px; margin-top: 20px;">
                    <p style="margin: 0; font-style: italic; color: #4b5563;"><strong>Ahmed's Note:</strong> "These resources will help Maria dive deeper into the questions she asked. The virtual lab is especially great for visual learners!"</p>
                </div>
            </div>
            <button onclick="closeModal()" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-top: 1rem;">Close Resources</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function viewEssayProgress(tutorId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <h3><i class="fas fa-chart-line"></i> Maria's Writing Progress with Sarah M.</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">📈 Overall Writing Improvement: +45%</h4>
                    <p style="margin: 0; opacity: 0.9;">Over 6 sessions with Sarah M.</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 2em; color: #22c55e;">92%</div>
                        <div style="color: #16a34a; font-weight: 600;">Grammar Accuracy</div>
                        <small style="color: #6b7280;">+38% improvement</small>
                    </div>
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 2em; color: #3b82f6;">A-</div>
                        <div style="color: #2563eb; font-weight: 600;">Essay Structure</div>
                        <small style="color: #6b7280;">Up from B-</small>
                    </div>
                </div>
                
                <h4>📝 Recent Essays & Feedback:</h4>
                <div style="display: grid; gap: 12px;">
                    <div style="background: white; border: 2px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="color: var(--primary);">Environmental Protection Essay</strong>
                            <span style="background: #22c55e; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8em;">A-</span>
                        </div>
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 0.9em;">Persuasive essay • Oct 24, 2025</p>
                        <p style="margin: 0; font-style: italic; color: #4b5563;">"Strong thesis and excellent use of evidence. Great improvement in paragraph transitions!"</p>
                    </div>
                    
                    <div style="background: white; border: 2px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="color: var(--primary);">Character Analysis: To Kill a Mockingbird</strong>
                            <span style="background: #f59e0b; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8em;">B+</span>
                        </div>
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 0.9em;">Literary analysis • Oct 20, 2025</p>
                        <p style="margin: 0; font-style: italic; color: #4b5563;">"Good analysis of Atticus's character. Work on incorporating more textual evidence."</p>
                    </div>
                </div>
                
                <div style="background: rgba(245, 158, 11, 0.05); padding: 15px; border-radius: 10px; margin-top: 20px;">
                    <h4 style="margin: 0 0 8px 0; color: #d97706;">🎯 Next Goals:</h4>
                    <ul style="margin: 0; color: #4b5563;">
                        <li>Practice incorporating counterarguments in persuasive essays</li>
                        <li>Work on varied sentence structure</li>
                        <li>Continue building vocabulary through reading</li>
                    </ul>
                </div>
            </div>
            <button onclick="closeModal()" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-top: 1rem;">Close Progress</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function viewAllComments() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 80vh; overflow-y: auto;">
            <h3><i class="fas fa-comment-medical"></i> All Volunteer Comments & Feedback (15 total)</h3>
            <div style="text-align: left; margin: 1rem 0;">
                <div style="display: grid; gap: 15px;">
                    ${Array.from({length: 8}, (_, i) => `
                        <div style="background: white; border: 2px solid rgba(102, 126, 234, 0.1); border-radius: 12px; padding: 15px;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, ${['#667eea, #764ba2', '#22c55e, #16a34a', '#f59e0b, #d97706'][i % 3]}); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                    ${['JS', 'AT', 'SM', 'ML', 'KP'][i % 5]}
                                </div>
                                <div style="flex: 1;">
                                    <strong style="color: var(--primary);">${['Jessica S.', 'Ahmed T.', 'Sarah M.', 'Mike L.', 'Kate P.'][i % 5]}</strong>
                                    <div style="color: #6b7280; font-size: 0.9em;">${['Math', 'Science', 'English', 'History', 'Art'][i % 5]} • ${['Today', 'Yesterday', '2 days ago', '3 days ago', '1 week ago'][i % 5]}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #f59e0b;">⭐⭐⭐⭐⭐</div>
                                    <div style="font-size: 0.8em; color: #6b7280;">5.0/5</div>
                                </div>
                            </div>
                            <h5 style="margin: 0 0 8px 0; color: var(--primary);">${['Quadratic Equations', 'Cell Biology', 'Essay Writing', 'World War II', 'Color Theory'][i % 5]}</h5>
                            <p style="margin: 0 0 10px 0; color: #4b5563; line-height: 1.5;">${['Great problem-solving skills shown today!', 'Excellent questions about photosynthesis!', 'Writing structure much improved!', 'Strong understanding of historical context!', 'Creative use of color combinations!'][i % 5]}</p>
                            <div style="display: flex; gap: 8px;">
                                <span style="background: rgba(34, 197, 94, 0.1); color: #16a34a; padding: 3px 8px; border-radius: 10px; font-size: 0.8em;">✅ Strong Progress</span>
                                ${i % 2 === 0 ? '<span style="background: rgba(59, 130, 246, 0.1); color: #2563eb; padding: 3px 8px; border-radius: 10px; font-size: 0.8em;">📚 Extra Resources</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #6b7280;">
                    <p>Showing 8 of 15 comments • <a href="#" style="color: var(--primary);">Load More Comments</a></p>
                </div>
            </div>
            <button onclick="closeModal()" style="background: #667eea; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; margin-top: 1rem;">Close All Comments</button>
        </div>
    `;
    document.body.appendChild(modal);
}