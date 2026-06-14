import { MatchSimulator } from '../engine/MatchSimulator';

console.log('--- Starting Imperial Stress Test & Statistics ---');

const simulator = new MatchSimulator();

console.log('\nRunning 100 matches...');
const stats100 = simulator.simulateManyMatches(100);
console.log('Statistics (100 matches):');
console.log(JSON.stringify(stats100, null, 2));

console.log('\nRunning 1000 matches...');
const startTime = Date.now();
const stats1000 = simulator.simulateManyMatches(1000);
const endTime = Date.now();
console.log(`Completed in ${endTime - startTime}ms`);

console.log('Statistics (1000 matches):');
console.log(JSON.stringify(stats1000, null, 2));

console.log('\n--- Stress Test Successful ---');
