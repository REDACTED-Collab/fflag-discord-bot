export const flagDescriptions: { [key: string]: string } = {
    // Graphics & Performance
    'DFlagDisablePostFx': 'Disables post-processing effects to improve performance',
    'FFlagEnableGPUAcceleration': 'Enables GPU hardware acceleration for better graphics performance',
    'DFlagGraphicsQuality': 'Controls the overall graphics quality level',
    'FFlagDebugGraphicsPrefer': 'Sets graphics API preference (DirectX/Vulkan/Metal)',
    'DFlagEnableHDRTextures': 'Enables high dynamic range textures for enhanced visuals',
    
    // Network & Connectivity
    'DFlagNetworkOptimization': 'Enables network optimization features for better connectivity',
    'FFlagPreferredRegion': 'Sets preferred server region for connections',
    'DFlagConnectionQuality': 'Controls connection quality requirements',
    
    // UI & Experience
    'FFlagEnableInGameMenu': 'Enables the new in-game menu system',
    'DFlagUserInterface': 'Controls UI rendering and behavior',
    'FFlagAnimationSystem': 'Controls the animation system features',
    
    // Security & Safety
    'DFlagSecurityProtocol': 'Controls security protocol settings',
    'FFlagAntiCheat': 'Enables anti-cheat features',
    'DFlagContentFilter': 'Controls content filtering settings',
    
    // Audio
    'FFlagSoundSystem': 'Controls the sound system implementation',
    'DFlagAudioQuality': 'Sets audio quality and processing level',
    'FFlagVoiceChat': 'Controls voice chat features',
    
    // Physics & Engine
    'DFlagPhysicsSolver': 'Controls physics solver implementation',
    'FFlagNewPhysics': 'Enables new physics engine features',
    'DFlagCollisionSystem': 'Controls collision detection system',
    
    // Memory & Resources
    'FFlagMemoryOptimization': 'Enables memory usage optimizations',
    'DFlagResourceLoading': 'Controls resource loading behavior',
    'FFlagAssetStreaming': 'Controls asset streaming system',
    
    // Developer Features
    'DFlagDevConsole': 'Enables developer console features',
    'FFlagDebugMode': 'Enables debug mode features',
    'DFlagProfiler': 'Controls profiler tools',
    
    // Platform Specific
    'FFlagMobileOptimization': 'Mobile-specific optimizations',
    'DFlagConsoleFeatures': 'Console-specific features',
    'FFlagPlatformGraphics': 'Platform-specific graphics settings',
    
    // Experimental Features
    'DFlagExperimental': 'Enables experimental features',
    'FFlagBetaFeatures': 'Enables beta testing features',
    'DFlagPrototype': 'Enables prototype features',
    
    // Analytics & Telemetry
    'FFlagTelemetry': 'Controls telemetry data collection',
    'DFlagAnalytics': 'Controls analytics systems',
    'FFlagMetrics': 'Controls performance metrics collection',
    
    // Social Features
    'DFlagSocialFeatures': 'Controls social interaction features',
    'FFlagChat': 'Controls chat system features',
    'DFlagFriendSystem': 'Controls friend system features',
    
    // Game Services
    'FFlagMatchmaking': 'Controls matchmaking system',
    'DFlagGameJoin': 'Controls game joining behavior',
    'FFlagServerSelection': 'Controls server selection logic'
};

// Categories for better organization
export const flagCategories = {
    'Graphics': [
        'DFlagDisablePostFx',
        'FFlagEnableGPUAcceleration',
        'DFlagGraphicsQuality',
        'FFlagDebugGraphicsPrefer',
        'DFlagEnableHDRTextures'
    ],
    'Network': [
        'DFlagNetworkOptimization',
        'FFlagPreferredRegion',
        'DFlagConnectionQuality'
    ],
    'UI': [
        'FFlagEnableInGameMenu',
        'DFlagUserInterface',
        'FFlagAnimationSystem'
    ],
    'Security': [
        'DFlagSecurityProtocol',
        'FFlagAntiCheat',
        'DFlagContentFilter'
    ],
    'Audio': [
        'FFlagSoundSystem',
        'DFlagAudioQuality',
        'FFlagVoiceChat'
    ],
    'Physics': [
        'DFlagPhysicsSolver',
        'FFlagNewPhysics',
        'DFlagCollisionSystem'
    ],
    'Memory': [
        'FFlagMemoryOptimization',
        'DFlagResourceLoading',
        'FFlagAssetStreaming'
    ],
    'Developer': [
        'DFlagDevConsole',
        'FFlagDebugMode',
        'DFlagProfiler'
    ],
    'Platform': [
        'FFlagMobileOptimization',
        'DFlagConsoleFeatures',
        'FFlagPlatformGraphics'
    ],
    'Experimental': [
        'DFlagExperimental',
        'FFlagBetaFeatures',
        'DFlagPrototype'
    ],
    'Analytics': [
        'FFlagTelemetry',
        'DFlagAnalytics',
        'FFlagMetrics'
    ],
    'Social': [
        'DFlagSocialFeatures',
        'FFlagChat',
        'DFlagFriendSystem'
    ],
    'GameServices': [
        'FFlagMatchmaking',
        'DFlagGameJoin',
        'FFlagServerSelection'
    ]
};

// Get description for a flag
export function getFlagDescription(flagName: string): string {
    return flagDescriptions[flagName] || 'No description available';
}

// Get category for a flag
export function getFlagCategory(flagName: string): string {
    for (const [category, flags] of Object.entries(flagCategories)) {
        if (flags.includes(flagName)) {
            return category;
        }
    }
    return 'Other';
}

// Get all flags in a category
export function getFlagsByCategory(category: string): string[] {
    return flagCategories[category as keyof typeof flagCategories] || [];
}
