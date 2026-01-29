// Test script for Bun v1.3.7 CPU profiling
// This will generate both Chrome DevTools and Markdown profiles

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function heavyComputation() {
  console.log("Starting heavy computation...");
  const result = fibonacci(35);
  console.log(`Fibonacci result: ${result}`);
}

function stringOperations() {
  const texts = [];
  for (let i = 0; i < 1000; i++) {
    texts.push(`item-${i}`.padStart(10, '0'));
  }
  return texts.join(', ');
}

function arrayOperations() {
  const arrays = [];
  for (let i = 0; i < 100; i++) {
    arrays.push(Array.from({length: 100}, (_, j) => j * i));
  }
  return arrays.flat();
}

// Run performance-intensive operations
heavyComputation();
stringOperations();
arrayOperations();

console.log("Profile test completed!");
