// Simple test to check search functionality in browser context
console.log('=== Testing Search Functions ===');

// Test if functions are accessible in global scope
console.log('openSearch:', typeof openSearch);
console.log('performSearch:', typeof performSearch);
console.log('closeSearch:', typeof closeSearch);

// Test if searchOpen variable is accessible
console.log('searchOpen:', typeof searchOpen);

// Test if search elements exist
console.log('searchInputEl:', !!document.getElementById('searchInput'));
console.log('searchBarEl:', !!document.getElementById('searchBar'));
console.log('searchResultsEl:', !!document.getElementById('searchResults'));

console.log('=== Test Complete ===');