// Simple test to verify search functionality
const testFunctions = `
// Check if openSearch function exists
if (typeof openSearch !== 'function') {
  console.error('openSearch is not defined');
} else {
  console.log('openSearch is defined');
}

// Test the function
try {
  if (typeof openSearch === 'function') {
    console.log('Testing openSearch function...');
    openSearch();
    console.log('openSearch called successfully');
  }
} catch (err) {
  console.error('Error calling openSearch:', err);
}

// Check if performSearch function exists
if (typeof performSearch !== 'function') {
  console.error('performSearch is not defined');
} else {
  console.log('performSearch is defined');
}

// Test the function
try {
  if (typeof performSearch === 'function') {
    console.log('Testing performSearch function...');
    performSearch('test query');
    console.log('performSearch called successfully');
  }
} catch (err) {
  console.error('Error calling performSearch:', err);
}

console.log('Search functionality test completed');
`;

eval(testFunctions);