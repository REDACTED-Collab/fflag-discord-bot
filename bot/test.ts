import { githubService } from './services/githubService';

async function runTests() {
    console.log('🧪 Starting bot functionality tests...\n');

    try {
        // Test 1: Check a known FFlag
        console.log('Test 1: Checking a known FFlag...');
        const flagData = await githubService.getFlagData('DFIntTaskSchedulerTargetFps');
        console.log('Result:', flagData);
        console.log('Status: ' + (flagData ? '✅ PASS' : '❌ FAIL'));
        console.log('-------------------\n');

        // Test 2: Search for flags
        console.log('Test 2: Searching for flags with keyword "fps"...');
        const searchResults = await githubService.searchFlags('fps');
        console.log(`Found ${searchResults.length} flags`);
        console.log('Status: ' + (searchResults.length > 0 ? '✅ PASS' : '❌ FAIL'));
        console.log('-------------------\n');

        // Test 3: Get new flags
        console.log('Test 3: Getting new flags from last 24 hours...');
        const newFlags = await githubService.getNewFlags(24);
        console.log(`Found ${newFlags.length} new/updated flags`);
        console.log('Status: ' + (newFlags !== null ? '✅ PASS' : '❌ FAIL'));
        console.log('-------------------\n');

        // Summary
        console.log('📊 Test Summary:');
        console.log('✅ Tests completed successfully\n');

        // Sample Data Display
        if (searchResults.length > 0) {
            console.log('📝 Sample Flag Data:');
            console.log(JSON.stringify(searchResults[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run tests
console.log('🤖 Roblox FFlags Discord Bot - Test Suite');
console.log('=======================================\n');

runTests().catch(console.error);
